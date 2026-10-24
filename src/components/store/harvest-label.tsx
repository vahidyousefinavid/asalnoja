import { formatNumber, formatPercent } from "@/lib/money";

/**
 * شناسنامه برداشت: همان اطلاعاتی که روی برچسب هر شیشه چاپ می‌شود.
 * نوار رطوبت از ۱۴٪ تا ۲۰٪ است؛ استاندارد عسل حداکثر ۲۰٪ رطوبت است.
 */
export function HarvestLabel({
  locale,
  t,
  flora,
  origin,
  altitude,
  moisture,
  harvestYear,
  batch,
  variant = "card",
  className = "",
}: {
  locale: string;
  t: (k: string) => string;
  flora: string;
  origin?: string;
  altitude: number | null;
  moisture: number | null;
  harvestYear: number | null;
  batch?: string;
  variant?: "card" | "plain";
  className?: string;
}) {
  const pct = moisture ? Math.min(100, Math.max(0, ((moisture - 14) / 6) * 100)) : null;
  const rows: [string, React.ReactNode][] = [
    [t("lab.flora"), flora || "—"],
    ...(origin ? ([[t("product.origin"), origin]] as [string, React.ReactNode][]) : []),
    [t("lab.altitude"), altitude ? `${formatNumber(altitude, locale)} ${t("product.meters")}` : "—"],
    [t("lab.harvest"), harvestYear ? new Intl.NumberFormat(safe(locale), { useGrouping: false }).format(harvestYear) : "—"],
  ];

  return (
    <div className={`${variant === "card" ? "rounded-md border border-line bg-paper p-6 sm:p-8" : ""} ${className}`}>
      {variant === "card" ? (
        <div className="mb-5 flex items-baseline justify-between gap-3 border-b border-ink pb-4">
          <p className="font-display text-2xl">{t("home.lab.title")}</p>
          {batch ? (
            <span className="tabular text-xs tracking-wider text-bark" dir="ltr">
              BATCH {batch}
            </span>
          ) : null}
        </div>
      ) : null}
      <dl className="divide-y divide-line text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-3">
            <dt className="text-bark">{k}</dt>
            <dd className="tabular text-end font-medium">{v}</dd>
          </div>
        ))}
        {moisture != null && pct != null ? (
          <div className="grid grid-cols-[1fr_auto] gap-x-4 py-3">
            <dt className="text-bark">{t("lab.moisture")}</dt>
            <dd className="tabular font-medium">{formatPercent(moisture, locale)}</dd>
            <dd className="col-span-2" aria-hidden="true">
              <div className="relative mt-3 h-1 bg-comb-2">
                <div className="absolute inset-y-0 start-0 bg-honey-deep" style={{ width: `${pct}%` }} />
                <span className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-ink" style={{ insetInlineStart: `${pct}%` }} />
              </div>
              <div className="tabular mt-1.5 flex justify-between text-[11px] text-bark">
                <span>{formatPercent(14, locale)}</span>
                <span>{formatPercent(20, locale)}</span>
              </div>
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function safe(locale: string) {
  try {
    return Intl.NumberFormat.supportedLocalesOf([locale]).length ? locale : "en";
  } catch {
    return "en";
  }
}
