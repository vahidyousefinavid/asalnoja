"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Coins,
  CreditCard,
  Earth,
  ExternalLink,
  FolderTree,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Settings,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme";

const nav = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ReceiptText },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: FolderTree },
  { href: "/admin/languages", label: "زبان‌ها و ترجمه", icon: Languages },
  { href: "/admin/countries", label: "کشورها و ارسال", icon: Earth },
  { href: "/admin/payments", label: "درگاه‌های پرداخت", icon: CreditCard },
  { href: "/admin/currencies", label: "ارزها", icon: Coins },
  { href: "/admin/settings", label: "تنظیمات", icon: Settings },
];

export function Sidebar({ name, logout, pendingOrders }: { name: string; logout: () => Promise<void>; pendingOrders: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  const content = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-2.5 px-5 py-5">
        <LogoMark className="size-9 text-on-night" />
        <span>
          <span className="font-display block text-xl leading-none">عسل نوجا</span>
          <span className="text-xs text-on-night/60">پنل مدیریت</span>
        </span>
      </Link>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="منوی مدیریت">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active(href) ? "page" : undefined}
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] text-on-night/75 transition-colors hover:bg-on-night/10 hover:text-on-night aria-[current=page]:bg-honey aria-[current=page]:font-bold aria-[current=page]:text-on-honey"
          >
            <Icon className="size-5 shrink-0" />
            <span className="flex-1">{label}</span>
            {href === "/admin/orders" && pendingOrders > 0 ? (
              <span className="tabular rounded-full bg-on-night/15 px-2 text-xs">{pendingOrders.toLocaleString("fa")}</span>
            ) : null}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-on-night/10 p-3">
        <div className="flex h-11 items-center justify-between rounded-xl ps-3 text-sm text-on-night/75">
          تم پنل
          <ThemeToggle labels={{ toDark: "حالت تیره", toLight: "حالت روشن" }} tone="night" className="me-1" />
        </div>
        <a href="/" target="_blank" className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-on-night/75 hover:bg-on-night/10 hover:text-on-night">
          <ExternalLink className="size-4" /> مشاهده سایت
        </a>
        <form action={logout}>
          <button type="submit" className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-on-night/75 hover:bg-on-night/10 hover:text-on-night">
            <LogOut className="size-4" /> خروج ({name})
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-night px-4 text-on-night lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-lg" aria-label="باز کردن منو">
          <Menu className="size-5" />
        </button>
        <span className="font-display text-lg">پنل نوجا</span>
      </div>
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 border-e border-on-night/10 bg-night text-on-night lg:block">{content}</aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="منوی مدیریت">
          <button type="button" className="absolute inset-0 bg-[var(--scrim)]" aria-label="بستن منو" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 bg-night text-on-night">
            <button type="button" onClick={() => setOpen(false)} className="absolute end-3 top-4 grid size-10 place-items-center rounded-lg" aria-label="بستن منو">
              <X className="size-5" />
            </button>
            {content}
          </aside>
        </div>
      ) : null}
    </>
  );
}
