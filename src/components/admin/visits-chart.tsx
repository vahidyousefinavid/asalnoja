"use client";

import { useState } from "react";

type Point = { day: string; views: number; visitors: number };

const W = 720;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 26, left: 36 };

const dayFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "short", timeZone: "UTC" });
const numFmt = new Intl.NumberFormat("fa-IR");

/** نمودار ستونی بازدید روزانه؛ یک سری، بدون legend، با tooltip و جدول برای صفحه‌خوان */
export function VisitsChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(4, ...data.map((d) => d.views));
  const nice = Math.ceil(max / 4) * 4;
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const step = iw / data.length;
  const bw = Math.max(2, step - 2); // فاصله ۲ پیکسلی بین ستون‌ها
  const y = (v: number) => PAD.top + ih - (v / nice) * ih;
  const ticks = [0, nice / 2, nice];
  const empty = data.every((d) => d.views === 0);

  const bar = (x: number, top: number, w: number) => {
    const h = PAD.top + ih - top;
    if (h <= 0) return "";
    const r = Math.min(4, w / 2, h);
    return `M${x},${PAD.top + ih}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${PAD.top + ih}Z`;
  };

  const h = hover != null ? data[hover] : null;

  return (
    <div className="relative" dir="ltr">
      {empty ? (
        <p className="absolute inset-0 z-10 grid place-items-center text-sm text-bark" dir="rtl">
          هنوز بازدیدی ثبت نشده. بعد از اولین بازدید سایت، نمودار پر می‌شود.
        </p>
      ) : null}
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="بازدید روزانه ۳۰ روز اخیر" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--bark)">
              {numFmt.format(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD.left + i * step + 1;
          return (
            <g key={d.day}>
              <path d={bar(x, y(d.views), bw)} fill="var(--honey-deep)" opacity={hover == null || hover === i ? 1 : 0.45} />
              {i % 5 === 0 || i === data.length - 1 ? (
                <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--bark)">
                  {dayFmt.format(new Date(d.day))}
                </text>
              ) : null}
              <rect
                x={PAD.left + i * step}
                y={PAD.top}
                width={step}
                height={ih}
                fill="transparent"
                tabIndex={0}
                aria-label={`${dayFmt.format(new Date(d.day))}: ${numFmt.format(d.views)} بازدید`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              />
            </g>
          );
        })}
      </svg>
      {h && hover != null ? (
        <div
          className="pointer-events-none absolute top-0 z-20 -translate-x-1/2 rounded-xl border border-line bg-paper px-3 py-2 text-xs shadow-lg"
          style={{ left: `${Math.min(88, Math.max(12, ((PAD.left + hover * step + step / 2) / W) * 100))}%` }}
          dir="rtl"
        >
          <p className="font-bold">{dayFmt.format(new Date(h.day))}</p>
          <p className="tabular text-bark">
            بازدید: <span className="font-bold text-ink">{numFmt.format(h.views)}</span>
          </p>
          <p className="tabular text-bark">
            بازدیدکننده: <span className="font-bold text-ink">{numFmt.format(h.visitors)}</span>
          </p>
        </div>
      ) : null}
      <table className="sr-only">
        <caption>بازدید روزانه</caption>
        <thead>
          <tr>
            <th>روز</th>
            <th>بازدید</th>
            <th>بازدیدکننده</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{dayFmt.format(new Date(d.day))}</td>
              <td>{d.views}</td>
              <td>{d.visitors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
