import { NextResponse, type NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

let cache: { at: number; codes: string[]; def: string } | null = null;

async function locales() {
  if (cache && Date.now() - cache.at < 60_000) return cache;
  const rows = await db
    .select()
    .from(schema.languages)
    .where(eq(schema.languages.enabled, true))
    .orderBy(asc(schema.languages.sortOrder));
  cache = {
    at: Date.now(),
    codes: rows.map((r) => r.code),
    def: rows.find((r) => r.isDefault)?.code ?? rows[0]?.code ?? "fa",
  };
  return cache;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // بررسی خوش‌بینانه نشست؛ بررسی قطعی در خود صفحات و اکشن‌ها انجام می‌شود
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!session) return NextResponse.redirect(new URL("/admin/login", req.url));
    return NextResponse.next();
  }

  if (pathname === "/") {
    const { codes, def } = await locales();
    // مرورگرهای فارسی‌زبان اغلب en-US می‌فرستند؛ پس فقط انتخاب قبلی کاربر یا زبان پیش‌فرض
    const saved = req.cookies.get("NEXT_LOCALE")?.value;
    const target = saved && codes.includes(saved) ? saved : def;
    return NextResponse.redirect(new URL(`/${target}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
