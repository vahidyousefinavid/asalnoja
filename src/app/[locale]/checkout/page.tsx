import { db, schema } from "@/db";
import { CheckoutForm } from "@/components/store/checkout-form";
import { getCurrencyForLocale, getT } from "@/lib/i18n";
import { getCheckoutOptions } from "@/lib/orders";
import { adapters } from "@/lib/payments";
import { buildMetadata } from "@/lib/seo";
import { placeOrder } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/checkout">) {
  const { locale } = await params;
  const t = await getT(locale);
  return buildMetadata({ locale, path: "/checkout", title: t("checkout.title"), noindex: true });
}

export default async function CheckoutPage({ params }: PageProps<"/[locale]/checkout">) {
  const { locale } = await params;
  const [t, options, currencies, localeCurrency] = await Promise.all([
    getT(locale),
    getCheckoutOptions(),
    db.select().from(schema.currencies),
    getCurrencyForLocale(locale),
  ]);

  const countries = options.map((c) => ({
    ...c,
    chargeCurrencies: Object.fromEntries(
      c.gateways.map((g) => {
        const code = adapters[g].chargeCurrency(c.currency.code);
        return [g, currencies.find((x) => x.code === code) ?? c.currency];
      }),
    ),
  }));
  // کشوری که ارزش با ارز این زبان یکی است، پیش‌انتخاب می‌شود
  const defaultCountry = (countries.find((c) => c.currency.code === localeCurrency.code) ?? countries[0])?.code ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="font-display text-5xl">{t("checkout.title")}</h1>
      <CheckoutForm action={placeOrder.bind(null, locale)} countries={countries} defaultCountry={defaultCountry} />
    </div>
  );
}
