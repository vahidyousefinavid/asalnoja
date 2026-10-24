import type { Metadata } from "next";
import { getDefaultLanguage, getEnabledLanguages, getMessages } from "./i18n";
import { getSettings } from "./settings";

/** زبان‌های Open Graph به شکل fa_IR */
const ogLocales: Record<string, string> = { fa: "fa_IR", en: "en_US", ar: "ar_AE", tr: "tr_TR", de: "de_DE", fr: "fr_FR", ru: "ru_RU" };

export function absoluteUrl(siteUrl: string, path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

type BuildMeta = {
  locale: string;
  /** مسیر بدون پیشوند زبان؛ مثل "/products/thyme-honey" یا "" برای خانه */
  path: string;
  title?: string;
  description?: string;
  image?: string | null;
  /** زبان‌هایی که این صفحه واقعاً ترجمه دارد؛ خالی یعنی همه */
  locales?: string[];
  type?: "website" | "article";
  noindex?: boolean;
};

export async function buildMetadata(opts: BuildMeta): Promise<Metadata> {
  const [settings, langs, def, m] = await Promise.all([
    getSettings(),
    getEnabledLanguages(),
    getDefaultLanguage(),
    getMessages(opts.locale),
  ]);
  const available = langs
    .map((l) => l.code)
    .filter((c) => !opts.locales?.length || opts.locales.includes(c));
  const urlFor = (code: string) => absoluteUrl(settings.siteUrl, `/${code}${opts.path}`);
  const canonicalLocale = available.includes(opts.locale) ? opts.locale : (def?.code ?? opts.locale);

  const languages: Record<string, string> = {};
  for (const code of available) languages[code] = urlFor(code);
  if (def && available.includes(def.code)) languages["x-default"] = urlFor(def.code);

  const siteName = m["site.name"];
  const description = opts.description || m["site.description"];
  const image = opts.image || settings.ogImage || "/images/og-default.jpg";

  return {
    metadataBase: new URL(settings.siteUrl),
    title: opts.title ? { absolute: `${opts.title} | ${siteName}` } : { absolute: `${siteName} | ${m["site.tagline"]}` },
    description,
    alternates: { canonical: urlFor(canonicalLocale), languages },
    openGraph: {
      type: opts.type ?? "website",
      siteName,
      title: opts.title ?? siteName,
      description,
      url: urlFor(canonicalLocale),
      locale: ogLocales[opts.locale] ?? opts.locale,
      alternateLocale: available.filter((c) => c !== opts.locale).map((c) => ogLocales[c] ?? c),
      images: [{ url: absoluteUrl(settings.siteUrl, image), alt: opts.title ?? siteName }],
    },
    twitter: { card: "summary_large_image", title: opts.title ?? siteName, description, images: [absoluteUrl(settings.siteUrl, image)] },
    robots: opts.noindex ? { index: false, follow: true } : { index: true, follow: true, "max-image-preview": "large" },
    verification: settings.googleVerification ? { google: settings.googleVerification } : undefined,
  };
}

/** خروجی امن JSON-LD (جلوگیری از تزریق </script>) */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\u003c") };
}
