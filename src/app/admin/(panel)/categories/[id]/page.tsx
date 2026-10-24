import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteCategory } from "@/app/admin/actions/catalog";
import { CategoryForm } from "@/components/admin/category-form";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmButton } from "@/components/admin/ui";
import { adminCategories, adminLanguages } from "@/lib/admin-data";

export const metadata = { title: "ویرایش دسته" };

export default async function CategoryEdit({ params }: PageProps<"/admin/categories/[id]">) {
  const { id } = await params;
  const langs = await adminLanguages();
  const def = langs.find((l) => l.isDefault)?.code ?? "fa";
  const cat = id === "new" ? null : (await adminCategories(def)).find((c) => c.id === Number(id));
  if (id !== "new" && !cat) notFound();

  return (
    <>
      <PageHeader
        title={cat ? cat.name : "دسته جدید"}
        actions={
          cat ? (
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={cat.id} />
              <ConfirmButton message="این دسته حذف شود؟ محصولات آن بدون دسته می‌مانند.">
                <Trash2 className="size-4" /> حذف
              </ConfirmButton>
            </form>
          ) : null
        }
      />
      <CategoryForm
        key={cat?.id ?? "new"}
        languages={langs}
        category={{
          id: cat?.id,
          slug: cat?.slug ?? "",
          sortOrder: cat?.sortOrder ?? 0,
          translations: Object.fromEntries((cat?.translations ?? []).map((t) => [t.locale, t])),
        }}
      />
    </>
  );
}
