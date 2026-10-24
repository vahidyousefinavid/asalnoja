import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ExternalLink, Trash2 } from "lucide-react";
import { db, schema } from "@/db";
import { deleteProduct } from "@/app/admin/actions/catalog";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm, type ProductFormData } from "@/components/admin/product-form";
import { buttonClass } from "@/components/admin/button-class";
import { ConfirmButton } from "@/components/admin/ui";
import { adminCategories, adminLanguages } from "@/lib/admin-data";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "ویرایش محصول" };

export default async function ProductEdit({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const langs = await adminLanguages();
  const def = langs.find((l) => l.isDefault)?.code ?? "fa";
  const [cats, settings] = await Promise.all([adminCategories(def), getSettings()]);

  let product: ProductFormData;
  if (id === "new") {
    product = {
      slug: "",
      sku: "",
      categoryId: cats[0]?.id ?? null,
      price: 0,
      compareAtPrice: null,
      stock: 0,
      weightGrams: 500,
      tint: "#E39A2C",
      altitude: null,
      moisture: null,
      harvestYear: new Date().getFullYear(),
      featured: false,
      status: "published",
      sortOrder: 0,
      images: [],
      translations: {},
    };
  } else {
    const [row] = await db.select().from(schema.products).where(eq(schema.products.id, Number(id)));
    if (!row) notFound();
    const trs = await db.select().from(schema.productTranslations).where(eq(schema.productTranslations.productId, row.id));
    product = { ...row, translations: Object.fromEntries(trs.map((t) => [t.locale, t])) };
  }
  const title = product.id ? (product.translations[def]?.name ?? product.slug) : "محصول جدید";

  return (
    <>
      <PageHeader
        title={title}
        description={product.id ? "ویرایش محتوا، قیمت و سئوی محصول" : "اطلاعات محصول را در هر زبان وارد کنید"}
        actions={
          product.id ? (
            <>
              <Link href={`/${def}/products/${product.slug}`} target="_blank" className={buttonClass("ghost")}>
                <ExternalLink className="size-4" /> مشاهده در سایت
              </Link>
              <form action={deleteProduct}>
                <input type="hidden" name="id" value={product.id} />
                <ConfirmButton message="این محصول برای همیشه حذف شود؟ سفارش‌های قبلی حفظ می‌شوند.">
                  <Trash2 className="size-4" /> حذف
                </ConfirmButton>
              </form>
            </>
          ) : null
        }
      />
      <ProductForm
        key={product.id ?? "new"}
        product={product}
        languages={langs}
        categories={cats.map((c) => ({ id: c.id, name: c.name }))}
        siteUrl={settings.siteUrl}
      />
    </>
  );
}
