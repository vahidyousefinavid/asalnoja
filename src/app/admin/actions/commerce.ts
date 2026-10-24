"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { gatewayIds, orderStatuses, type GatewayId } from "@/db/schema";
import type { ActionState } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { defaultMessages } from "@/i18n/defaults";
import { adapters } from "@/lib/payments";
import { refreshStore } from "@/lib/revalidate";
import { settingDefaults } from "@/lib/settings";

/* ---------------- سفارش‌ها ---------------- */

export async function updateOrderStatus(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const status = z.enum(orderStatuses).safeParse(form.get("status"));
  if (!status.success) return { ok: false, message: "وضعیت نامعتبر است." };
  const id = String(form.get("id"));
  await db
    .update(schema.orders)
    .set({ status: status.data, ...(status.data === "paid" ? { paidAt: new Date() } : {}) })
    .where(eq(schema.orders.id, id));
  revalidatePath("/admin/orders");
  return { ok: true, message: "وضعیت سفارش به‌روز شد." };
}

/* ---------------- زبان‌ها ---------------- */

const langSchema = z.object({
  code: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{2,3}(-[a-z0-9]{2,4})?$/, "کد زبان مثل en، tr یا pt-br"),
  name: z.string().trim().min(1, "نام لازم است"),
  nativeName: z.string().trim().min(1, "نام بومی لازم است"),
  dir: z.enum(["rtl", "ltr"]),
  currencyCode: z.string().min(3),
  sortOrder: z.coerce.number().int(),
});

export async function addLanguage(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = langSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const data = parsed.data;
  const exists = await db.select().from(schema.languages).where(eq(schema.languages.code, data.code));
  if (exists.length) return { ok: false, message: "این زبان قبلاً اضافه شده است." };

  await db.insert(schema.languages).values({ ...data, enabled: false });

  // کلیدهای ترجمه از زبان مبدأ کپی می‌شوند تا مدیر فقط متن‌ها را ترجمه کند
  const source = String(form.get("copyFrom") || "en");
  const builtIn = (defaultMessages as Record<string, Record<string, string>>)[data.code];
  const rows = await db.select().from(schema.translations).where(eq(schema.translations.locale, source));
  const base: Record<string, string> = { ...defaultMessages.en, ...Object.fromEntries(rows.map((r) => [r.key, r.value])), ...builtIn };
  await db
    .insert(schema.translations)
    .values(Object.entries(base).map(([key, value]) => ({ locale: data.code, key, value })))
    .onConflictDoNothing();

  refreshStore();
  return { ok: true, message: `زبان «${data.name}» اضافه شد. متن‌ها را ترجمه کنید و بعد آن را فعال کنید.` };
}

export async function updateLanguage(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = langSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { code, ...rest } = parsed.data;
  const enabled = form.get("enabled") === "on";
  const makeDefault = form.get("isDefault") === "on";
  const [current] = await db.select().from(schema.languages).where(eq(schema.languages.code, code));
  if (!current) return { ok: false, message: "زبان پیدا نشد." };
  if (current.isDefault && !enabled) return { ok: false, message: "زبان پیش‌فرض را نمی‌توان غیرفعال کرد." };

  if (makeDefault && !current.isDefault) {
    await db.update(schema.languages).set({ isDefault: false }).where(ne(schema.languages.code, code));
  }
  await db
    .update(schema.languages)
    .set({ ...rest, enabled: enabled || makeDefault, isDefault: current.isDefault || makeDefault })
    .where(eq(schema.languages.code, code));
  refreshStore();
  return { ok: true, message: "ذخیره شد." };
}

export async function deleteLanguage(form: FormData) {
  await requireAdmin();
  const code = String(form.get("code"));
  await db.delete(schema.languages).where(and(eq(schema.languages.code, code), eq(schema.languages.isDefault, false)));
  refreshStore();
  revalidatePath("/admin/languages");
}

export async function saveTranslations(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const locale = String(form.get("locale"));
  const entries = [...form.entries()].filter(([k]) => k.startsWith("k:")).map(([k, v]) => [k.slice(2), String(v)] as const);
  for (const [key, value] of entries) {
    await db
      .insert(schema.translations)
      .values({ locale, key, value })
      .onConflictDoUpdate({ target: [schema.translations.locale, schema.translations.key], set: { value } });
  }
  refreshStore();
  return { ok: true, message: "ترجمه‌ها ذخیره شد." };
}

/* ---------------- ارزها ---------------- */

export async function saveCurrency(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      code: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "کد ارز سه حرفی است؛ مثل USD"),
      name: z.string().trim().min(1, "نام لازم است"),
      symbol: z.string().trim().min(1, "نماد لازم است"),
      rate: z.coerce.number().positive("نرخ باید بزرگتر از صفر باشد"),
      decimals: z.coerce.number().int().min(0).max(4),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { code, ...rest } = parsed.data;
  const [cur] = await db.select().from(schema.currencies).where(eq(schema.currencies.code, code));
  if (cur?.isBase) rest.rate = 1;
  await db.insert(schema.currencies).values(parsed.data).onConflictDoUpdate({ target: schema.currencies.code, set: rest });
  refreshStore();
  revalidatePath("/admin/currencies");
  return { ok: true, message: `ارز ${code} ذخیره شد.` };
}

/* ---------------- کشورها و نگاشت درگاه ---------------- */

export async function saveCountry(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      code: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "کد کشور دو حرفی است؛ مثل IR"),
      name: z.string().trim().min(1, "نام کشور لازم است"),
      currencyCode: z.string().min(3),
      shippingCost: z.coerce.number().int().min(0),
      freeShippingOver: z.preprocess((v) => (v === "" ? null : Number(v)), z.number().int().min(0).nullable()),
      sortOrder: z.coerce.number().int(),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { code, ...rest } = parsed.data;
  const enabled = form.get("enabled") === "on";
  await db
    .insert(schema.countries)
    .values({ ...parsed.data, enabled })
    .onConflictDoUpdate({ target: schema.countries.code, set: { ...rest, enabled } });

  const selected = form.getAll("gateways").map(String).filter((g): g is GatewayId => gatewayIds.includes(g as GatewayId));
  await db.delete(schema.countryGateways).where(eq(schema.countryGateways.countryCode, code));
  if (selected.length)
    await db.insert(schema.countryGateways).values(selected.map((gatewayId) => ({ countryCode: code, gatewayId })));

  revalidatePath("/admin/countries");
  return { ok: true, message: `تنظیمات ${parsed.data.name} ذخیره شد.` };
}

export async function deleteCountry(form: FormData) {
  await requireAdmin();
  await db.delete(schema.countries).where(eq(schema.countries.code, String(form.get("code"))));
  revalidatePath("/admin/countries");
}

/* ---------------- درگاه‌ها ---------------- */

export async function saveGateway(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.enum(gatewayIds).parse(form.get("id"));
  const [gw] = await db.select().from(schema.paymentGateways).where(eq(schema.paymentGateways.id, id));
  const config = { ...(gw?.config ?? {}) };
  for (const f of adapters[id].fields) {
    const v = String(form.get(`cfg.${f.key}`) ?? "").trim();
    // فیلد مخفی خالی یعنی «تغییر نده»
    if (f.secret && !v) continue;
    config[f.key] = v;
  }
  const enabled = form.get("enabled") === "on";
  const missing = adapters[id].fields.filter((f) => !config[f.key]);
  if (enabled && missing.length) return { ok: false, message: `برای فعال‌سازی، «${missing[0].label}» را وارد کنید.` };

  await db
    .update(schema.paymentGateways)
    .set({ enabled, sandbox: form.get("sandbox") === "on", config, name: String(form.get("name") || gw?.name || id) })
    .where(eq(schema.paymentGateways.id, id));
  revalidatePath("/admin/payments");
  return { ok: true, message: "تنظیمات درگاه ذخیره شد." };
}

/* ---------------- تنظیمات سایت و رمز عبور ---------------- */

export async function saveSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  for (const key of Object.keys(settingDefaults)) {
    if (!form.has(key)) continue;
    let value = String(form.get(key) ?? "").trim();
    if (key === "siteUrl") {
      try {
        value = new URL(value).origin;
      } catch {
        return { ok: false, message: "آدرس سایت باید کامل باشد؛ مثل https://asalnoja.ir" };
      }
    }
    await db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value } });
  }
  refreshStore();
  return { ok: true, message: "تنظیمات ذخیره شد." };
}

export async function changePassword(_prev: ActionState, form: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 10) return { ok: false, message: "رمز جدید باید حداقل ۱۰ نویسه باشد." };
  const [user] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, session.uid));
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return { ok: false, message: "رمز فعلی درست نیست." };
  await db.update(schema.adminUsers).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(schema.adminUsers.id, user.id));
  return { ok: true, message: "رمز عبور تغییر کرد." };
}
