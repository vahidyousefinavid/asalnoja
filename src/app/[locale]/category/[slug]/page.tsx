import { notFound } from "next/navigation";
import { CatalogView } from "@/components/store/catalog-view";
import { getCategories, getProducts } from "@/lib/catalog";
import { getCurrencyForLocale, getT } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { skipPrerender } from "@/lib/build";

export const revalidate = 300;

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (skipPrerender) return [];
  return (await getCategories(params.locale)).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/category/[slug]">) {
  const { locale, slug } = await params;
  const cat = (await getCategories(locale)).find((c) => c.slug === slug);
  if (!cat) return {};
  return buildMetadata({
    locale,
    path: `/category/${slug}`,
    title: cat.seoTitle || cat.name,
    description: cat.seoDescription || cat.description,
    image: cat.image,
    locales: cat.locales,
  });
}

export default async function CategoryPage({ params }: PageProps<"/[locale]/category/[slug]">) {
  const { locale, slug } = await params;
  const categories = await getCategories(locale);
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();
  const [t, currency, products, settings] = await Promise.all([
    getT(locale),
    getCurrencyForLocale(locale),
    getProducts(locale, { categoryId: cat.id }),
    getSettings(),
  ]);
  return (
    <CatalogView
      locale={locale}
      t={t}
      currency={currency}
      products={products}
      categories={categories}
      active={slug}
      title={cat.name}
      subtitle={cat.description}
      siteUrl={settings.siteUrl}
    />
  );
}
