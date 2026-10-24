import Link from "next/link";
import { count } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db, schema } from "@/db";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/admin/button-class";
import { adminCategories, adminLanguages } from "@/lib/admin-data";
import { faNum } from "@/lib/order-status";

export const metadata = { title: "دسته‌بندی‌ها" };

export default async function CategoriesAdmin() {
  const langs = await adminLanguages();
  const def = langs.find((l) => l.isDefault)?.code ?? "fa";
  const [cats, counts] = await Promise.all([
    adminCategories(def),
    db.select({ categoryId: schema.products.categoryId, n: count() }).from(schema.products).groupBy(schema.products.categoryId),
  ]);

  return (
    <>
      <PageHeader
        title="دسته‌بندی‌ها"
        description="هر دسته یک صفحه مستقل با آدرس و سئوی خودش دارد."
        actions={
          <Link href="/admin/categories/new" className={buttonClass("honey")}>
            <Plus className="size-4" /> دسته جدید
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c) => (
          <Link key={c.id} href={`/admin/categories/${c.id}`} className="rounded-2xl border border-line bg-paper p-5 transition-colors hover:bg-comb">
            <p className="font-bold">{c.name}</p>
            <p className="mt-1 text-xs text-bark" dir="ltr">/category/{c.slug}</p>
            <p className="mt-3 text-sm text-bark">
              {faNum(counts.find((x) => x.categoryId === c.id)?.n ?? 0)} محصول · {faNum(c.translations.length)} زبان
            </p>
          </Link>
        ))}
        {!cats.length ? <p className="text-bark">هنوز دسته‌ای نساخته‌اید.</p> : null}
      </div>
    </>
  );
}
