import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { gatewayIds, type GatewayId } from "@/db/schema";
import { decrementStock } from "@/lib/orders";
import { adapters } from "@/lib/payments";

/** بازگشت مشتری از درگاه؛ پرداخت تأیید و سفارش به‌روزرسانی می‌شود */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/payment/[gateway]/callback">) {
  const { gateway } = await ctx.params;
  const params = req.nextUrl.searchParams;
  const orderId = params.get("order") ?? "";
  if (!gatewayIds.includes(gateway as GatewayId)) return new NextResponse("bad gateway", { status: 400 });

  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!order || order.gatewayId !== gateway) return new NextResponse("order not found", { status: 404 });

  const back = new URL(`/${order.locale}/order/${order.id}?t=${order.accessToken}`, req.url);
  if (order.status !== "pending") return NextResponse.redirect(back);

  const [gw] = await db.select().from(schema.paymentGateways).where(eq(schema.paymentGateways.id, order.gatewayId));
  const adapter = adapters[order.gatewayId];

  if (params.get("cancelled") || !adapter.verify) {
    await db.update(schema.orders).set({ status: "failed" }).where(eq(schema.orders.id, order.id));
    return NextResponse.redirect(back);
  }

  try {
    const result = await adapter.verify(order, gw, params);
    if (result.ok) {
      // جلوگیری از ثبت دوباره در صورت رفرش صفحه بازگشت
      const updated = await db
        .update(schema.orders)
        .set({ status: "paid", paymentRef: result.ref, paidAt: new Date() })
        .where(and(eq(schema.orders.id, order.id), eq(schema.orders.status, "pending")))
        .returning();
      if (updated.length) await decrementStock(order.id);
    } else {
      console.warn("[payment verify]", order.id, result.reason);
      await db.update(schema.orders).set({ status: "failed" }).where(eq(schema.orders.id, order.id));
    }
  } catch (e) {
    console.error("[payment verify]", e);
    await db.update(schema.orders).set({ status: "failed" }).where(eq(schema.orders.id, order.id));
  }
  return NextResponse.redirect(back);
}
