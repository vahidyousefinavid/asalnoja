"use client";

import { useActionState, useState } from "react";
import { saveProduct } from "@/app/admin/actions/catalog";
import { ImageUploader } from "./image-uploader";
import { LangTabs, type AdminLang } from "./lang-tabs";
import { SeoPreview } from "./seo-preview";
import { Card, FormMessage, Input, Select, SubmitButton, Textarea, Toggle } from "./ui";

type Tr = {
  name: string;
  shortDescription: string;
  description: string;
  flora: string;
  origin: string;
  seoTitle: string;
  seoDescription: string;
};

export type ProductFormData = {
  id?: number;
  slug: string;
  sku: string;
  categoryId: number | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  weightGrams: number;
  tint: string;
  altitude: number | null;
  moisture: number | null;
  harvestYear: number | null;
  featured: boolean;
  status: "draft" | "published";
  sortOrder: number;
  images: string[];
  translations: Record<string, Tr>;
};

const emptyTr: Tr = { name: "", shortDescription: "", description: "", flora: "", origin: "", seoTitle: "", seoDescription: "" };

export function ProductForm({
  product,
  languages,
  categories,
  siteUrl,
}: {
  product: ProductFormData;
  languages: AdminLang[];
  categories: { id: number; name: string }[];
  siteUrl: string;
}) {
  const [state, action] = useActionState(saveProduct, undefined);
  const [trs, setTrs] = useState<Record<string, Tr>>(() =>
    Object.fromEntries(languages.map((l) => [l.code, { ...emptyTr, ...product.translations[l.code] }])),
  );
  const [slug, setSlug] = useState(product.slug);
  const [tint, setTint] = useState(product.tint);
  const err = state?.errors ?? {};

  const set = (code: string, key: keyof Tr, value: string) => setTrs((p) => ({ ...p, [code]: { ...p[code], [key]: value } }));
  const slugFromEnglish = () => {
    const en = trs.en?.name || Object.values(trs).find((t) => /[a-z]/i.test(t.name))?.name || "";
    setSlug(en.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      {product.id ? <input type="hidden" name="id" value={product.id} /> : null}

      <div className="space-y-6">
        <Card title="متن محصول در هر زبان">
          <LangTabs languages={languages} filled={languages.filter((l) => trs[l.code]?.name).map((l) => l.code)}>
            {(l) => (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="نام محصول"
                  name={`t.${l.code}.name`}
                  value={trs[l.code].name}
                  onChange={(e) => set(l.code, "name", e.target.value)}
                  required={l.isDefault}
                  className="sm:col-span-2"
                  hint={l.isDefault ? undefined : "خالی بگذارید تا در این زبان از متن زبان پیش‌فرض استفاده شود."}
                />
                <Input label="گیاه غالب" name={`t.${l.code}.flora`} value={trs[l.code].flora} onChange={(e) => set(l.code, "flora", e.target.value)} />
                <Input label="منطقه برداشت" name={`t.${l.code}.origin`} value={trs[l.code].origin} onChange={(e) => set(l.code, "origin", e.target.value)} />
                <Textarea
                  label="توضیح کوتاه"
                  name={`t.${l.code}.shortDescription`}
                  value={trs[l.code].shortDescription}
                  onChange={(e) => set(l.code, "shortDescription", e.target.value)}
                  rows={2}
                  className="sm:col-span-2"
                  hint="زیر نام محصول نمایش داده می‌شود و اگر توضیح سئو خالی باشد، جای آن را می‌گیرد."
                />
                <Textarea
                  label="توضیحات کامل"
                  name={`t.${l.code}.description`}
                  value={trs[l.code].description}
                  onChange={(e) => set(l.code, "description", e.target.value)}
                  rows={7}
                  className="sm:col-span-2"
                  hint="برای پاراگراف جدید یک خط خالی بگذارید."
                />
                <fieldset className="space-y-4 rounded-xl border border-line p-4 sm:col-span-2">
                  <legend className="px-1 text-sm font-bold">سئو</legend>
                  <Input
                    label="عنوان سئو"
                    name={`t.${l.code}.seoTitle`}
                    value={trs[l.code].seoTitle}
                    onChange={(e) => set(l.code, "seoTitle", e.target.value)}
                    hint={`${trs[l.code].seoTitle.length.toLocaleString("fa")} نویسه؛ بهتر است زیر ۶۰ باشد. خالی = نام محصول`}
                  />
                  <Textarea
                    label="توضیح متا"
                    name={`t.${l.code}.seoDescription`}
                    value={trs[l.code].seoDescription}
                    onChange={(e) => set(l.code, "seoDescription", e.target.value)}
                    rows={2}
                    hint={`${trs[l.code].seoDescription.length.toLocaleString("fa")} نویسه؛ بهتر است بین ۱۲۰ تا ۱۶۰ باشد.`}
                  />
                  <SeoPreview
                    url={`${siteUrl}/${l.code}/products/${slug || "…"}`}
                    title={trs[l.code].seoTitle || trs[l.code].name || "نام محصول"}
                    description={trs[l.code].seoDescription || trs[l.code].shortDescription}
                    dir={l.dir}
                  />
                </fieldset>
              </div>
            )}
          </LangTabs>
        </Card>

        <Card title="تصاویر">
          <ImageUploader name="images" initial={product.images} />
        </Card>

        <Card title="شناسنامه برداشت">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="ارتفاع کندو (متر)" name="altitude" type="number" min={0} defaultValue={product.altitude ?? ""} error={err.altitude} />
            <Input label="رطوبت (٪)" name="moisture" type="number" step="0.1" min={0} max={100} defaultValue={product.moisture ?? ""} error={err.moisture} />
            <Input label="سال برداشت (میلادی)" name="harvestYear" type="number" defaultValue={product.harvestYear ?? ""} error={err.harvestYear} />
          </div>
        </Card>
      </div>

      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Card>
          <div className="space-y-4">
            <Select label="وضعیت انتشار" name="status" defaultValue={product.status}>
              <option value="published">منتشرشده</option>
              <option value="draft">پیش‌نویس (در سایت دیده نمی‌شود)</option>
            </Select>
            <Toggle label="نمایش در صفحه اصلی (ویژه)" name="featured" defaultChecked={product.featured} />
            <FormMessage state={state} />
            <SubmitButton className="w-full">{product.id ? "ذخیره تغییرات" : "ساخت محصول"}</SubmitButton>
          </div>
        </Card>

        <Card title="قیمت و موجودی">
          <div className="space-y-4">
            <Input label="قیمت (تومان)" name="price" type="number" min={0} required defaultValue={product.price || ""} error={err.price} dir="ltr" hint="قیمت در زبان‌های دیگر با نرخ ارز همان زبان تبدیل می‌شود." />
            <Input label="قیمت قبل از تخفیف (تومان)" name="compareAtPrice" type="number" min={0} defaultValue={product.compareAtPrice ?? ""} dir="ltr" />
            <Input label="موجودی" name="stock" type="number" min={0} required defaultValue={product.stock} error={err.stock} dir="ltr" />
            <Input label="وزن خالص (گرم)" name="weightGrams" type="number" min={1} required defaultValue={product.weightGrams} dir="ltr" />
          </div>
        </Card>

        <Card title="آدرس و دسته">
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Input label="نامک (slug)" name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required dir="ltr" error={err.slug} hint="بخشی از آدرس صفحه؛ مثل thyme-honey" />
              <button type="button" onClick={slugFromEnglish} className="self-start text-xs font-bold text-amber-ink hover:underline">
                ساخت از نام انگلیسی
              </button>
            </div>
            <Input label="کد محصول (SKU)" name="sku" defaultValue={product.sku} dir="ltr" />
            <Select label="دسته‌بندی" name="categoryId" defaultValue={product.categoryId ?? ""}>
              <option value="">بدون دسته</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Input label="ترتیب نمایش" name="sortOrder" type="number" defaultValue={product.sortOrder} dir="ltr" hint="عدد کمتر، جلوتر نمایش داده می‌شود." />
          </div>
        </Card>

        <Card title="رنگ عسل">
          <div className="flex items-center gap-4">
            <span className="size-20 shrink-0 rounded-md border border-line" style={{ background: tint }} aria-hidden="true" />
            <div className="flex-1">
              <label htmlFor="tint" className="text-sm font-medium">رنگ</label>
              <input id="tint" type="color" name="tint" value={tint} onChange={(e) => setTint(e.target.value)} className="mt-1.5 h-11 w-full cursor-pointer rounded-xl border border-line bg-paper p-1" />
              <p className="mt-1.5 text-xs text-bark">برای پس‌زمینه وقتی محصول هنوز عکس ندارد.</p>
            </div>
          </div>
        </Card>
      </div>
    </form>
  );
}
