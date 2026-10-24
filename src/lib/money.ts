export type CurrencyLike = { code: string; symbol: string; rate: number; decimals: number };

export function convert(amountBase: number, currency: CurrencyLike) {
  const f = 10 ** currency.decimals;
  return Math.round(amountBase * currency.rate * f) / f;
}

/** قالب‌بندی مبلغی که به ارز پایه (تومان) ذخیره شده، در ارز مقصد */
export function formatMoney(amountBase: number, currency: CurrencyLike, locale: string) {
  return formatAmount(convert(amountBase, currency), currency, locale);
}

export function formatAmount(amount: number, currency: CurrencyLike, locale: string) {
  const opts = {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  };
  if (currency.code !== "IRT") {
    try {
      return new Intl.NumberFormat(safeLocale(locale), {
        style: "currency",
        currency: currency.code,
        ...opts,
      }).format(amount);
    } catch {
      /* ارز غیر استاندارد؛ پایین‌تر دستی قالب می‌شود */
    }
  }
  return `${new Intl.NumberFormat(safeLocale(locale), opts).format(amount)} ${currency.symbol}`;
}

export function formatNumber(n: number, locale: string, maxFrac = 1) {
  return new Intl.NumberFormat(safeLocale(locale), { maximumFractionDigits: maxFrac }).format(n);
}

function safeLocale(locale: string) {
  try {
    return Intl.NumberFormat.supportedLocalesOf([locale]).length ? locale : "en";
  } catch {
    return "en";
  }
}

export function formatPercent(n: number, locale: string, maxFrac = 1) {
  return new Intl.NumberFormat(safeLocale(locale), { style: "percent", maximumFractionDigits: maxFrac }).format(n / 100);
}
