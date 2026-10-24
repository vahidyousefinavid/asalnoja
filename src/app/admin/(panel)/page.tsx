import Link from "next/link";
import { Eye, ReceiptText, Users, Wallet } from "lucide-react";
import { Badge, Card } from "@/components/admin/ui";
import { PageHeader } from "@/components/admin/page-header";
import { VisitsChart } from "@/components/admin/visits-chart";
import { getDashboard } from "@/lib/analytics";
import { faDate, faNum, statusMeta, toman } from "@/lib/order-status";

export const metadata = { title: "داشبورد" };

const deviceLabel: Record<string, string> = { mobile: "موبایل", tablet: "تبلت", desktop: "دسکتاپ" };
const regionName = new Intl.DisplayNames(["fa"], { type: "region" });

export default async function Dashboard() {
  const d = await getDashboard(30);
  const totalDevices = d.devices.reduce((s, x) => s + x.visitors, 0) || 1;

  const tiles = [
    { label: "بازدید امروز", value: faNum(d.today.views), sub: `${faNum(d.today.visitors)} بازدیدکننده`, icon: Eye },
    { label: "بازدیدکننده ۳۰ روز", value: faNum(d.range.visitors), sub: `${faNum(d.range.views)} بازدید صفحه`, icon: Users },
    { label: "سفارش پرداخت‌شده ۳۰ روز", value: faNum(d.orders.count), sub: "پرداخت‌شده تا تحویل‌شده", icon: ReceiptText },
    { label: "فروش ۳۰ روز", value: toman(d.orders.revenue), sub: "بر اساس ارز پایه", icon: Wallet },
  ];

  return (
    <>
      <PageHeader title="داشبورد" description="خلاصه بازدید و فروش ۳۰ روز اخیر" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-line bg-paper p-5">
            <div className="flex items-center justify-between text-sm text-bark">
              {label}
              <Icon className="size-4" />
            </div>
            <p className="tabular mt-3 text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-bark">{sub}</p>
          </div>
        ))}
      </div>

      <Card title="بازدید روزانه" className="mt-6">
        <VisitsChart data={d.series} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="پربازدیدترین محصولات">
          <RankList
            rows={d.topProducts.map((p) => ({ key: String(p.productId), label: p.name, value: p.views, href: `/admin/products/${p.productId}` }))}
            unit="بازدید"
          />
        </Card>
        <Card title="پربازدیدترین صفحات">
          <RankList rows={d.topPages.map((p) => ({ key: p.path, label: decodeURIComponent(p.path), value: p.views, ltr: true }))} unit="بازدید" />
        </Card>
        <Card title="کشور بازدیدکنندگان">
          <RankList
            rows={d.countries.map((c) => ({
              key: c.country || "-",
              label: c.country ? safeRegion(c.country) : "نامشخص",
              value: c.visitors,
            }))}
            unit="نفر"
          />
          <p className="mt-3 text-xs text-bark">کشور از هدر CDN (مثل Cloudflare) خوانده می‌شود؛ بدون CDN «نامشخص» ثبت می‌شود.</p>
        </Card>
        <Card title="دستگاه و منبع ورود">
          <ul className="space-y-3">
            {d.devices.map((x) => (
              <li key={x.device}>
                <div className="flex justify-between text-sm">
                  <span>{deviceLabel[x.device] ?? x.device}</span>
                  <span className="tabular text-bark">{faNum(Math.round((x.visitors / totalDevices) * 100))}٪</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-comb">
                  <div className="h-2 rounded-full bg-honey-deep" style={{ width: `${(x.visitors / totalDevices) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <h3 className="mb-2 mt-6 text-sm font-bold">ورودی از سایت‌های دیگر</h3>
          <RankList rows={d.referrers.map((r) => ({ key: r.referrer, label: r.referrer, value: r.views, ltr: true }))} unit="بازدید" />
        </Card>
      </div>

      <Card
        title="آخرین سفارش‌ها"
        className="mt-6"
        actions={<Link href="/admin/orders" className="text-sm font-bold text-amber-ink hover:underline">همه سفارش‌ها</Link>}
      >
        {d.recent.length ? (
          <div className="-m-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-comb/60 text-bark">
                <tr className="text-start">
                  <th className="px-5 py-2.5 text-start font-medium">سفارش</th>
                  <th className="px-5 py-2.5 text-start font-medium">مشتری</th>
                  <th className="px-5 py-2.5 text-start font-medium">مبلغ</th>
                  <th className="px-5 py-2.5 text-start font-medium">وضعیت</th>
                  <th className="px-5 py-2.5 text-start font-medium">زمان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {d.recent.map((o) => (
                  <tr key={o.id} className="hover:bg-comb/40">
                    <td className="px-5 py-3"><Link href={`/admin/orders/${o.id}`} className="tabular font-bold hover:underline" dir="ltr">{o.id}</Link></td>
                    <td className="px-5 py-3">{o.customerName}</td>
                    <td className="tabular px-5 py-3">{toman(o.total)}</td>
                    <td className="px-5 py-3"><Badge tone={statusMeta[o.status].tone}>{statusMeta[o.status].label}</Badge></td>
                    <td className="px-5 py-3 text-bark">{faDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-bark">هنوز سفارشی ثبت نشده است.</p>
        )}
      </Card>
    </>
  );
}

function safeRegion(code: string) {
  try {
    return regionName.of(code) ?? code;
  } catch {
    return code;
  }
}

function RankList({ rows, unit }: { rows: { key: string; label: string; value: number; href?: string; ltr?: boolean }[]; unit: string }) {
  if (!rows.length) return <p className="text-sm text-bark">هنوز داده‌ای برای این بازه نیست.</p>;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ol className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.key} className="relative">
          <div className="absolute inset-y-0 start-0 rounded-lg bg-honey/20" style={{ width: `${(r.value / max) * 100}%` }} aria-hidden="true" />
          <div className="relative flex items-center justify-between gap-3 px-3 py-1.5 text-sm">
            {r.href ? (
              <Link href={r.href} className="truncate hover:underline">{r.label}</Link>
            ) : (
              <span className="truncate" dir={r.ltr ? "ltr" : undefined}>{r.label}</span>
            )}
            <span className="tabular shrink-0 text-bark">{faNum(r.value)} {unit}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
