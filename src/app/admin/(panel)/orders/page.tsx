import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { orderStatuses, type OrderStatus } from "@/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/admin/ui";
import { faDate, faNum, gatewayLabel, statusMeta, toman } from "@/lib/order-status";

export const metadata = { title: "سفارش‌ها" };

export default async function OrdersAdmin({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const status = orderStatuses.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const orders = await db
    .select()
    .from(schema.orders)
    .where(status ? eq(schema.orders.status, status) : undefined)
    .orderBy(desc(schema.orders.createdAt))
    .limit(200);

  return (
    <>
      <PageHeader title="سفارش‌ها" description={`${faNum(orders.length)} سفارش${status ? ` با وضعیت «${statusMeta[status].label}»` : ""}`} />
      <nav aria-label="فیلتر وضعیت" className="mb-4 flex flex-wrap gap-2">
        {[undefined, ...orderStatuses].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/orders?status=${s}` : "/admin/orders"}
            aria-current={s === status ? "page" : undefined}
            className="inline-flex h-9 items-center rounded-full border border-line bg-paper px-4 text-sm text-bark hover:text-ink aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-paper"
          >
            {s ? statusMeta[s].label : "همه"}
          </Link>
        ))}
      </nav>

      {orders.length ? (
        <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-comb/60 text-bark">
              <tr>
                <th className="px-4 py-3 text-start font-medium">سفارش</th>
                <th className="px-4 py-3 text-start font-medium">مشتری</th>
                <th className="px-4 py-3 text-start font-medium">کشور</th>
                <th className="px-4 py-3 text-start font-medium">مبلغ</th>
                <th className="px-4 py-3 text-start font-medium">پرداخت</th>
                <th className="px-4 py-3 text-start font-medium">وضعیت</th>
                <th className="px-4 py-3 text-start font-medium">زمان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-comb/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="tabular font-bold hover:underline" dir="ltr">{o.id}</Link>
                  </td>
                  <td className="px-4 py-3">
                    {o.customerName}
                    <span className="block text-xs text-bark" dir="ltr">{o.phone}</span>
                  </td>
                  <td className="px-4 py-3">{o.countryCode}</td>
                  <td className="tabular px-4 py-3">
                    {toman(o.total)}
                    {o.currencyCode !== "IRT" ? <span className="block text-xs text-bark" dir="ltr">{o.totalCharged} {o.currencyCode}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-bark">{gatewayLabel[o.gatewayId]}</td>
                  <td className="px-4 py-3"><Badge tone={statusMeta[o.status].tone}>{statusMeta[o.status].label}</Badge></td>
                  <td className="px-4 py-3 text-bark">{faDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-bark">سفارشی با این فیلتر وجود ندارد.</p>
      )}
    </>
  );
}
