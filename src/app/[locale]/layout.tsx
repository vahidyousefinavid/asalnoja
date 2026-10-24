import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { getCategories } from "@/lib/catalog";
import { getCurrencyForLocale, getEnabledLanguages, getLanguage, getMessages, translator } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { StoreProvider } from "@/components/store/providers";
import { Header } from "@/components/store/header";
import { CartDrawer } from "@/components/store/cart";
import { Footer } from "@/components/store/footer";
import { Tracker } from "@/components/store/tracker";
import { ThemeScript } from "@/components/theme";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getEnabledLanguages()).map((l) => ({ locale: l.code }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const m = await getMessages(locale);
  return {
    applicationName: m["site.name"],
    title: { default: m["site.name"], template: `%s | ${m["site.name"]}` },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffcf5" },
    { media: "(prefers-color-scheme: dark)", color: "#170d05" },
  ],
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  const lang = await getLanguage(locale);
  if (!lang) notFound();

  const [messages, currency, languages, settings, categories] = await Promise.all([
    getMessages(locale),
    getCurrencyForLocale(locale),
    getEnabledLanguages(),
    getSettings(),
    getCategories(locale),
  ]);
  const t = translator(messages);

  return (
    <html lang={locale} dir={lang.dir} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh antialiased">
        <StoreProvider locale={locale} dir={lang.dir} currency={currency} messages={messages}>
          <Header
            siteName={t("site.name")}
            languages={languages.map((l) => ({ code: l.code, nativeName: l.nativeName }))}
          />
          <main id="main">{children}</main>
          <Footer locale={locale} t={t} settings={settings} categories={categories} />
          <CartDrawer />
          <Tracker />
        </StoreProvider>
      </body>
    </html>
  );
}
