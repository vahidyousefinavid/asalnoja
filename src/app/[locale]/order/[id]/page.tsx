import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, CircleX, Clock } from "lucide-react";
import { ClearCart } from "@/components/store/clear-cart";
import { getCurrencyForLocale, getT } from "@/lib/i18n";
import { formatNumber, formatAmount, formatMoney } from "@/lib/money";
import { getOrderWithItems } from "@/lib/orders";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/order/[id]">) {
  const { locale } = await params;
  const t = await getT(locale);
  return buildMetadata({ locale, path: "/order", title: t("order.title"), noindex: true });
}

export default async function OrderPage({ params, searchParams }: PageProps<"/[locale]/order/[id]">) {
  const { locale, id } = await params;
  const token = String((await searchParams).t ?? "");
  const data = await getOrderWithItems(id, token);
  if (!data) notFound();
  const { order, items } = data;
  const [t, currency, settings, [charged]] = await Promise.all([
    getT(locale),
    getCurrencyForLocale(locale),
    getSettings(),
    db.select().from(schema.currencies).where(eq(schema.currencies.code, order.currencyCode)),
  ]);

  const failed = order.status === "failed" || order.status === "cancelled";
  const paidLike = !failed && order.status !== "pending";
  const Icon = failed ? CircleX : paidLike ? CircleCheck : Clock;
  const message = failed ? t("order.failed") : paidLike ? t("order.paid") : t("order.pending");

  return (
    <div className="mx-auto max-w-2xl px-4 pt-12 sm:px-6">
      {!failed ? <ClearCart /> : null}
      <div className="rounded-md bg-comb p-8 text-center">
        <Icon className={`mx-auto size-14 ${failed ? "text-danger" : paidLike ? "text-thyme" : "text-amber-ink"}`} strokeWidth={1.6} />
        <h1 className="font-display mt-4 text-4xl">{t(`order.status.${order.status}`)}</h1>
        <p className="mt-3 text-lg text-bark">{message}</p>
        <p className="mt-6 inline-flex items-center gap-2 rounded-md bg-paper px-5 py-2">
          <span className="text-bark">{t("order.number")}:</span>
          <span className="tabular font-bold" dir="ltr">{order.id}</span>
        </p>
      </div>

      {order.status === "pending" && order.gatewayId === "bank_transfer" ? (
        <div className="mt-6 rounded-md border-2 border-dashed border-ink/30 p-6">
          <p className="font-medium">{t("order.bankInfo")}</p>
          <dl className="mt-4 space-y-2">
            {settings.bankCardNumber ? (
              <div className="flex justify-between gap-4"><dt className="text-bark">Card</dt><dd className="tabular font-bold" dir="ltr">{settings.bankCardNumber}</dd></div>
            ) : null}
            {settings.bankIban ? (
              <div className="flex justify-between gap-4"><dt className="text-bark">IBAN</dt><dd className="tabular break-all font-bold" dir="ltr">{settings.bankIban}</dd></div>
            ) : null}
            {settings.bankHolder ? <p className="font-bold">{settings.bankHolder}</p> : null}
          </dl>
        </div>
      ) : null}
      {order.status === "pending" && order.gatewayId === "cod" ? (
        <p className="mt-6 rounded-md border border-line p-6 font-medium">{t("order.codInfo")}</p>
      ) : null}

      <section className="mt-6 rounded-md border border-line p-6" aria-labelledby="items-title">
        <h2 id="items-title" className="font-display text-2xl">{t("order.items")}</h2>
        <ul className="mt-3 divide-y divide-line">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-3">
              <span>
                {i.name} <span className="tabular text-bark">× {formatNumber(i.quantity, locale)}</span>
              </span>
              <span className="tabular">{formatMoney(i.unitPrice * i.quantity, currency, locale)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-2 border-t border-line pt-4">
          <div className="flex justify-between">
            <dt className="text-bark">{t("checkout.shipping")}</dt>
            <dd className="tabular">{order.shipping ? formatMoney(order.shipping, currency, locale) : t("checkout.free")}</dd>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <dt>{t("checkout.total")}</dt>
            <dd className="tabular">
              {charged ? formatAmount(order.totalCharged, charged, locale) : formatMoney(order.total, currency, locale)}
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-8 text-center">
        <Link href={`/${locale}/products`} className="inline-flex h-12 items-center rounded-md bg-ink px-8 font-bold text-paper">
          {t("order.backHome")}
        </Link>
      </div>
    </div>
  );
}
