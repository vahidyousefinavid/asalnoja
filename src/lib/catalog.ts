import { cache } from "react";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Product, ProductTranslation } from "@/db/schema";
import { getDefaultLanguage } from "./i18n";

export type LocalizedProduct = Product & {
  t: ProductTranslation;
  /** زبان‌هایی که ترجمه واقعی دارند (برای hreflang) */
  locales: string[];
  categorySlug: string | null;
};

export type LocalizedCategory = {
  id: number;
  slug: string;
  image: string | null;
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  locales: string[];
};

async function localize(rows: Product[], locale: string): Promise<LocalizedProduct[]> {
  if (!rows.length) return [];
  const def = (await getDefaultLanguage())?.code ?? "fa";
  const ids = rows.map((r) => r.id);
  const [trs, cats] = await Promise.all([
    db.select().from(schema.productTranslations).where(inArray(schema.productTranslations.productId, ids)),
    db.select({ id: schema.categories.id, slug: schema.categories.slug }).from(schema.categories),
  ]);
  return rows.flatMap((p) => {
    const mine = trs.filter((t) => t.productId === p.id);
    const t = mine.find((x) => x.locale === locale) ?? mine.find((x) => x.locale === def) ?? mine[0];
    if (!t) return [];
    return [
      {
        ...p,
        t,
        locales: mine.map((x) => x.locale),
        categorySlug: cats.find((c) => c.id === p.categoryId)?.slug ?? null,
      },
    ];
  });
}

export const getProducts = cache(
  async (locale: string, opts: { categoryId?: number; featured?: boolean; limit?: number } = {}) => {
    const where = [eq(schema.products.status, "published")];
    if (opts.categoryId) where.push(eq(schema.products.categoryId, opts.categoryId));
    if (opts.featured) where.push(eq(schema.products.featured, true));
    const rows = await db
      .select()
      .from(schema.products)
      .where(and(...where))
      .orderBy(asc(schema.products.sortOrder), desc(schema.products.createdAt))
      .limit(opts.limit ?? 200);
    return localize(rows, locale);
  },
);

export const getProduct = cache(async (slug: string, locale: string) => {
  const rows = await db
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.slug, slug), eq(schema.products.status, "published")));
  return (await localize(rows, locale))[0];
});

export const getRelatedProducts = cache(async (product: Product, locale: string) => {
  const rows = await db
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.status, "published"), ne(schema.products.id, product.id)))
    .orderBy(asc(schema.products.sortOrder))
    .limit(4);
  return localize(rows, locale);
});

export const getCategories = cache(async (locale: string): Promise<LocalizedCategory[]> => {
  const def = (await getDefaultLanguage())?.code ?? "fa";
  const [cats, trs] = await Promise.all([
    db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder)),
    db.select().from(schema.categoryTranslations),
  ]);
  return cats.flatMap((c) => {
    const mine = trs.filter((t) => t.categoryId === c.id);
    const t = mine.find((x) => x.locale === locale) ?? mine.find((x) => x.locale === def) ?? mine[0];
    if (!t) return [];
    return [
      {
        id: c.id,
        slug: c.slug,
        image: c.image,
        name: t.name,
        description: t.description,
        seoTitle: t.seoTitle,
        seoDescription: t.seoDescription,
        locales: mine.map((x) => x.locale),
      },
    ];
  });
});
