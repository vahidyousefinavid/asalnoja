import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleAlert, CircleCheck, CircleX, FlaskConical, Leaf, Lock } from "lucide-react";
import { ImagePlaceholder } from "@/components/brand";
import { AddToCart } from "@/components/store/cart";
import { Gallery } from "@/components/store/gallery";
import { HarvestLabel } from "@/components/store/harvest-label";
import { ProductCard } from "@/components/store/product-card";
import { getCategories, getProduct, getProducts, getRelatedProducts } from "@/lib/catalog";
import { getCurrencyForLocale, getT } from "@/lib/i18n";
import { convert, formatMoney, formatNumber } from "@/lib/money";
import { absoluteUrl, buildMetadata, jsonLd } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const revalidate = 300;

/** همه محصولات در build ساخته می‌شوند؛ محصول جدید در اولین بازدید ساخته و کش می‌شود */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  return (await getProducts(params.locale)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/products/[slug]">) {
  const { locale, slug } = await params;
  const p = await getProduct(decodeURIComponent(slug), locale);
  if (!p) return {};
  return buildMetadata({
    locale,
    path: `/products/${p.slug}`,
    title: p.t.seoTitle || p.t.name,
    description: p.t.seoDescription || p.t.shortDescription,
    image: p.images[0],
    locales: p.locales,
  });
}

export default async function ProductPage({ params }: PageProps<"/[locale]/products/[slug]">) {
  const { locale, slug } = await params;
  const product = await getProduct(decodeURIComponent(slug), locale);
  if (!product) notFound();

  const [t, currency, related, categories, settings] = await Promise.all([
    getT(locale),
    getCurrencyForLocale(locale),
    getRelatedProducts(product, locale),
    getCategories(locale),
    getSettings(),
  ]);
  const category = categories.find((c) => c.id === product.categoryId);
  const url = absoluteUrl(settings.siteUrl, `/${locale}/products/${product.slug}`);
  const soldOut = product.stock <= 0;
  const low = !soldOut && product.stock <= 5;
  const crumbs = [
    { name: t("nav.home"), item: `/${locale}` },
    { name: t("nav.shop"), item: `/${locale}/products` },
    ...(category ? [{ name: category.name, item: `/${locale}/category/${category.slug}` }] : []),
    { name: product.t.name, item: `/${locale}/products/${product.slug}` },
  ];

  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.t.name,
      description: product.t.seoDescription || product.t.shortDescription,
      sku: product.sku || undefined,
      image: product.images.length ? product.images.map((i) => absoluteUrl(settings.siteUrl, i)) : undefined,
      brand: { "@type": "Brand", name: t("site.name") },
      category: category?.name,
      weight: { "@type": "QuantitativeValue", value: product.weightGrams, unitCode: "GRM" },
      additionalProperty: [
        product.t.flora && { "@type": "PropertyValue", name: t("lab.flora"), value: product.t.flora },
        product.altitude && { "@type": "PropertyValue", name: t("lab.altitude"), value: product.altitude, unitCode: "MTR" },
        product.moisture && { "@type": "PropertyValue", name: t("lab.moisture"), value: product.moisture, unitCode: "P1" },
      ].filter(Boolean),
      offers: {
        "@type": "Offer",
        url,
        // تومان کد ارز استاندارد ندارد؛ برای موتورهای جستجو به ریال اعلام می‌شود
        priceCurrency: currency.code === "IRT" ? "IRR" : currency.code,
        price: currency.code === "IRT" ? product.price * 10 : convert(product.price, currency),
        availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(settings.siteUrl, c.item) })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structured)} />
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <nav aria-label="breadcrumb" className="text-[13px] text-bark">
          <ol className="flex flex-wrap items-center gap-2">
            {crumbs.map((c, i) => (
              <li key={c.item} className="flex items-center gap-2">
                {i > 0 ? <span aria-hidden="true">/</span> : null}
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="text-ink">{c.name}</span>
                ) : (
                  <Link href={c.item} className="hover:text-ink">{c.name}</Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            {product.images.length ? (
              <Gallery images={product.images} alt={product.t.name} />
            ) : (
              <div className="aspect-[4/5] overflow-hidden rounded-md">
                <ImagePlaceholder tint={product.tint} />
              </div>
            )}
          </div>

          <div className="pb-4">
            {category ? (
              <Link href={`/${locale}/category/${category.slug}`} className="eyebrow hover:underline">
                {category.name}
              </Link>
            ) : null}
            <h1 className="font-display mt-3 text-5xl leading-[1.08] sm:text-6xl">{product.t.name}</h1>
            <p className="mt-2 text-bark">
              {product.t.flora} · {formatNumber(product.weightGrams, locale)} {t("product.grams")}
            </p>

            <div className="mt-6 flex flex-wrap items-baseline gap-x-3">
              <span className="tabular text-2xl font-medium">{formatMoney(product.price, currency, locale)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price ? (
                <s className="tabular text-bark">{formatMoney(product.compareAtPrice, currency, locale)}</s>
              ) : null}
            </div>

            <p className="mt-6 max-w-lg text-lg leading-8 text-ink/80">{product.t.shortDescription}</p>

            <p className={`mt-6 flex items-center gap-2 text-sm ${soldOut ? "text-danger" : low ? "text-amber-ink" : "text-thyme"}`}>
              {soldOut ? <CircleX className="size-4" /> : low ? <CircleAlert className="size-4" /> : <CircleCheck className="size-4" />}
              {soldOut ? t("product.outOfStock") : low ? t("product.lowStock", { n: formatNumber(product.stock, locale) }) : t("product.inStock")}
            </p>

            <div className="mt-4">
              <AddToCart
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.t.name,
                  price: product.price,
                  image: product.images[0] ?? null,
                  tint: product.tint,
                  stock: product.stock,
                }}
              />
            </div>

            <ul className="mt-8 grid grid-cols-3 gap-3 border-y border-line py-5 text-center text-xs text-bark">
              {[
                [FlaskConical, t("product.tested")],
                [Leaf, t("product.raw")],
                [Lock, t("product.secure")],
              ].map(([Icon, label], i) => {
                const I = Icon as typeof Lock;
                return (
                  <li key={i} className="flex flex-col items-center gap-2">
                    <I className="size-5 text-ink" strokeWidth={1.25} />
                    {label as string}
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 divide-y divide-line border-b border-line">
              <Section title={t("product.description")} open>
                <div className="space-y-4 leading-8 text-ink/80">
                  {product.t.description.split(/\n{2,}/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </Section>
              <Section title={t("home.lab.title")} open>
                <HarvestLabel
                  locale={locale}
                  t={t}
                  flora={product.t.flora}
                  origin={product.t.origin}
                  altitude={product.altitude}
                  moisture={product.moisture}
                  harvestYear={product.harvestYear}
                  variant="plain"
                />
                {product.sku ? (
                  <p className="tabular mt-2 text-xs text-bark" dir="ltr">
                    {t("product.sku")}: {product.sku}
                  </p>
                ) : null}
              </Section>
              <Section title={t("product.shippingTitle")}>
                <p className="leading-8 text-ink/80">{t("product.shippingBody")}</p>
              </Section>
            </div>
          </div>
        </div>
      </div>

      {related.length ? (
        <section className="mx-auto max-w-7xl px-4 pt-28 sm:px-6 lg:px-8" aria-labelledby="related-title">
          <h2 id="related-title" className="font-display text-4xl">{t("product.related")}</h2>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} currency={currency} t={t} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function Section({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 font-medium">
        <h2>{title}</h2>
        <span className="relative size-3.5" aria-hidden="true">
          <span className="absolute inset-x-0 top-1/2 h-px bg-ink" />
          <span className="absolute inset-y-0 start-1/2 w-px bg-ink transition-transform group-open:scale-y-0" />
        </span>
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}
