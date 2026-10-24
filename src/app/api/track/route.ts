import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless|facebookexternalhit|bingpreview/i;

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT.test(ua)) return new NextResponse(null, { status: 204 });

  let body: { path?: string; referrer?: string };
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const path = String(body.path ?? "").slice(0, 300);
  if (!path.startsWith("/") || path.startsWith("/admin")) return new NextResponse(null, { status: 204 });

  const [, locale = "", section, slug] = path.split("/");
  let productId: number | null = null;
  if (section === "products" && slug) {
    const [p] = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.slug, decodeURIComponent(slug)));
    productId = p?.id ?? null;
  }

  let referrer = "";
  try {
    const r = new URL(String(body.referrer ?? ""));
    if (r.host !== req.nextUrl.host) referrer = r.host;
  } catch {
    /* ورود مستقیم */
  }

  const device = /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : "desktop";
  const country = (
    req.headers.get("cf-ipcountry") ??
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("x-country-code") ??
    ""
  )
    .toUpperCase()
    .slice(0, 2);

  let visitorId = req.cookies.get("noja_vid")?.value;
  const isNew = !visitorId;
  if (!visitorId) visitorId = crypto.randomUUID();

  await db.insert(schema.pageViews).values({
    path,
    locale: locale.slice(0, 10),
    productId,
    referrer,
    country,
    device,
    visitorId,
  });

  const res = new NextResponse(null, { status: 204 });
  if (isNew)
    res.cookies.set("noja_vid", visitorId, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return res;
}
