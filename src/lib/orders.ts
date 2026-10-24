import { and, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db, schema } from "@/db";
import type { GatewayId } from "@/db/schema";

/** درگاه‌های فعال هر کشور (هم در سطح کل درگاه و هم در نگاشت کشور) */
export async function getCheckoutOptions() {
  const [countries, gateways, mapping, currencies] = await Promise.all([
    db.select().from(schema.countries).where(eq(schema.countries.enabled, true)).orderBy(schema.countries.sortOrder),
    db.select().from(schema.paymentGateways).where(eq(schema.paymentGateways.enabled, true)).orderBy(schema.paymentGateways.sortOrder),
    db.select().from(schema.countryGateways),
    db.select().from(schema.currencies),
  ]);
  return countries.map((c) => ({
    code: c.code,
    name: c.name,
    currency: currencies.find((x) => x.code === c.currencyCode)!,
    shippingCost: c.shippingCost,
    freeShippingOver: c.freeShippingOver,
    gateways: gateways
      .filter((g) => mapping.some((m) => m.countryCode === c.code && m.gatewayId === g.id))
      .map((g) => g.id as GatewayId),
  }));
}

export type CheckoutCountry = Awaited<ReturnType<typeof getCheckoutOptions>>[number];

export function shippingFor(country: { shippingCost: number; freeShippingOver: number | null }, subtotal: number) {
  return country.freeShippingOver != null && subtotal >= country.freeShippingOver ? 0 : country.shippingCost;
}

export function newOrderId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(7));
  return "NJ-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function newToken() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(18))).toString("base64url");
}

export async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** کم کردن موجودی بعد از قطعی شدن سفارش */
export async function decrementStock(orderId: string) {
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
  for (const it of items) {
    if (!it.productId) continue;
    await db
      .update(schema.products)
      .set({ stock: sql`greatest(0, ${schema.products.stock} - ${it.quantity})` })
      .where(eq(schema.products.id, it.productId));
  }
}

export async function getOrderWithItems(id: string, token: string) {
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.id, id), eq(schema.orders.accessToken, token)));
  if (!order) return null;
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));
  return { order, items };
}

export async function productsByIds(ids: number[]) {
  if (!ids.length) return [];
  return db
    .select()
    .from(schema.products)
    .where(and(inArray(schema.products.id, ids), eq(schema.products.status, "published")));
}
