"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** ثبت بازدید صفحه؛ داده‌ها فقط در دیتابیس خود سایت ذخیره می‌شوند */
export function Tracker() {
  const pathname = usePathname();
  useEffect(() => {
    const body = JSON.stringify({ path: pathname, referrer: document.referrer });
    try {
      if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" })))
        fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
    } catch {
      /* ثبت آمار نباید تجربه کاربر را خراب کند */
    }
  }, [pathname]);
  return null;
}
