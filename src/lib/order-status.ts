import type { OrderStatus } from "@/db/schema";

export const statusMeta: Record<OrderStatus, { label: string; tone: "neutral" | "good" | "warn" | "bad" | "info" }> = {
  pending: { label: "در انتظار پرداخت", tone: "warn" },
  paid: { label: "پرداخت‌شده", tone: "good" },
  processing: { label: "در حال آماده‌سازی", tone: "info" },
  shipped: { label: "ارسال‌شده", tone: "info" },
  delivered: { label: "تحویل‌شده", tone: "good" },
  cancelled: { label: "لغوشده", tone: "neutral" },
  failed: { label: "ناموفق", tone: "bad" },
};

export const gatewayLabel: Record<string, string> = {
  zarinpal: "زرین‌پال",
  stripe: "Stripe",
  paypal: "PayPal",
  bank_transfer: "کارت به کارت",
  cod: "پرداخت در محل",
};

export const toman = (n: number) => `${new Intl.NumberFormat("fa-IR").format(n)} تومان`;
export const faNum = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
export const faDate = (d: Date) =>
  new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" }).format(d);
