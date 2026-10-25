import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/settings";

// همیشه از دیتابیس خوانده می‌شود تا build به دیتابیس نیاز نداشته باشد
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { siteUrl } = await getSettings();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/*/checkout", "/*/order/"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
