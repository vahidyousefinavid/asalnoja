import { CatalogView } from "@/components/store/catalog-view";
import { getCategories, getProducts } from "@/lib/catalog";
import { getCurrencyForLocale, getT } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[locale]/products">) {
  const { locale } = await params;
  const t = await getT(locale);
  return buildMetadata({ locale, path: "/products", title: t("shop.title"), description: t("shop.subtitle") });
}

export default async function ProductsPage({ params }: PageProps<"/[locale]/products">) {
  const { locale } = await params;
  const [t, currency, products, categories, settings] = await Promise.all([
    getT(locale),
    getCurrencyForLocale(locale),
    getProducts(locale),
    getCategories(locale),
    getSettings(),
  ]);
  return (
    <CatalogView
      locale={locale}
      t={t}
      currency={currency}
      products={products}
      categories={categories}
      title={t("shop.title")}
      subtitle={t("shop.subtitle")}
      siteUrl={settings.siteUrl}
    />
  );
}
