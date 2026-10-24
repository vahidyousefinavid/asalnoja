"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, ShoppingBag, X } from "lucide-react";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme";
import { formatNumber } from "@/lib/money";
import { useStore } from "./providers";

type Lang = { code: string; nativeName: string };

export function Header({ languages, siteName }: { languages: Lang[]; siteName: string }) {
  const { locale, t, count, setCartOpen } = useStore();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    { href: `/${locale}/products`, label: t("nav.shop") },
    { href: `/${locale}/about`, label: t("nav.about") },
  ];
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        {t("nav.skip")}
      </a>
      <div className="bg-night px-4 py-2 text-center text-[13px] text-on-night/85">{t("announce")}</div>
      <header
        className={`sticky top-0 z-40 border-b bg-paper/95 backdrop-blur-md transition-[border-color,box-shadow] duration-300 ${
          scrolled ? "border-line shadow-[0_8px_24px_-18px_rgb(0_0_0/0.4)]" : "border-transparent"
        }`}
      >
        <div className="mx-auto grid h-[72px] max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="-ms-2 grid size-11 place-items-center md:hidden"
              aria-label={t("nav.menu")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-6" strokeWidth={1.5} />
            </button>
            <nav aria-label={t("nav.menu")} className="hidden items-center gap-7 md:flex">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={isActive(n.href) ? "page" : undefined}
                  className="relative py-2 text-[15px] text-ink/80 transition-colors hover:text-ink aria-[current=page]:text-ink aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:-bottom-px aria-[current=page]:after:h-px aria-[current=page]:after:bg-ink"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <Link href={`/${locale}`} aria-label={siteName} className="justify-self-center">
            <Logo name={siteName} />
          </Link>

          <div className="flex items-center justify-end gap-1">
            {languages.length > 1 ? <LanguageSwitcher languages={languages} /> : null}
            <ThemeToggle labels={{ toDark: t("theme.toDark"), toLight: t("theme.toLight") }} className="mx-1.5" />
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative grid size-11 place-items-center rounded-md transition-colors hover:bg-comb"
              aria-label={`${t("nav.cart")} (${count})`}
            >
              <ShoppingBag className="size-[22px]" strokeWidth={1.5} />
              {count > 0 ? (
                <span
                  className="tabular absolute end-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[11px] font-bold leading-[18px] text-paper"
                  aria-hidden="true"
                >
                  {formatNumber(count, locale)}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? <MobileMenu nav={nav} isActive={isActive} languages={languages} onClose={() => setMenuOpen(false)} /> : null}
    </>
  );
}

function MobileMenu({
  nav,
  isActive,
  languages,
  onClose,
}: {
  nav: { href: string; label: string }[];
  isActive: (h: string) => boolean;
  languages: Lang[];
  onClose: () => void;
}) {
  const { t, locale } = useStore();
  const pathname = usePathname();
  const rest = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={t("nav.menu")}>
      <button type="button" aria-label={t("nav.close")} className="absolute inset-0 bg-[var(--scrim)]" onClick={onClose} />
      <div className="rise absolute inset-y-0 start-0 flex w-[min(340px,88vw)] flex-col bg-paper">
        <div className="flex h-[72px] items-center justify-between border-b border-line px-4">
          <span className="eyebrow">{t("nav.menu")}</span>
          <button type="button" onClick={onClose} className="grid size-11 place-items-center" aria-label={t("nav.close")} autoFocus>
            <X className="size-6" strokeWidth={1.5} />
          </button>
        </div>
        <nav className="flex flex-col px-4 py-4">
          <Link href={`/${locale}`} onClick={onClose} className="font-display border-b border-line py-4 text-3xl">
            {t("nav.home")}
          </Link>
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={onClose}
              aria-current={isActive(n.href) ? "page" : undefined}
              className="font-display border-b border-line py-4 text-3xl aria-[current=page]:text-amber-ink"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        {languages.length > 1 ? (
          <div className="mt-auto flex flex-wrap gap-2 border-t border-line p-4">
            {languages.map((l) => (
              <a
                key={l.code}
                href={`/${l.code}${rest}`}
                hrefLang={l.code}
                lang={l.code}
                onClick={() => (document.cookie = `NEXT_LOCALE=${l.code}; path=/; max-age=31536000; samesite=lax`)}
                aria-current={l.code === locale ? "true" : undefined}
                className="rounded-md border border-line px-4 py-2 text-sm aria-[current=true]:border-ink aria-[current=true]:bg-ink aria-[current=true]:text-paper"
              >
                {l.nativeName}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LanguageSwitcher({ languages }: { languages: Lang[] }) {
  const { locale, t } = useStore();
  const pathname = usePathname();
  const ref = useRef<HTMLDetailsElement>(null);
  const rest = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "");
  const current = languages.find((l) => l.code === locale);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) ref.current.open = false;
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <details ref={ref} className="group relative hidden sm:block">
      <summary
        className="flex h-11 cursor-pointer list-none items-center gap-1 rounded-md px-3 text-sm text-ink/80 hover:bg-comb hover:text-ink [&::-webkit-details-marker]:hidden"
        aria-label={t("nav.language")}
      >
        {current?.nativeName ?? locale}
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" strokeWidth={1.5} />
      </summary>
      <ul className="absolute end-0 top-12 z-50 min-w-44 overflow-hidden rounded-md border border-line bg-paper py-1 shadow-xl">
        {languages.map((l) => (
          <li key={l.code}>
            <a
              href={`/${l.code}${rest}`}
              hrefLang={l.code}
              lang={l.code}
              onClick={() => {
                document.cookie = `NEXT_LOCALE=${l.code}; path=/; max-age=31536000; samesite=lax`;
              }}
              aria-current={l.code === locale ? "true" : undefined}
              className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm hover:bg-comb aria-[current=true]:font-bold"
            >
              {l.nativeName}
              <span className="text-xs uppercase text-bark">{l.code}</span>
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
