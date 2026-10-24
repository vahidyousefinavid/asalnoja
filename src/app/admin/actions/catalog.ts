"use server";

import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import type { ActionState } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { refreshStore } from "@/lib/revalidate";

const slugRule = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "نامک فقط حروف کوچک انگلیسی، عدد و خط تیره");

const optInt = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).nullable());
const optNum = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().min(0).max(100).nullable());

async function languageCodes() {
  return (await db.select({ code: schema.languages.code, isDefault: schema.languages.isDefault }).from(schema.languages));
}

/* ---------------- محصولات ---------------- */

export async function saveProduct(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = Number(form.get("id") || 0);

  const parsed = z
    .object({
      slug: slugRule,
      sku: z.string().trim().max(40),
      categoryId: optInt,
      price: z.coerce.number().int("قیمت باید عدد صحیح باشد").min(0),
      compareAtPrice: optInt,
      stock: z.coerce.number().int().min(0),
      weightGrams: z.coerce.number().int().min(1),
      tint: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      altitude: optInt,
      moisture: optNum,
      harvestYear: optInt,
      sortOrder: z.coerce.number().int(),
      status: z.enum(["draft", "published"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false, message: "چند فیلد نیاز به اصلاح دارد.", errors };
  }
  const data = parsed.data;

  let images: string[] = [];
  try {
    images = z.array(z.string().max(300)).max(12).parse(JSON.parse(String(form.get("images") ?? "[]")));
  } catch {
    /* بدون تصویر */
  }

  const clash = await db
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(and(eq(schema.products.slug, data.slug), id ? ne(schema.products.id, id) : undefined));
  if (clash.length) return { ok: false, message: "این نامک قبلاً برای محصول دیگری استفاده شده.", errors: { slug: "تکراری" } };

  const langs = await languageCodes();
  const trs = langs.map((l) => ({
    locale: l.code,
    isDefault: l.isDefault,
    name: String(form.get(`t.${l.code}.name`) ?? "").trim(),
    shortDescription: String(form.get(`t.${l.code}.shortDescription`) ?? "").trim(),
    description: String(form.get(`t.${l.code}.description`) ?? "").trim(),
    flora: String(form.get(`t.${l.code}.flora`) ?? "").trim(),
    origin: String(form.get(`t.${l.code}.origin`) ?? "").trim(),
    seoTitle: String(form.get(`t.${l.code}.seoTitle`) ?? "").trim(),
    seoDescription: String(form.get(`t.${l.code}.seoDescription`) ?? "").trim(),
  }));
  if (!trs.find((t) => t.isDefault)?.name) return { ok: false, message: "نام محصول در زبان پیش‌فرض الزامی است." };

  const values = {
    ...data,
    images,
    featured: form.get("featured") === "on",
    updatedAt: new Date(),
  };

  let productId = id;
  if (id) {
    await db.update(schema.products).set(values).where(eq(schema.products.id, id));
  } else {
    const [row] = await db.insert(schema.products).values(values).returning({ id: schema.products.id });
    productId = row.id;
  }

  for (const t of trs.map(({ isDefault, ...rest }) => (void isDefault, rest))) {
    if (!t.name) {
      await db
        .delete(schema.productTranslations)
        .where(and(eq(schema.productTranslations.productId, productId), eq(schema.productTranslations.locale, t.locale)));
      continue;
    }
    await db
      .insert(schema.productTranslations)
      .values({ productId, ...t })
      .onConflictDoUpdate({ target: [schema.productTranslations.productId, schema.productTranslations.locale], set: t });
  }

  refreshStore();
  if (!id) redirect(`/admin/products/${productId}?created=1`);
  return { ok: true, message: "محصول ذخیره شد." };
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  await db.delete(schema.products).where(eq(schema.products.id, Number(form.get("id"))));
  refreshStore();
  redirect("/admin/products");
}

/* ---------------- دسته‌بندی‌ها ---------------- */

export async function saveCategory(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = Number(form.get("id") || 0);
  const slug = slugRule.safeParse(form.get("slug"));
  if (!slug.success) return { ok: false, message: slug.error.issues[0].message, errors: { slug: slug.error.issues[0].message } };

  const clash = await db
    .select({ id: schema.categories.id })
    .from(schema.categories)
    .where(and(eq(schema.categories.slug, slug.data), id ? ne(schema.categories.id, id) : undefined));
  if (clash.length) return { ok: false, message: "این نامک تکراری است.", errors: { slug: "تکراری" } };

  const langs = await languageCodes();
  const trs = langs.map((l) => ({
    locale: l.code,
    isDefault: l.isDefault,
    name: String(form.get(`t.${l.code}.name`) ?? "").trim(),
    description: String(form.get(`t.${l.code}.description`) ?? "").trim(),
    seoTitle: String(form.get(`t.${l.code}.seoTitle`) ?? "").trim(),
    seoDescription: String(form.get(`t.${l.code}.seoDescription`) ?? "").trim(),
  }));
  if (!trs.find((t) => t.isDefault)?.name) return { ok: false, message: "نام دسته در زبان پیش‌فرض الزامی است." };

  const values = { slug: slug.data, sortOrder: Number(form.get("sortOrder") || 0) };
  let categoryId = id;
  if (id) await db.update(schema.categories).set(values).where(eq(schema.categories.id, id));
  else categoryId = (await db.insert(schema.categories).values(values).returning({ id: schema.categories.id }))[0].id;

  for (const t of trs.map(({ isDefault, ...rest }) => (void isDefault, rest))) {
    if (!t.name) {
      await db
        .delete(schema.categoryTranslations)
        .where(and(eq(schema.categoryTranslations.categoryId, categoryId), eq(schema.categoryTranslations.locale, t.locale)));
      continue;
    }
    await db
      .insert(schema.categoryTranslations)
      .values({ categoryId, ...t })
      .onConflictDoUpdate({ target: [schema.categoryTranslations.categoryId, schema.categoryTranslations.locale], set: t });
  }
  refreshStore();
  if (!id) redirect(`/admin/categories/${categoryId}`);
  return { ok: true, message: "دسته‌بندی ذخیره شد." };
}

export async function deleteCategory(form: FormData) {
  await requireAdmin();
  await db.delete(schema.categories).where(eq(schema.categories.id, Number(form.get("id"))));
  refreshStore();
  redirect("/admin/categories");
}
