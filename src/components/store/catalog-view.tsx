import Link from "next/link";
import type { LocalizedCategory, LocalizedProduct } from "@/lib/catalog";
import type { CurrencyLike } from "@/lib/money";
import { formatNumber } from "@/lib/money";
import { absoluteUrl, jsonLd } from "@/lib/seo";
import { ProductCard } from "./product-card";

export function CatalogView({
  locale,
  t,
  currency,
  products,
  categories,
  active,
  title,
  subtitle,
  siteUrl,
}: {
  locale: string;
  t: (k: string) => string;
  currency: CurrencyLike;
  products: LocalizedProduct[];
  categories: LocalizedCategory[];
  active?: string;
  title: string;
  subtitle: string;
  siteUrl: string;
}) {
  const base = `/${locale}`;
  const crumbs = [
    { name: t("nav.home"), url: base },
    { name: t("nav.shop"), url: `${base}/products` },
    ...(active ? [{ name: title, url: `${base}/category/${active}` }] : []),
  ];
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(siteUrl, c.url) })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(siteUrl, `${base}/products/${p.slug}`),
        name: p.t.name,
      })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structured)} />
      <header className="border-b border-line bg-comb">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
          <nav aria-label="breadcrumb" className="text-[13px] text-bark">
            <ol className="flex flex-wrap items-center gap-2">
              {crumbs.map((c, i) => (
                <li key={c.url} className="flex items-center gap-2">
                  {i > 0 ? <span aria-hidden="true">/</span> : null}
                  {i === crumbs.length - 1 ? (
                    <span aria-current="page" className="text-ink">{c.name}</span>
                  ) : (
                    <Link href={c.url} className="hover:text-ink">{c.name}</Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <h1 className="font-display mt-8 text-5xl sm:text-6xl">{title}</h1>
          <p className="mt-4 max-w-xl text-lg text-bark">{subtitle}</p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5">
          <nav aria-label={t("home.categories.title")} className="-mx-4 overflow-x-auto px-4">
            <ul className="flex w-max gap-6">
              {[{ slug: "", name: t("shop.all") }, ...categories].map((c) => {
                const href = c.slug ? `${base}/category/${c.slug}` : `${base}/products`;
                const current = (active ?? "") === c.slug;
                return (
                  <li key={c.slug || "all"}>
                    <Link
                      href={href}
                      aria-current={current ? "page" : undefined}
                      className="inline-flex h-10 items-center border-b border-transparent text-[15px] text-bark transition-colors hover:text-ink aria-[current=page]:border-ink aria-[current=page]:text-ink"
                    >
                      {c.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <p className="tabular text-sm text-bark">
            {formatNumber(products.length, locale)} {t("shop.results")}
          </p>
        </div>

        {products.length ? (
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} locale={locale} currency={currency} t={t} priority={i < 4} />
            ))}
          </div>
        ) : (
          <div className="mt-10 border border-dashed border-line p-14 text-center">
            <p className="text-bark">{t("shop.empty")}</p>
            <Link href={`${base}/products`} className="mt-5 inline-flex h-11 items-center rounded-md bg-ink px-6 text-sm font-medium text-paper">
              {t("shop.all")}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
