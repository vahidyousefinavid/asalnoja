"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { changePassword, deleteCountry, saveCountry, saveCurrency, saveGateway, saveSettings } from "@/app/admin/actions/commerce";
import { Badge, Card, ConfirmButton, FormMessage, Input, Select, SubmitButton, Toggle } from "./ui";

type Cur = { code: string; name: string; symbol: string; rate: number; decimals: number; isBase: boolean };
type Gw = { id: string; name: string; enabled: boolean };

/* ---------------- کشور ---------------- */

export function CountryForm({
  country,
  currencies,
  gateways,
}: {
  country?: {
    code: string;
    name: string;
    currencyCode: string;
    enabled: boolean;
    shippingCost: number;
    freeShippingOver: number | null;
    sortOrder: number;
    gateways: string[];
  };
  currencies: Cur[];
  gateways: Gw[];
}) {
  const [state, action] = useActionState(saveCountry, undefined);
  const isNew = !country;
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <form action={action}>
        {!isNew ? <input type="hidden" name="code" value={country.code} /> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {isNew ? <Input label="کد کشور" name="code" placeholder="FR" required dir="ltr" hint="ISO دو حرفی" /> : null}
          <Input label="نام کشور" name="name" defaultValue={country?.name} required className={isNew ? "" : "lg:col-span-2"} />
          <Select label="ارز مشتری" name="currencyCode" defaultValue={country?.currencyCode ?? "USD"}>
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </Select>
          <Input label="هزینه ارسال (تومان)" name="shippingCost" type="number" min={0} defaultValue={country?.shippingCost ?? 0} dir="ltr" />
          <Input label="ارسال رایگان از (تومان)" name="freeShippingOver" type="number" min={0} defaultValue={country?.freeShippingOver ?? ""} dir="ltr" hint="خالی = هیچ‌وقت" />
          <Input label="ترتیب" name="sortOrder" type="number" defaultValue={country?.sortOrder ?? 99} dir="ltr" />
        </div>

        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium">درگاه‌های پرداخت فعال برای این کشور</legend>
          <div className="flex flex-wrap gap-2">
            {gateways.map((g) => (
              <label
                key={g.id}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-line px-3 text-sm has-[:checked]:border-thyme has-[:checked]:bg-thyme/10"
              >
                <input type="checkbox" name="gateways" value={g.id} defaultChecked={country?.gateways.includes(g.id)} className="size-4 accent-[var(--thyme)]" />
                {g.name}
                {!g.enabled ? <span className="text-[11px] text-danger">(درگاه خاموش)</span> : null}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Toggle label="فروش به این کشور فعال باشد" name="enabled" defaultChecked={country?.enabled ?? true} />
          <div className="ms-auto flex items-center gap-3">
            <FormMessage state={state} />
            <SubmitButton>{isNew ? "افزودن کشور" : "ذخیره"}</SubmitButton>
          </div>
        </div>
      </form>
      {!isNew ? (
        <form action={deleteCountry} className="mt-3 border-t border-line pt-3">
          <input type="hidden" name="code" value={country.code} />
          <ConfirmButton message={`کشور «${country.name}» حذف شود؟`} className="inline-flex items-center gap-1.5 text-xs font-bold text-danger hover:underline">
            <Trash2 className="size-3.5" /> حذف کشور
          </ConfirmButton>
        </form>
      ) : null}
    </div>
  );
}

/* ---------------- درگاه ---------------- */

export function GatewayForm({
  gateway,
  fields,
  callbackUrl,
}: {
  gateway: { id: string; name: string; enabled: boolean; sandbox: boolean; config: Record<string, string> };
  fields: { key: string; label: string; secret?: boolean }[];
  callbackUrl?: string;
}) {
  const [state, action] = useActionState(saveGateway, undefined);
  const online = fields.length > 0;
  return (
    <Card
      title={gateway.name}
      actions={gateway.enabled ? <Badge tone="good">فعال</Badge> : <Badge>خاموش</Badge>}
    >
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={gateway.id} />
        <Input label="نام نمایشی در پنل" name="name" defaultValue={gateway.name} />
        {fields.map((f) => (
          <Input
            key={f.key}
            label={f.label}
            name={`cfg.${f.key}`}
            type={f.secret ? "password" : "text"}
            defaultValue={f.secret ? "" : (gateway.config[f.key] ?? "")}
            placeholder={f.secret && gateway.config[f.key] ? "•••••••• (ذخیره شده؛ برای تغییر مقدار جدید وارد کنید)" : ""}
            autoComplete="off"
            dir="ltr"
          />
        ))}
        {!online ? (
          <p className="text-sm text-bark">
            {gateway.id === "bank_transfer"
              ? "اطلاعات حساب (شماره کارت، شبا، نام صاحب حساب) در بخش تنظیمات وارد می‌شود و بعد از ثبت سفارش به مشتری نمایش داده می‌شود."
              : "مشتری هنگام تحویل پرداخت می‌کند؛ سفارش با وضعیت «در انتظار پرداخت» ثبت می‌شود."}
          </p>
        ) : null}
        {callbackUrl ? (
          <p className="rounded-xl bg-comb px-3 py-2 text-xs text-bark">
            آدرس بازگشت (Callback):{" "}
            <span className="font-bold text-ink" dir="ltr">{callbackUrl}</span>
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Toggle label="درگاه فعال باشد" name="enabled" defaultChecked={gateway.enabled} />
          {online ? <Toggle label="حالت آزمایشی (Sandbox)" name="sandbox" defaultChecked={gateway.sandbox} /> : null}
        </div>
        <FormMessage state={state} />
        <SubmitButton>ذخیره</SubmitButton>
      </form>
    </Card>
  );
}

/* ---------------- ارز ---------------- */

export function CurrencyForm({ currency }: { currency?: Cur }) {
  const [state, action] = useActionState(saveCurrency, undefined);
  return (
    <form action={action} className="rounded-2xl border border-line bg-paper p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {currency ? (
          <input type="hidden" name="code" value={currency.code} />
        ) : (
          <Input label="کد ارز" name="code" placeholder="GBP" required dir="ltr" />
        )}
        <Input label="نام" name="name" defaultValue={currency?.name} required className={currency ? "lg:col-span-2" : ""} />
        <Input label="نماد" name="symbol" defaultValue={currency?.symbol} required dir="ltr" />
        <Input
          label="نرخ (به ازای ۱ تومان)"
          name="rate"
          type="number"
          step="any"
          min={0}
          defaultValue={currency?.rate ?? ""}
          required
          disabled={currency?.isBase}
          dir="ltr"
          hint={currency?.isBase ? "ارز پایه؛ همیشه ۱" : currency ? `۱ ${currency.code} ≈ ${Math.round(1 / currency.rate).toLocaleString("fa")} تومان` : "مثال: اگر ۱ دلار = ۱۰۰٬۰۰۰ تومان، نرخ = 0.00001"}
        />
        <Input label="رقم اعشار" name="decimals" type="number" min={0} max={4} defaultValue={currency?.decimals ?? 2} dir="ltr" />
      </div>
      {currency?.isBase ? <input type="hidden" name="rate" value="1" /> : null}
      <div className="mt-4 flex items-center gap-3">
        {currency ? <span className="text-sm font-bold" dir="ltr">{currency.code}</span> : null}
        {currency?.isBase ? <Badge tone="warn">ارز پایه</Badge> : null}
        <div className="ms-auto flex items-center gap-3">
          <FormMessage state={state} />
          <SubmitButton>{currency ? "ذخیره" : "افزودن ارز"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}

/* ---------------- تنظیمات ---------------- */

export function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const [state, action] = useActionState(saveSettings, undefined);
  return (
    <form action={action} className="space-y-6">
      <Card title="سایت و سئو">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="آدرس اصلی سایت" name="siteUrl" defaultValue={settings.siteUrl} required dir="ltr" hint="برای canonical، sitemap و Open Graph. مثل https://asalnoja.ir" className="sm:col-span-2" />
          <Input label="تصویر پیش‌فرض اشتراک‌گذاری (OG)" name="ogImage" defaultValue={settings.ogImage} dir="ltr" hint="آدرس تصویر ۱۲۰۰×۶۳۰؛ می‌توانید از تصاویر آپلودشده (/media/...) استفاده کنید." />
          <Input label="کد تأیید Google Search Console" name="googleVerification" defaultValue={settings.googleVerification} dir="ltr" hint="فقط مقدار content متاتگ" />
        </div>
      </Card>
      <Card title="اطلاعات تماس">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="تلفن" name="phone" defaultValue={settings.phone} dir="ltr" />
          <Input label="ایمیل" name="email" type="email" defaultValue={settings.email} dir="ltr" />
          <Input label="اینستاگرام (بدون @)" name="instagram" defaultValue={settings.instagram} dir="ltr" />
          <Input label="تلگرام (بدون @)" name="telegram" defaultValue={settings.telegram} dir="ltr" />
          <Input label="آدرس" name="address" defaultValue={settings.address} className="sm:col-span-2" />
        </div>
      </Card>
      <Card title="حساب بانکی برای کارت به کارت">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="شماره کارت" name="bankCardNumber" defaultValue={settings.bankCardNumber} dir="ltr" />
          <Input label="شماره شبا" name="bankIban" defaultValue={settings.bankIban} dir="ltr" />
          <Input label="نام صاحب حساب" name="bankHolder" defaultValue={settings.bankHolder} />
        </div>
      </Card>
      <div className="flex items-center gap-3">
        <SubmitButton>ذخیره تنظیمات</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  return (
    <Card title="تغییر رمز عبور">
      <form action={action} className="grid gap-4 sm:grid-cols-3 sm:items-end">
        <Input label="رمز فعلی" name="current" type="password" autoComplete="current-password" required dir="ltr" />
        <Input label="رمز جدید (حداقل ۱۰ نویسه)" name="next" type="password" autoComplete="new-password" minLength={10} required dir="ltr" />
        <SubmitButton variant="ghost">تغییر رمز</SubmitButton>
        <div className="sm:col-span-3">
          <FormMessage state={state} />
        </div>
      </form>
    </Card>
  );
}

