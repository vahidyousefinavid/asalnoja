"use client";

import { useActionState } from "react";
import { saveCategory } from "@/app/admin/actions/catalog";
import { LangTabs, type AdminLang } from "./lang-tabs";
import { Card, FormMessage, Input, SubmitButton, Textarea } from "./ui";

type Tr = { name: string; description: string; seoTitle: string; seoDescription: string };

export function CategoryForm({
  category,
  languages,
}: {
  category: { id?: number; slug: string; sortOrder: number; translations: Record<string, Partial<Tr>> };
  languages: AdminLang[];
}) {
  const [state, action] = useActionState(saveCategory, undefined);
  const tr = (code: string): Tr => ({ name: "", description: "", seoTitle: "", seoDescription: "", ...category.translations[code] });
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {category.id ? <input type="hidden" name="id" value={category.id} /> : null}
      <Card title="نام و توضیح در هر زبان">
        <LangTabs languages={languages} filled={Object.keys(category.translations)}>
          {(l) => (
            <div className="grid gap-4">
              <Input label="نام دسته" name={`t.${l.code}.name`} defaultValue={tr(l.code).name} required={l.isDefault} />
              <Textarea label="توضیح" name={`t.${l.code}.description`} defaultValue={tr(l.code).description} rows={3} hint="بالای صفحه دسته نمایش داده می‌شود." />
              <Input label="عنوان سئو" name={`t.${l.code}.seoTitle`} defaultValue={tr(l.code).seoTitle} hint="خالی = نام دسته" />
              <Textarea label="توضیح متا" name={`t.${l.code}.seoDescription`} defaultValue={tr(l.code).seoDescription} rows={2} />
            </div>
          )}
        </LangTabs>
      </Card>
      <Card>
        <div className="space-y-4">
          <Input label="نامک (slug)" name="slug" defaultValue={category.slug} required dir="ltr" error={state?.errors?.slug} hint="آدرس: /fa/category/نامک" />
          <Input label="ترتیب نمایش" name="sortOrder" type="number" defaultValue={category.sortOrder} dir="ltr" />
          <FormMessage state={state} />
          <SubmitButton className="w-full">{category.id ? "ذخیره تغییرات" : "ساخت دسته"}</SubmitButton>
        </div>
      </Card>
    </form>
  );
}
