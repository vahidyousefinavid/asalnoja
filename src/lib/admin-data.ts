import { asc } from "drizzle-orm";
import { db, schema } from "@/db";

export async function adminLanguages() {
  const rows = await db.select().from(schema.languages).orderBy(asc(schema.languages.sortOrder));
  return rows.map((l) => ({
    code: l.code,
    name: l.name,
    nativeName: l.nativeName,
    dir: l.dir,
    isDefault: l.isDefault,
    enabled: l.enabled,
  }));
}

/** نام هر رکورد در زبان پیش‌فرض (یا اولین ترجمه موجود) */
export function pickName<T extends { locale: string; name: string }>(rows: T[], def: string) {
  return (rows.find((r) => r.locale === def) ?? rows[0])?.name ?? "—";
}

export async function adminCategories(def: string) {
  const [cats, trs] = await Promise.all([
    db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder)),
    db.select().from(schema.categoryTranslations),
  ]);
  return cats.map((c) => {
    const mine = trs.filter((t) => t.categoryId === c.id);
    return { ...c, name: pickName(mine, def), translations: mine };
  });
}
