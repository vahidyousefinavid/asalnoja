import Link from "next/link";
import { Logo } from "@/components/brand";
import type { Settings } from "@/lib/settings";

export function Footer({
  locale,
  t,
  settings,
  categories,
}: {
  locale: string;
  t: (k: string) => string;
  settings: Settings;
  categories: { slug: string; name: string }[];
}) {
  const link = "text-on-night/70 transition-colors hover:text-on-night";
  return (
    <footer className="mt-28 bg-night text-on-night">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-14 pt-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo name={t("site.name")} />
          <p className="mt-5 max-w-xs text-sm leading-7 text-on-night/65">{t("footer.about")}</p>
        </div>

        <nav aria-label={t("nav.shop")}>
          <h2 className="mb-5 text-sm font-medium text-on-night">{t("nav.shop")}</h2>
          <ul className="space-y-3 text-sm">
            <li><Link className={link} href={`/${locale}/products`}>{t("shop.all")}</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link className={link} href={`/${locale}/category/${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("footer.links")}>
          <h2 className="mb-5 text-sm font-medium text-on-night">{t("footer.links")}</h2>
          <ul className="space-y-3 text-sm">
            <li><Link className={link} href={`/${locale}/about`}>{t("nav.about")}</Link></li>
            <li><Link className={link} href={`/${locale}#harvest-record`}>{t("home.lab.title")}</Link></li>
            <li><Link className={link} href={`/${locale}#faq`}>{t("home.faq.title")}</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="mb-5 text-sm font-medium text-on-night">{t("footer.contact")}</h2>
          <ul className="space-y-3 text-sm">
            {settings.phone ? (
              <li><a href={`tel:${settings.phone}`} dir="ltr" className={link}>{settings.phone}</a></li>
            ) : null}
            {settings.email ? (
              <li><a href={`mailto:${settings.email}`} className={link}>{settings.email}</a></li>
            ) : null}
            {settings.instagram ? (
              <li>
                <a href={`https://instagram.com/${settings.instagram}`} rel="noopener" target="_blank" className={link}>
                  Instagram
                </a>
              </li>
            ) : null}
            {settings.telegram ? (
              <li>
                <a href={`https://t.me/${settings.telegram}`} rel="noopener" target="_blank" className={link}>
                  Telegram
                </a>
              </li>
            ) : null}
            {settings.address ? <li className="text-on-night/70">{settings.address}</li> : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-on-night/10">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-on-night/50 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {t("site.name")} — {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
