import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { PageHeader } from "@/components/admin/page-header";
import { AddLanguageForm, LanguageRow } from "@/components/admin/language-forms";
import { messageKeys } from "@/i18n/defaults";

export const metadata = { title: "زبان‌ها" };

export default async function LanguagesAdmin() {
  const [langs, currencies, trs] = await Promise.all([
    db.select().from(schema.languages).orderBy(asc(schema.languages.sortOrder)),
    db.select().from(schema.currencies),
    db.select().from(schema.translations),
  ]);
  const en = new Map(trs.filter((t) => t.locale === "en").map((t) => [t.key, t.value]));

  // درصد کلیدهایی که با متن انگلیسیِ کپی‌شده فرق دارند، یعنی واقعاً ترجمه شده‌اند
  const progress = (code: string) => {
    if (code === "en") return 100;
    const mine = trs.filter((t) => t.locale === code && t.value.trim() && t.value !== en.get(t.key));
    return (mine.length / messageKeys.length) * 100;
  };

  return (
    <>
      <PageHeader
        title="زبان‌ها و ترجمه"
        description="هر زبان آدرس جداگانه، ارز نمایش و جهت متن خودش را دارد. محتوای محصولات از صفحه هر محصول ترجمه می‌شود."
      />
      <div className="space-y-4">
        {langs.map((l) => (
          <LanguageRow
            key={`${l.code}-${l.enabled}-${l.isDefault}`}
            lang={l}
            currencies={currencies.map((c) => ({ code: c.code, name: c.name }))}
            progress={Math.min(100, progress(l.code))}
          />
        ))}
      </div>
      <div className="mt-8">
        <AddLanguageForm
          languages={langs.map((l) => ({ code: l.code, name: l.name }))}
          currencies={currencies.map((c) => ({ code: c.code, name: c.name }))}
        />
      </div>
    </>
  );
}
