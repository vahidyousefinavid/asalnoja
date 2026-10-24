"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Languages, Search, Trash2 } from "lucide-react";
import { addLanguage, deleteLanguage, saveTranslations, updateLanguage } from "@/app/admin/actions/commerce";
import { Badge, buttonClass, Card, ConfirmButton, FormMessage, Input, Select, SubmitButton, Toggle } from "./ui";

type Lang = {
  code: string;
  name: string;
  nativeName: string;
  dir: "rtl" | "ltr";
  currencyCode: string;
  enabled: boolean;
  isDefault: boolean;
  sortOrder: number;
};
type Cur = { code: string; name: string };

export function LanguageRow({ lang, currencies, progress }: { lang: Lang; currencies: Cur[]; progress: number }) {
  const [state, action] = useActionState(updateLanguage, undefined);
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <form action={action}>
        <input type="hidden" name="code" value={lang.code} />
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-comb text-sm font-bold uppercase">{lang.code}</span>
          <div className="me-auto">
            <p className="font-bold">
              {lang.name} <span className="font-normal text-bark">· {lang.nativeName}</span>
            </p>
            <p className="text-xs text-bark">
              آدرس: <span dir="ltr">/{lang.code}</span> · ترجمه رابط کاربری: {Math.round(progress).toLocaleString("fa")}٪
            </p>
          </div>
          {lang.isDefault ? <Badge tone="warn">پیش‌فرض</Badge> : null}
          {lang.enabled ? <Badge tone="good">فعال</Badge> : <Badge>غیرفعال</Badge>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input label="نام (برای مدیر)" name="name" defaultValue={lang.name} required />
          <Input label="نام بومی (در سایت)" name="nativeName" defaultValue={lang.nativeName} required />
          <Select label="جهت متن" name="dir" defaultValue={lang.dir}>
            <option value="rtl">راست به چپ</option>
            <option value="ltr">چپ به راست</option>
          </Select>
          <Select label="ارز نمایش قیمت" name="currencyCode" defaultValue={lang.currencyCode}>
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
          </Select>
          <Input label="ترتیب" name="sortOrder" type="number" defaultValue={lang.sortOrder} dir="ltr" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Toggle label="فعال در سایت" name="enabled" defaultChecked={lang.enabled} />
          {!lang.isDefault ? <Toggle label="زبان پیش‌فرض شود" name="isDefault" /> : null}
          <div className="ms-auto flex flex-wrap gap-2">
            <Link href={`/admin/languages/${lang.code}`} className={buttonClass("ghost")}>
              <Languages className="size-4" /> ترجمه متن‌ها
            </Link>
            <SubmitButton>ذخیره</SubmitButton>
          </div>
        </div>
        <div className="mt-3">
          <FormMessage state={state} />
        </div>
      </form>
      {!lang.isDefault ? (
        <form action={deleteLanguage} className="mt-3 border-t border-line pt-3">
          <input type="hidden" name="code" value={lang.code} />
          <ConfirmButton
            message={`زبان «${lang.name}» و همه ترجمه‌های محصولاتش حذف شود؟ این کار برگشت‌پذیر نیست.`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-danger hover:underline"
          >
            <Trash2 className="size-3.5" /> حذف این زبان
          </ConfirmButton>
        </form>
      ) : null}
    </div>
  );
}

export function AddLanguageForm({ languages, currencies }: { languages: { code: string; name: string }[]; currencies: Cur[] }) {
  const [state, action] = useActionState(addLanguage, undefined);
  return (
    <Card title="افزودن زبان جدید">
      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="کد زبان" name="code" placeholder="tr" required dir="ltr" hint="کد استاندارد ISO؛ مثل tr، de، ru" />
          <Input label="نام (برای مدیر)" name="name" placeholder="ترکی" required />
          <Input label="نام بومی" name="nativeName" placeholder="Türkçe" required />
          <Select label="جهت متن" name="dir" defaultValue="ltr">
            <option value="ltr">چپ به راست</option>
            <option value="rtl">راست به چپ</option>
          </Select>
          <Select label="ارز نمایش قیمت" name="currencyCode" defaultValue="USD">
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
          </Select>
          <Select label="کپی متن‌ها از" name="copyFrom" defaultValue="en">
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </Select>
          <input type="hidden" name="sortOrder" value={languages.length} />
        </div>
        <p className="text-sm text-bark">زبان جدید غیرفعال ساخته می‌شود تا قبل از نمایش در سایت متن‌ها را ترجمه کنید.</p>
        <FormMessage state={state} />
        <SubmitButton variant="primary">افزودن زبان</SubmitButton>
      </form>
    </Card>
  );
}

export function TranslationEditor({
  locale,
  dir,
  rows,
}: {
  locale: string;
  dir: "rtl" | "ltr";
  rows: { key: string; value: string; reference: string }[];
}) {
  const [state, action] = useActionState(saveTranslations, undefined);
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const filtered = rows.filter(
      (r) => !q || r.key.includes(q) || r.value.includes(q) || r.reference.includes(q),
    );
    const map = new Map<string, typeof rows>();
    for (const r of filtered) {
      const g = r.key.split(".")[0];
      map.set(g, [...(map.get(g) ?? []), r]);
    }
    return [...map.entries()];
  }, [rows, q]);

  return (
    <form action={action}>
      <input type="hidden" name="locale" value={locale} />
      <div className="sticky top-14 z-20 -mx-4 mb-4 flex flex-wrap items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur lg:top-0">
        <label className="relative min-w-60 flex-1">
          <span className="sr-only">جستجو در متن‌ها</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-bark" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو در کلید یا متن…"
            className="h-11 w-full rounded-xl border border-line bg-paper ps-9 pe-3 text-sm focus:border-ink focus:outline-none"
          />
        </label>
        <FormMessage state={state} />
        <SubmitButton>ذخیره همه ترجمه‌ها</SubmitButton>
      </div>
      <div className="space-y-6">
        {groups.map(([group, items]) => (
          <Card key={group} title={group}>
            <div className="space-y-4">
              {items.map((r) => (
                <div key={r.key} className="grid gap-2 md:grid-cols-[220px_1fr]">
                  <div>
                    <p className="text-xs font-bold text-bark" dir="ltr">{r.key}</p>
                    <p className="mt-1 text-xs text-bark/80">{r.reference}</p>
                  </div>
                  {r.reference.length > 80 || r.value.length > 80 ? (
                    <textarea
                      name={`k:${r.key}`}
                      defaultValue={r.value}
                      dir={dir}
                      rows={Math.min(8, Math.ceil(r.value.length / 70) + 1)}
                      aria-label={r.key}
                      className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[15px] leading-7 focus:border-ink focus:outline-none"
                    />
                  ) : (
                    <input
                      name={`k:${r.key}`}
                      defaultValue={r.value}
                      dir={dir}
                      aria-label={r.key}
                      className="h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-[15px] focus:border-ink focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
        {!groups.length ? <p className="text-center text-bark">متنی با این جستجو پیدا نشد.</p> : null}
      </div>
    </form>
  );
}
