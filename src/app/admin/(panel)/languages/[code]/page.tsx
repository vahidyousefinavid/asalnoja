import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowRight } from "lucide-react";
import { db, schema } from "@/db";
import { PageHeader } from "@/components/admin/page-header";
import { TranslationEditor } from "@/components/admin/language-forms";
import { defaultMessages, messageKeys } from "@/i18n/defaults";

export const metadata = { title: "ترجمه متن‌ها" };

export default async function TranslationsPage({ params }: PageProps<"/admin/languages/[code]">) {
  const { code } = await params;
  const [lang] = await db.select().from(schema.languages).where(eq(schema.languages.code, code));
  if (!lang) notFound();
  const [def] = await db.select().from(schema.languages).where(eq(schema.languages.isDefault, true));
  const refCode = code === def?.code ? "en" : (def?.code ?? "fa");

  const [mine, ref] = await Promise.all([
    db.select().from(schema.translations).where(eq(schema.translations.locale, code)),
    db.select().from(schema.translations).where(eq(schema.translations.locale, refCode)),
  ]);
  const refMap = new Map(ref.map((r) => [r.key, r.value]));
  const mineMap = new Map(mine.map((r) => [r.key, r.value]));
  const keys = [...new Set([...messageKeys, ...mine.map((m) => m.key)])];

  return (
    <>
      <Link href="/admin/languages" className="mb-3 inline-flex items-center gap-1.5 text-sm text-bark hover:text-ink">
        <ArrowRight className="size-4" /> زبان‌ها
      </Link>
      <PageHeader
        title={`ترجمه رابط کاربری: ${lang.name}`}
        description={`متن مرجع زیر هر کلید به زبان «${refCode}» است. متغیرهایی مثل {n} یا {name} را دست نزنید.`}
      />
      <TranslationEditor
        locale={code}
        dir={lang.dir}
        rows={keys.map((key) => ({
          key,
          value: mineMap.get(key) ?? (defaultMessages.en as Record<string, string>)[key] ?? "",
          reference: refMap.get(key) ?? "",
        }))}
      />
    </>
  );
}
