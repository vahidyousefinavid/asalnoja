"use client";

import { Moon, Sun } from "lucide-react";

const KEY = "noja-theme";

/**
 * قبل از اولین رنگ‌آمیزی صفحه اجرا می‌شود تا تم ذخیره‌شده بدون پرش اعمال شود.
 * اگر کاربر چیزی انتخاب نکرده باشد، تم سیستم‌عامل (prefers-color-scheme) استفاده می‌شود.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${KEY}");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
}

function currentTheme(): "dark" | "light" {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({
  labels,
  tone = "default",
  className = "",
}: {
  labels: { toDark: string; toLight: string };
  /** night: روی سطوح همیشه‌تیره مثل منوی پنل */
  tone?: "default" | "night";
  className?: string;
}) {
  const toggle = () => {
    const root = document.documentElement;
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.classList.add("theme-switching");
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ذخیره‌سازی در دسترس نیست؛ تم فقط برای همین صفحه عوض می‌شود */
    }
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
  };

  return (
    <button
      type="button"
      dir="ltr"
      onClick={toggle}
      className={`theme-switch ${tone === "night" ? "theme-switch--night" : ""} ${className}`}
      title={`${labels.toDark} / ${labels.toLight}`}
    >
      <Sun className="theme-track-icon theme-track-sun" strokeWidth={1.75} aria-hidden="true" />
      <Moon className="theme-track-icon theme-track-moon" strokeWidth={1.75} aria-hidden="true" />
      <span className="theme-knob" aria-hidden="true">
        <Sun className="theme-knob-sun" strokeWidth={2} />
        <Moon className="theme-knob-moon" strokeWidth={2} />
      </span>
      <span className="sr-only">
        <span className="theme-label-dark">{labels.toDark}</span>
        <span className="theme-label-light">{labels.toLight}</span>
      </span>
    </button>
  );
}
