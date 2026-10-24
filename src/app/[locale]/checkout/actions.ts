"use server";

import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { gatewayIds } from "@/db/schema";
import { getDefaultLanguage, getT } from "@/lib/i18n";
import { convert } from "@/lib/money";
import {
  decrementStock,
  getCheckoutOptions,
  newOrderId,
  newToken,
  productsByIds,
  requestOrigin,
  shippingFor,
} from "@/lib/orders";
import { adapters, isOnline } from "@/lib/payments";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  values?: Record<string, string>;
};

const cartSchema = z
  .array(z.object({ id: z.number().int().positive(), qty: z.number().int().min(1).max(99) }))
  .max(50);

export async function placeOrder(locale: string, _prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const t = await getT(locale);
  const values = Object.fromEntries(
    ["name", "phone", "email", "country", "city", "address", "postalCode", "notes", "gateway"].map((k) => [
      k,
      String(form.get(k) ?? "").trim(),
    ]),
  );

  const fields = z
    .object({
      name: z.string().min(2, t("checkout.required")).max(120),
      phone: z.string().regex(/^[+\d\s()\-۰-۹]{7,20}$/, t("checkout.invalidPhone")),
      email: z.union([z.literal(""), z.email(t("checkout.invalidEmail"))]),
      country: z.string().length(2, t("checkout.required")),
      city: z.string().min(2, t("checkout.required")).max(80),
      address: z.string().min(8, t("checkout.required")).max(500),
      postalCode: z.string().max(20),
      notes: z.string().max(1000),
      gateway: z.enum(gatewayIds, { error: t("checkout.required") }),
    })
    .safeParse(values);

  if (!fields.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of fields.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors, values };
  }
  const f = fields.data;

  let cart: z.infer<typeof cartSchema>;
  try {
    cart = cartSchema.parse(JSON.parse(String(form.get("cart") ?? "[]")));
  } catch {
    return { error: t("checkout.emptyCart"), values };
  }
  if (!cart.length) return { error: t("checkout.emptyCart"), values };

  // قیمت‌ها و موجودی همیشه از دیتابیس خوانده می‌شوند، نه از مرورگر
  const products = await productsByIds(cart.map((c) => c.id));
  const def = (await getDefaultLanguage())?.code ?? "fa";
  const names = await db
    .select()
    .from(schema.productTranslations)
    .where(inArray(schema.productTranslations.productId, products.map((p) => p.id)));
  const nameOf = (id: number) =>
    (names.find((n) => n.productId === id && n.locale === locale) ?? names.find((n) => n.productId === id && n.locale === def))?.name ??
    `#${id}`;

  const lines = [];
  for (const c of cart) {
    const p = products.find((x) => x.id === c.id);
    if (!p) continue;
    if (p.stock < c.qty) return { error: t("checkout.stockError", { name: nameOf(p.id) }), values };
    lines.push({ product: p, qty: c.qty });
  }
  if (!lines.length) return { error: t("checkout.emptyCart"), values };

  const country = (await getCheckoutOptions()).find((c) => c.code === f.country);
  if (!country || !country.gateways.includes(f.gateway)) return { error: t("checkout.noGateway"), values };

  const [gateway] = await db.select().from(schema.paymentGateways).where(eq(schema.paymentGateways.id, f.gateway));
  const adapter = adapters[f.gateway];
  const chargeCode = adapter.chargeCurrency(country.currency.code);
  const [chargeCurrency] = await db.select().from(schema.currencies).where(eq(schema.currencies.code, chargeCode));
  if (!chargeCurrency) return { error: t("checkout.gatewayError"), values };

  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const shipping = shippingFor(country, subtotal);
  const total = subtotal + shipping;

  const order = {
    id: newOrderId(),
    accessToken: newToken(),
    customerName: f.name,
    phone: f.phone,
    email: f.email,
    countryCode: f.country,
    city: f.city,
    address: f.address,
    postalCode: f.postalCode,
    notes: f.notes,
    locale,
    currencyCode: chargeCurrency.code,
    rate: chargeCurrency.rate,
    subtotal,
    shipping,
    total,
    totalCharged: convert(total, chargeCurrency),
    gatewayId: f.gateway,
    status: "pending" as const,
  };

  await db.insert(schema.orders).values(order);
  await db.insert(schema.orderItems).values(
    lines.map((l) => ({ orderId: order.id, productId: l.product.id, name: nameOf(l.product.id), unitPrice: l.product.price, quantity: l.qty })),
  );

  const resultUrl = `/${locale}/order/${order.id}?t=${order.accessToken}`;

  if (!isOnline(f.gateway)) {
    await decrementStock(order.id);
    redirect(resultUrl);
  }

  const origin = await requestOrigin();
  let target: string;
  try {
    const started = await adapter.start!(
      { ...order, createdAt: new Date(), paidAt: null, paymentAuthority: null, paymentRef: null },
      gateway,
      `${origin}/api/payment/${f.gateway}/callback?order=${order.id}`,
      `${origin}/api/payment/${f.gateway}/callback?order=${order.id}&cancelled=1`,
    );
    if (started.kind !== "redirect") throw new Error("unexpected");
    await db.update(schema.orders).set({ paymentAuthority: started.authority }).where(eq(schema.orders.id, order.id));
    target = started.url;
  } catch (e) {
    console.error("[payment start]", e);
    await db.update(schema.orders).set({ status: "failed" }).where(eq(schema.orders.id, order.id));
    return { error: t("checkout.gatewayError"), values };
  }
  redirect(target);
}
