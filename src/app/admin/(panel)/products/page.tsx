import Link from "next/link";
import Image from "next/image";
import { asc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db, schema } from "@/db";
import { ImagePlaceholder } from "@/components/brand";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/admin/button-class";
import { Badge } from "@/components/admin/ui";
import { adminCategories, adminLanguages, pickName } from "@/lib/admin-data";
import { faNum, toman } from "@/lib/order-status";

export const metadata = { title: "محصولات" };

export default async function ProductsAdmin() {
  const langs = await adminLanguages();
  const def = langs.find((l) => l.isDefault)?.code ?? "fa";
  const [products, trs, cats] = await Promise.all([
    db.select().from(schema.products).orderBy(asc(schema.products.sortOrder)),
    db.select().from(schema.productTranslations),
    adminCategories(def),
  ]);

  return (
    <>
      <PageHeader
        title="محصولات"
        description={`${faNum(products.length)} محصول`}
        actions={
          <Link href="/admin/products/new" className={buttonClass("honey")}>
            <Plus className="size-4" /> محصول جدید
          </Link>
        }
      />
      {products.length ? (
        <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-comb/60 text-bark">
              <tr>
                <th className="px-4 py-3 text-start font-medium">محصول</th>
                <th className="px-4 py-3 text-start font-medium">دسته</th>
                <th className="px-4 py-3 text-start font-medium">قیمت</th>
                <th className="px-4 py-3 text-start font-medium">موجودی</th>
                <th className="px-4 py-3 text-start font-medium">ترجمه‌ها</th>
                <th className="px-4 py-3 text-start font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => {
                const mine = trs.filter((t) => t.productId === p.id);
                return (
                  <tr key={p.id} className="hover:bg-comb/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-bold hover:underline">
                        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ background: `${p.tint}33` }}>
                          {p.images[0] ? (
                            <Image src={p.images[0]} alt="" width={48} height={48} className="size-full object-cover" />
                          ) : (
                            <ImagePlaceholder tint={p.tint} />
                          )}
                        </span>
                        <span>
                          {pickName(mine, def)}
                          <span className="block text-xs font-normal text-bark" dir="ltr">
                            {p.slug}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-bark">{cats.find((c) => c.id === p.categoryId)?.name ?? "—"}</td>
                    <td className="tabular px-4 py-3">{toman(p.price)}</td>
                    <td className="tabular px-4 py-3">
                      {p.stock === 0 ? <Badge tone="bad">ناموجود</Badge> : p.stock <= 5 ? <Badge tone="warn">{faNum(p.stock)}</Badge> : faNum(p.stock)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {langs.map((l) => {
                          const has = mine.some((t) => t.locale === l.code);
                          return (
                            <span
                              key={l.code}
                              title={`${l.name}: ${has ? "ترجمه دارد" : "بدون ترجمه"}`}
                              className={`rounded-md px-1.5 text-[11px] font-bold uppercase ${has ? "bg-thyme/15 text-thyme" : "bg-comb text-bark line-through"}`}
                            >
                              {l.code}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {p.status === "published" ? <Badge tone="good">منتشرشده</Badge> : <Badge>پیش‌نویس</Badge>}
                        {p.featured ? <Badge tone="warn">ویژه</Badge> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center">
          <p className="text-bark">هنوز محصولی نساخته‌اید.</p>
          <Link href="/admin/products/new" className={`${buttonClass("honey")} mt-4`}>
            ساخت اولین محصول
          </Link>
        </div>
      )}
    </>
  );
}
