import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FlaskConical, Leaf, Package, Plus, Truck } from "lucide-react";
import { HarvestLabel } from "@/components/store/harvest-label";
import { ProductCard } from "@/components/store/product-card";
import { getCategories, getProducts } from "@/lib/catalog";
import { getCurrencyForLocale, getLanguage, getT } from "@/lib/i18n";
import { formatNumber } from "@/lib/money";
import { absoluteUrl, buildMetadata, jsonLd } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  return buildMetadata({ locale, path: "" });
}

const processImages = ["/images/process-frame.webp", "/images/process-jars.webp", "/images/process-pour.webp"];

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const [t, currency, featured, all, categories, settings, lang] = await Promise.all([
    getT(locale),
    getCurrencyForLocale(locale),
    getProducts(locale, { featured: true, limit: 4 }),
    getProducts(locale),
    getCategories(locale),
    getSettings(),
    getLanguage(locale),
  ]);
  const record = featured[0] ?? all[0];
  const Arrow = lang?.dir === "rtl" ? ArrowLeft : ArrowRight;
  const faq = [1, 2, 3, 4].map((i) => ({ q: t(`faq.${i}.q`), a: t(`faq.${i}.a`) }));
  const home = absoluteUrl(settings.siteUrl, `/${locale}`);
  const trust = [FlaskConical, Leaf, Package, Truck];

  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: t("site.name"),
      url: home,
      logo: absoluteUrl(settings.siteUrl, "/icon.svg"),
      ...(settings.email ? { email: settings.email } : {}),
      ...(settings.phone ? { telephone: settings.phone } : {}),
      sameAs: settings.instagram ? [`https://instagram.com/${settings.instagram}`] : [],
    },
    { "@context": "https://schema.org", "@type": "WebSite", name: t("site.name"), url: home, inLanguage: locale },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structured)} />

      {/* هیرو */}
      <section className="relative isolate flex min-h-[min(86vh,820px)] items-end overflow-hidden bg-night text-on-night">
        <Image
          src="/images/hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-zoom -z-10 object-cover object-[30%_50%] ltr:-scale-x-100"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-l from-night/90 via-night/45 to-night/10 ltr:bg-linear-to-r" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-linear-to-t from-night/80 to-transparent" />
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-32 sm:px-6 sm:pb-20 lg:px-8">
          <div className="rise max-w-2xl">
            <p className="text-sm font-medium tracking-wide text-honey">{t("hero.eyebrow")}</p>
            <h1 className="font-display mt-5 text-[clamp(2.75rem,6.4vw,5.25rem)] leading-[1.05] text-balance">{t("hero.title")}</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-on-night/80">{t("hero.subtitle")}</p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href={`/${locale}/products`}
                className="group inline-flex items-center gap-3 rounded-md bg-honey px-8 py-4 font-medium text-on-honey transition-colors hover:bg-[#e6aa3e]"
              >
                {t("hero.cta")}
                <Arrow className="size-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>
              <a href="#harvest-record" className="border-b border-on-night/40 pb-1 text-on-night/90 transition-colors hover:border-on-night">
                {t("hero.secondary")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* تعهدها */}
      <section aria-label={t("site.tagline")} className="border-b border-line">
        <ul className="mx-auto grid max-w-7xl grid-cols-1 px-4 min-[520px]:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trust.map((Icon, i) => (
            <li key={i} className="flex items-start gap-4 border-b border-line py-7 last:border-b-0 lg:border-b-0 lg:border-e lg:px-8 lg:first:ps-0 lg:last:border-e-0">
              <Icon className="mt-1 size-6 shrink-0 text-amber-ink" strokeWidth={1.25} />
              <div>
                <p className="font-medium">{t(`trust.${i + 1}.title`)}</p>
                <p className="mt-1 text-sm leading-6 text-bark">{t(`trust.${i + 1}.body`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* محصولات ویژه */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8" aria-labelledby="featured-title">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="eyebrow">{t("nav.shop")}</p>
            <h2 id="featured-title" className="font-display mt-3 text-4xl sm:text-5xl">{t("home.featured.title")}</h2>
            <p className="mt-4 text-bark">{t("home.featured.subtitle")}</p>
          </div>
          <Link href={`/${locale}/products`} className="group inline-flex items-center gap-2 border-b border-ink pb-1 text-sm font-medium">
            {t("home.viewAll")}
            <Arrow className="size-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {(featured.length ? featured : all.slice(0, 4)).map((p, i) => (
            <ProductCard key={p.id} product={p} locale={locale} currency={currency} t={t} priority={i < 2} />
          ))}
        </div>
      </section>

      {/* دسته‌ها */}
      {categories.length ? (
        <section className="mx-auto max-w-7xl px-4 pt-28 sm:px-6 lg:px-8" aria-labelledby="cats-title">
          <h2 id="cats-title" className="font-display text-4xl sm:text-5xl">{t("home.categories.title")}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {categories.map((c) => {
              const n = all.filter((p) => p.categoryId === c.id).length;
              return (
                <Link key={c.id} href={`/${locale}/category/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-md bg-comb text-on-night">
                  {c.image ? (
                    <Image src={c.image} alt={c.name} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-700 ease-[var(--ease-honey)] group-hover:scale-[1.04]" />
                  ) : null}
                  <div className="absolute inset-0 bg-linear-to-t from-night/85 via-night/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-7">
                    <div>
                      <h3 className="font-display text-3xl">{c.name}</h3>
                      <p className="mt-1 text-sm text-on-night/75">
                        {formatNumber(n, locale)} {t("shop.results")}
                      </p>
                    </div>
                    <span className="grid size-11 shrink-0 place-items-center rounded-full border border-on-night/40 transition-colors group-hover:bg-on-night group-hover:text-night">
                      <Arrow className="size-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* داستان */}
      <section className="mx-auto mt-28 grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8" aria-labelledby="story-title">
        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-comb">
          <Image src="/images/story-beekeeper.webp" alt={t("home.story.title")} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="max-w-lg">
          <p className="eyebrow">{t("home.story.eyebrow")}</p>
          <h2 id="story-title" className="font-display mt-4 text-4xl leading-tight sm:text-5xl">{t("home.story.title")}</h2>
          <p className="mt-6 text-lg leading-9 text-bark">{t("home.story.body")}</p>
          <Link href={`/${locale}/about`} className="group mt-8 inline-flex items-center gap-2 border-b border-ink pb-1 font-medium">
            {t("home.story.cta")}
            <Arrow className="size-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>
      </section>

      {/* فرایند: ترتیب واقعی برداشت */}
      <section className="mx-auto max-w-7xl px-4 pt-28 sm:px-6 lg:px-8" aria-labelledby="process-title">
        <p className="eyebrow">{t("home.process.eyebrow")}</p>
        <h2 id="process-title" className="font-display mt-3 text-4xl sm:text-5xl">{t("home.process.title")}</h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {[1, 2, 3].map((i) => (
            <li key={i}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-comb">
                <Image src={processImages[i - 1]} alt={t(`process.${i}.title`)} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
              </div>
              <p className="tabular mt-6 text-sm text-amber-ink" aria-hidden="true">
                {formatNumber(0, locale)}
                {formatNumber(i, locale)}
              </p>
              <h3 className="font-display mt-1 text-2xl">{t(`process.${i}.title`)}</h3>
              <p className="mt-2 leading-7 text-bark">{t(`process.${i}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* شناسنامه برداشت */}
      {record ? (
        <section id="harvest-record" className="mt-28 scroll-mt-24 bg-comb" aria-labelledby="record-title">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:px-8">
            <div className="relative aspect-[5/4] overflow-hidden rounded-md">
              <Image src="/images/comb-macro.webp" alt="" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
            <div>
              <p className="eyebrow">{t("product.tested")}</p>
              <h2 id="record-title" className="font-display mt-3 text-4xl sm:text-5xl">{t("home.lab.title")}</h2>
              <p className="mt-4 max-w-md leading-8 text-bark">{t("home.lab.body")}</p>
              <HarvestLabel
                locale={locale}
                t={t}
                flora={record.t.flora}
                origin={record.t.origin}
                altitude={record.altitude}
                moisture={record.moisture}
                harvestYear={record.harvestYear}
                batch={record.sku}
                className="mt-8 max-w-md"
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* منظره */}
      <section className="relative isolate flex min-h-[70vh] items-center overflow-hidden bg-night text-on-night" aria-labelledby="origin-title">
        <Image src="/images/landscape.webp" alt="" fill sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-night/45" />
        <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <h2 id="origin-title" className="font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-tight">{t("home.origin.title")}</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-on-night/85">{t("home.origin.body")}</p>
        </div>
      </section>

      {/* پرسش‌ها */}
      <section id="faq" className="mx-auto grid max-w-7xl scroll-mt-24 gap-12 px-4 pt-28 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:px-8" aria-labelledby="faq-title">
        <div>
          <p className="eyebrow">{t("home.faq.eyebrow")}</p>
          <h2 id="faq-title" className="font-display mt-3 text-4xl sm:text-5xl">{t("home.faq.title")}</h2>
          <p className="mt-4 text-bark">{t("home.faq.body")}</p>
          {settings.email ? (
            <a href={`mailto:${settings.email}`} className="mt-6 inline-block border-b border-ink pb-1 font-medium">
              {settings.email}
            </a>
          ) : null}
        </div>
        <div className="border-t border-ink">
          {faq.map((f, i) => (
            <details key={i} className="group border-b border-line [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-6 text-lg">
                {f.q}
                <Plus className="size-5 shrink-0 transition-transform duration-300 group-open:rotate-45" strokeWidth={1.5} />
              </summary>
              <p className="max-w-2xl pb-6 leading-8 text-bark">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
