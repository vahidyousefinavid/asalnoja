import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { PageHeader } from "@/components/admin/page-header";
import { Badge, Card } from "@/components/admin/ui";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { faDate, faNum, gatewayLabel, statusMeta, toman } from "@/lib/order-status";

export const metadata = { title: "جزئیات سفارش" };

export default async function OrderDetail({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
  if (!order) notFound();
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));

  const info: [string, React.ReactNode][] = [
    ["نام", order.customerName],
    ["تلفن", <span key="p" dir="ltr">{order.phone}</span>],
    ["ایمیل", order.email || "—"],
    ["کشور / شهر", `${order.countryCode} · ${order.city}`],
    ["آدرس", order.address],
    ["کد پستی", order.postalCode || "—"],
    ["زبان سفارش", order.locale],
    ["توضیحات مشتری", order.notes || "—"],
  ];

  return (
    <>
      <PageHeader
        title={`سفارش ${order.id}`}
        description={`ثبت‌شده در ${faDate(order.createdAt)}`}
        actions={<Badge tone={statusMeta[order.status].tone}>{statusMeta[order.status].label}</Badge>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card title="اقلام سفارش">
            <ul className="divide-y divide-line">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 py-2.5 text-sm">
                  <span>
                    {i.name} <span className="tabular text-bark">× {faNum(i.quantity)}</span>
                  </span>
                  <span className="tabular">{toman(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-bark">جمع اقلام</dt><dd className="tabular">{toman(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-bark">ارسال</dt><dd className="tabular">{toman(order.shipping)}</dd></div>
              <div className="flex justify-between font-bold"><dt>جمع کل</dt><dd className="tabular">{toman(order.total)}</dd></div>
              <div className="flex justify-between"><dt className="text-bark">مبلغ پرداختی</dt><dd className="tabular" dir="ltr">{order.totalCharged} {order.currencyCode}</dd></div>
            </dl>
          </Card>
          <Card title="اطلاعات گیرنده">
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {info.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-bark">{k}</dt>
                  <dd className="mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="تغییر وضعیت">
            <OrderStatusForm id={order.id} status={order.status} />
          </Card>
          <Card title="پرداخت">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-bark">روش</dt><dd>{gatewayLabel[order.gatewayId]}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-bark">کد پیگیری</dt><dd className="tabular break-all" dir="ltr">{order.paymentRef ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-bark">زمان پرداخت</dt><dd>{order.paidAt ? faDate(order.paidAt) : "—"}</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
