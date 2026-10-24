import { and, count, countDistinct, desc, gte, inArray, isNotNull, ne, sql, sum } from "drizzle-orm";
import { db, schema } from "@/db";

const pv = schema.pageViews;
const DAY = 86_400_000;
/** روزها به وقت تهران (UTC+3:30) گروه‌بندی می‌شوند */
const dayExpr = sql<string>`to_char(${pv.createdAt} at time zone 'Asia/Tehran', 'YYYY-MM-DD')`;
const PAID = ["paid", "processing", "shipped", "delivered"] as const;

function startOfTehranDay(now = Date.now()) {
  const offset = 210 * 60_000;
  return Math.floor((now + offset) / DAY) * DAY - offset;
}

export async function getDashboard(days = 30) {
  const since = new Date(startOfTehranDay() - (days - 1) * DAY);
  const today = new Date(startOfTehranDay());

  const [todayStats, rangeStats, daily, topPages, topProducts, countries, devices, referrers, orderStats, recent] = await Promise.all([
    db.select({ views: count(), visitors: countDistinct(pv.visitorId) }).from(pv).where(gte(pv.createdAt, today)),
    db.select({ views: count(), visitors: countDistinct(pv.visitorId) }).from(pv).where(gte(pv.createdAt, since)),
    db
      .select({ day: dayExpr, views: count(), visitors: countDistinct(pv.visitorId) })
      .from(pv)
      .where(gte(pv.createdAt, since))
      .groupBy(dayExpr)
      .orderBy(dayExpr),
    db
      .select({ path: pv.path, views: count() })
      .from(pv)
      .where(gte(pv.createdAt, since))
      .groupBy(pv.path)
      .orderBy(desc(count()))
      .limit(8),
    db
      .select({ productId: pv.productId, views: count() })
      .from(pv)
      .where(and(gte(pv.createdAt, since), isNotNull(pv.productId)))
      .groupBy(pv.productId)
      .orderBy(desc(count()))
      .limit(6),
    db
      .select({ country: pv.country, visitors: countDistinct(pv.visitorId) })
      .from(pv)
      .where(gte(pv.createdAt, since))
      .groupBy(pv.country)
      .orderBy(desc(countDistinct(pv.visitorId)))
      .limit(8),
    db
      .select({ device: pv.device, visitors: countDistinct(pv.visitorId) })
      .from(pv)
      .where(gte(pv.createdAt, since))
      .groupBy(pv.device),
    db
      .select({ referrer: pv.referrer, views: count() })
      .from(pv)
      .where(and(gte(pv.createdAt, since), ne(pv.referrer, "")))
      .groupBy(pv.referrer)
      .orderBy(desc(count()))
      .limit(6),
    db
      .select({ orders: count(), revenue: sum(schema.orders.total) })
      .from(schema.orders)
      .where(and(gte(schema.orders.createdAt, since), inArray(schema.orders.status, [...PAID]))),
    db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(8),
  ]);

  // روزهای بدون بازدید هم با صفر در نمودار می‌آیند
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(since.getTime() + i * DAY + 210 * 60_000).toISOString().slice(0, 10);
    const row = daily.find((r) => r.day === d);
    return { day: d, views: row?.views ?? 0, visitors: row?.visitors ?? 0 };
  });

  const productNames = topProducts.length
    ? await db
        .select({ id: schema.productTranslations.productId, locale: schema.productTranslations.locale, name: schema.productTranslations.name })
        .from(schema.productTranslations)
        .where(inArray(schema.productTranslations.productId, topProducts.map((p) => p.productId!)))
    : [];

  return {
    today: todayStats[0],
    range: rangeStats[0],
    series,
    topPages,
    topProducts: topProducts.map((p) => ({
      ...p,
      name:
        productNames.find((n) => n.id === p.productId && n.locale === "fa")?.name ??
        productNames.find((n) => n.id === p.productId)?.name ??
        `#${p.productId}`,
    })),
    countries,
    devices,
    referrers,
    orders: { count: orderStats[0].orders, revenue: Number(orderStats[0].revenue ?? 0) },
    recent,
  };
}
