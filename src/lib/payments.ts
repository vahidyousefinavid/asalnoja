import type { GatewayId, Order, PaymentGateway } from "@/db/schema";

/**
 * آداپتورهای درگاه پرداخت.
 * هر درگاه سه کار انجام می‌دهد: تعیین ارز پرداخت، شروع پرداخت و تأیید بازگشت.
 * تنظیمات (مرچنت، کلیدها، حالت آزمایشی) از پنل مدیریت خوانده می‌شود.
 */

export type StartResult =
  | { kind: "redirect"; url: string; authority: string }
  | { kind: "offline" };

export type VerifyResult = { ok: true; ref: string } | { ok: false; reason: string };

type Adapter = {
  /** ارزی که این درگاه با آن مبلغ را می‌گیرد؛ ورودی ارز کشور مشتری است */
  chargeCurrency: (countryCurrency: string) => string;
  /** فیلدهای تنظیمات برای فرم پنل مدیریت */
  fields: { key: string; label: string; secret?: boolean }[];
  start?: (order: Order, gw: PaymentGateway, callbackUrl: string, cancelUrl: string) => Promise<StartResult>;
  verify?: (order: Order, gw: PaymentGateway, params: URLSearchParams) => Promise<VerifyResult>;
};

const STRIPE_CURRENCIES = ["USD", "EUR", "GBP", "AED", "TRY", "CAD", "AUD", "CHF", "SEK"];
const PAYPAL_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "CHF", "SEK"];

/* ---------------- زرین‌پال (API نسخه ۴) ---------------- */

const zarinpal: Adapter = {
  chargeCurrency: () => "IRT",
  fields: [{ key: "merchantId", label: "مرچنت کد (Merchant ID)" }],
  async start(order, gw, callbackUrl) {
    const host = gw.sandbox ? "sandbox.zarinpal.com" : "payment.zarinpal.com";
    const res = await fetch(`https://${host}/pg/v4/payment/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: gw.config.merchantId,
        amount: Math.round(order.totalCharged),
        currency: "IRT",
        description: `Order ${order.id}`,
        callback_url: callbackUrl,
        metadata: { mobile: order.phone, email: order.email || undefined, order_id: order.id },
      }),
    });
    const json = await res.json();
    if (json?.data?.code !== 100) throw new Error(`zarinpal: ${JSON.stringify(json?.errors ?? json)}`);
    const authority: string = json.data.authority;
    return { kind: "redirect", url: `https://${host}/pg/StartPay/${authority}`, authority };
  },
  async verify(order, gw, params) {
    if (params.get("Status") !== "OK") return { ok: false, reason: "cancelled" };
    const authority = params.get("Authority");
    if (!authority || authority !== order.paymentAuthority) return { ok: false, reason: "authority mismatch" };
    const host = gw.sandbox ? "sandbox.zarinpal.com" : "payment.zarinpal.com";
    const res = await fetch(`https://${host}/pg/v4/payment/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: gw.config.merchantId,
        amount: Math.round(order.totalCharged),
        authority,
      }),
    });
    const json = await res.json();
    const code = json?.data?.code;
    if (code === 100 || code === 101) return { ok: true, ref: String(json.data.ref_id) };
    return { ok: false, reason: JSON.stringify(json?.errors ?? json) };
  },
};

/* ---------------- Stripe Checkout ---------------- */

const stripe: Adapter = {
  chargeCurrency: (c) => (STRIPE_CURRENCIES.includes(c) ? c : "USD"),
  fields: [
    { key: "secretKey", label: "Secret key (sk_...)", secret: true },
    { key: "publishableKey", label: "Publishable key (pk_...)" },
  ],
  async start(order, gw, callbackUrl, cancelUrl) {
    const body = new URLSearchParams({
      mode: "payment",
      success_url: `${callbackUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      client_reference_id: order.id,
      "metadata[order_id]": order.id,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": order.currencyCode.toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(Math.round(order.totalCharged * 100)),
      "line_items[0][price_data][product_data][name]": `Asal Noja — order ${order.id}`,
    });
    if (order.email) body.set("customer_email", order.email);
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${gw.config.secretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = await res.json();
    if (!res.ok || !json.url) throw new Error(`stripe: ${json?.error?.message ?? res.status}`);
    return { kind: "redirect", url: json.url, authority: json.id };
  },
  async verify(order, gw, params) {
    const sessionId = params.get("session_id");
    if (!sessionId || sessionId !== order.paymentAuthority) return { ok: false, reason: "session mismatch" };
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${gw.config.secretKey}` },
    });
    const json = await res.json();
    if (json.payment_status === "paid" && json.client_reference_id === order.id)
      return { ok: true, ref: String(json.payment_intent ?? sessionId) };
    return { ok: false, reason: `status ${json.payment_status}` };
  },
};

/* ---------------- PayPal Orders v2 ---------------- */

async function paypalToken(gw: PaymentGateway) {
  const base = gw.sandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${gw.config.clientId}:${gw.config.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const json = await res.json();
  if (!json.access_token) throw new Error("paypal: auth failed");
  return { base, token: json.access_token as string };
}

const paypal: Adapter = {
  chargeCurrency: (c) => (PAYPAL_CURRENCIES.includes(c) ? c : "USD"),
  fields: [
    { key: "clientId", label: "Client ID" },
    { key: "clientSecret", label: "Client secret", secret: true },
  ],
  async start(order, gw, callbackUrl, cancelUrl) {
    const { base, token } = await paypalToken(gw);
    const res = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: order.id,
            amount: { currency_code: order.currencyCode, value: order.totalCharged.toFixed(2) },
          },
        ],
        payment_source: {
          paypal: { experience_context: { return_url: callbackUrl, cancel_url: cancelUrl, user_action: "PAY_NOW" } },
        },
      }),
    });
    const json = await res.json();
    const link = json.links?.find((l: { rel: string }) => l.rel === "payer-action" || l.rel === "approve");
    if (!link) throw new Error(`paypal: ${json?.message ?? res.status}`);
    return { kind: "redirect", url: link.href, authority: json.id };
  },
  async verify(order, gw, params) {
    const id = params.get("token");
    if (!id || id !== order.paymentAuthority) return { ok: false, reason: "token mismatch" };
    const { base, token } = await paypalToken(gw);
    const res = await fetch(`${base}/v2/checkout/orders/${id}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (json.status === "COMPLETED") {
      const capture = json.purchase_units?.[0]?.payments?.captures?.[0]?.id;
      return { ok: true, ref: String(capture ?? id) };
    }
    return { ok: false, reason: `status ${json.status ?? res.status}` };
  },
};

/* ---------------- روش‌های آفلاین ---------------- */

const bankTransfer: Adapter = {
  chargeCurrency: (c) => c,
  fields: [],
};

const cod: Adapter = {
  chargeCurrency: (c) => c,
  fields: [],
};

export const adapters: Record<GatewayId, Adapter> = {
  zarinpal,
  stripe,
  paypal,
  bank_transfer: bankTransfer,
  cod,
};

export function isOnline(id: GatewayId) {
  return Boolean(adapters[id].start);
}
