import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { defaultMessages } from "@/i18n/defaults";
import { translator, type Messages } from "./i18n-client";

export { translator, type Messages };

export const getLanguages = cache(async () =>
  db.select().from(schema.languages).orderBy(asc(schema.languages.sortOrder)),
);

export const getEnabledLanguages = cache(async () =>
  (await getLanguages()).filter((l) => l.enabled),
);

export const getDefaultLanguage = cache(async () => {
  const langs = await getEnabledLanguages();
  return langs.find((l) => l.isDefault) ?? langs[0];
});

export const getLanguage = cache(async (code: string) =>
  (await getEnabledLanguages()).find((l) => l.code === code),
);

/** پیام‌های یک زبان با زنجیره جایگزینی: زبان ← زبان پیش‌فرض ← متن‌های کد */
export const getMessages = cache(async (locale: string): Promise<Messages> => {
  const def = await getDefaultLanguage();
  const rows = await db.select().from(schema.translations);
  const pick = (code: string) =>
    Object.fromEntries(rows.filter((r) => r.locale === code).map((r) => [r.key, r.value]));
  const builtIn = (code: string) =>
    (defaultMessages as Record<string, Messages>)[code] ?? {};
  return {
    ...defaultMessages.en,
    ...builtIn(def?.code ?? "fa"),
    ...(def ? pick(def.code) : {}),
    ...builtIn(locale),
    ...pick(locale),
  };
});

export async function getT(locale: string) {
  return translator(await getMessages(locale));
}

/** کدهای زبانی که Intl نمی‌شناسد را به en برمی‌گرداند */
export function intlLocale(locale: string) {
  try {
    return Intl.NumberFormat.supportedLocalesOf([locale]).length ? locale : "en";
  } catch {
    return "en";
  }
}

export async function getCurrencyForLocale(locale: string) {
  const lang = await getLanguage(locale);
  const code = lang?.currencyCode ?? "IRT";
  const [cur] = await db
    .select()
    .from(schema.currencies)
    .where(eq(schema.currencies.code, code));
  return cur ?? { code: "IRT", name: "Toman", symbol: "تومان", rate: 1, decimals: 0, isBase: true };
}
