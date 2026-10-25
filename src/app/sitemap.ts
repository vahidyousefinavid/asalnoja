import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/catalog";
import { getDefaultLanguage, getEnabledLanguages } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

// همیشه از دیتابیس خوانده می‌شود تا build به دیتابیس نیاز نداشته باشد
export const dynamic = "force-dynamic";


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, langs, def] = await Promise.all([getSettings(), getEnabledLanguages(), getDefaultLanguage()]);
  const codes = langs.map((l) => l.code);
  const lead = def?.code ?? codes[0];
  const [products, categories] = await Promise.all([getProducts(lead), getCategories(lead)]);

  const entry = (
    path: string,
    available: string[],
    opts: Partial<MetadataRoute.Sitemap[number]> = {},
  ): MetadataRoute.Sitemap =>
    available.map((code) => ({
      url: absoluteUrl(settings.siteUrl, `/${code}${path}`),
      alternates: {
        languages: Object.fromEntries(available.map((c) => [c, absoluteUrl(settings.siteUrl, `/${c}${path}`)])),
      },
      ...opts,
    }));

  return [
    ...entry("", codes, { changeFrequency: "weekly", priority: 1 }),
    ...entry("/products", codes, { changeFrequency: "daily", priority: 0.9 }),
    ...entry("/about", codes, { changeFrequency: "monthly", priority: 0.4 }),
    ...categories.flatMap((c) =>
      entry(`/category/${c.slug}`, c.locales.filter((l) => codes.includes(l)), { changeFrequency: "weekly", priority: 0.7 }),
    ),
    ...products.flatMap((p) =>
      entry(`/products/${p.slug}`, p.locales.filter((l) => codes.includes(l)), {
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
        images: p.images.map((i) => absoluteUrl(settings.siteUrl, i)),
      }),
    ),
  ];
}
