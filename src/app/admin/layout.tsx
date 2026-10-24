import type { Metadata } from "next";
import "../globals.css";
import { ThemeScript } from "@/components/theme";

export const metadata: Metadata = {
  title: { default: "پنل مدیریت | عسل نوجا", template: "%s | پنل نوجا" },
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-comb/40 antialiased">{children}</body>
    </html>
  );
}
