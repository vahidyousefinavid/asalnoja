"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { CircleAlert, Loader2, Lock } from "lucide-react";
import { formatNumber, formatMoney, type CurrencyLike } from "@/lib/money";
import type { CheckoutState } from "@/app/[locale]/checkout/actions";
import { useStore } from "./providers";

type Country = {
  code: string;
  name: string;
  currency: CurrencyLike & { name: string };
  shippingCost: number;
  freeShippingOver: number | null;
  gateways: string[];
  /** ارزی که هر درگاه برای این کشور با آن مبلغ می‌گیرد */
  chargeCurrencies: Record<string, CurrencyLike & { name: string }>;
};

export function CheckoutForm({
  action,
  countries,
  defaultCountry,
}: {
  action: (state: CheckoutState, form: FormData) => Promise<CheckoutState>;
  countries: Country[];
  defaultCountry: string;
}) {
  const { t, items, subtotal, money, locale, currency } = useStore();
  const [state, formAction, pending] = useActionState(action, {});
  const v = state.values ?? {};
  const [countryCode, setCountryCode] = useState(v.country || defaultCountry || countries[0]?.code || "");
  const country = countries.find((c) => c.code === countryCode);
  const [gateway, setGateway] = useState(v.gateway || "");
  const activeGateway = country?.gateways.includes(gateway) ? gateway : (country?.gateways[0] ?? "");

  const shipping = country
    ? country.freeShippingOver != null && subtotal >= country.freeShippingOver
      ? 0
      : country.shippingCost
    : 0;
  const total = subtotal + shipping;
  const charge = country && activeGateway ? country.chargeCurrencies[activeGateway] : undefined;
  const cartJson = useMemo(() => JSON.stringify(items.map((i) => ({ id: i.id, qty: i.qty }))), [items]);
  const err = state.fieldErrors ?? {};

  if (!items.length) {
    return (
      <div className="mt-10 rounded-md border border-dashed border-line p-12 text-center">
        <p className="text-lg text-bark">{t("cart.empty")}</p>
        <Link href={`/${locale}/products`} className="mt-5 inline-flex h-12 items-center rounded-md bg-honey px-6 font-bold text-on-honey">
          {t("cart.emptyCta")}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]" noValidate>
      <input type="hidden" name="cart" value={cartJson} />
      <div className="space-y-8">
        {state.error ? (
          <p role="alert" className="flex items-start gap-3 rounded-md border border-danger/40 bg-danger/10 p-4 font-medium text-danger">
            <CircleAlert className="mt-0.5 size-5 shrink-0" />
            {state.error}
          </p>
        ) : null}

        <fieldset className="rounded-md border border-line p-6">
          <legend className="font-display px-2 text-2xl">{t("checkout.contact")}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label={t("checkout.name")} autoComplete="name" required defaultValue={v.name} error={err.name} />
            <Field name="phone" label={t("checkout.phone")} type="tel" autoComplete="tel" required defaultValue={v.phone} error={err.phone} dir="ltr" />
            <Field name="email" label={t("checkout.email")} type="email" autoComplete="email" defaultValue={v.email} error={err.email} dir="ltr" className="sm:col-span-2" />
          </div>
        </fieldset>

        <fieldset className="rounded-md border border-line p-6">
          <legend className="font-display px-2 text-2xl">{t("checkout.shippingInfo")}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                {t("checkout.country")} <span className="text-danger" aria-hidden="true">*</span>
              </span>
              <select
                name="country"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                autoComplete="country"
                className="h-12 rounded-md border border-line bg-paper px-4 focus:border-ink focus:outline-none"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </label>
            <Field name="city" label={t("checkout.city")} autoComplete="address-level2" required defaultValue={v.city} error={err.city} />
            <Field name="address" label={t("checkout.address")} autoComplete="street-address" required defaultValue={v.address} error={err.address} className="sm:col-span-2" multiline />
            <Field name="postalCode" label={t("checkout.postalCode")} autoComplete="postal-code" defaultValue={v.postalCode} error={err.postalCode} dir="ltr" />
            <Field name="notes" label={t("checkout.notes")} defaultValue={v.notes} className="sm:col-span-2" multiline />
          </div>
        </fieldset>

        <fieldset className="rounded-md border border-line p-6">
          <legend className="font-display px-2 text-2xl">{t("checkout.payment")}</legend>
          {country?.gateways.length ? (
            <div className="grid gap-3">
              {country.gateways.map((g) => (
                <label
                  key={g}
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-md border border-line px-4 py-3 transition-colors has-[:checked]:border-ink has-[:checked]:bg-comb"
                >
                  <input
                    type="radio"
                    name="gateway"
                    value={g}
                    checked={activeGateway === g}
                    onChange={() => setGateway(g)}
                    className="size-5 accent-[var(--ink)]"
                  />
                  <span className="font-medium">{t(`gateway.${g}`)}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="flex items-start gap-2 text-bark">
              <CircleAlert className="mt-1 size-4 shrink-0" />
              {t("checkout.noGateway")}
            </p>
          )}
          {err.gateway ? <p className="mt-2 text-sm text-danger">{err.gateway}</p> : null}
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-md bg-comb p-6">
          <h2 className="font-display text-2xl">{t("checkout.summary")}</h2>
          <ul className="mt-4 divide-y divide-line">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 py-3 text-sm">
                <span>
                  {i.name} <span className="tabular text-bark">× {formatNumber(i.qty, locale)}</span>
                </span>
                <span className="tabular shrink-0 font-medium">{money(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-bark">{t("cart.subtotal")}</dt>
              <dd className="tabular">{money(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-bark">{t("checkout.shipping")}</dt>
              <dd className="tabular">{shipping === 0 ? t("checkout.free") : money(shipping)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3 text-base">
              <dt className="font-bold">{t("checkout.total")}</dt>
              <dd className="tabular text-xl font-bold">{money(total)}</dd>
            </div>
            {charge && charge.code !== currency.code ? (
              <p className="rounded-md bg-paper px-3 py-2 text-bark">
                {t("checkout.chargedIn", { currency: charge.name })}:{" "}
                <span className="tabular font-bold text-ink">{formatMoney(total, charge, locale)}</span>
              </p>
            ) : null}
          </dl>
          <button
            type="submit"
            disabled={pending || !country?.gateways.length}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-md bg-ink text-lg font-bold text-paper transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-5 animate-spin" /> : <Lock className="size-5" />}
            {pending ? t("checkout.processing") : t("checkout.pay")}
          </button>
        </div>
      </aside>
    </form>
  );
}

function Field({
  name,
  label,
  error,
  required,
  multiline,
  className = "",
  ...rest
}: {
  name: string;
  label: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  className?: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  dir?: string;
}) {
  const id = `f-${name}`;
  const cls = `w-full rounded-md border bg-paper px-4 focus:border-ink focus:outline-none ${error ? "border-danger" : "border-line"}`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {label} {required ? <span className="text-danger" aria-hidden="true">*</span> : null}
      </label>
      {multiline ? (
        <textarea id={id} name={name} rows={3} required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} className={`${cls} py-3`} {...rest} />
      ) : (
        <input id={id} name={name} required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} className={`${cls} h-12`} {...rest} />
      )}
      {error ? (
        <p id={`${id}-e`} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

