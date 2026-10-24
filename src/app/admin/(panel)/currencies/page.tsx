import { db, schema } from "@/db";
import { CurrencyForm } from "@/components/admin/commerce-forms";
import { PageHeader } from "@/components/admin/page-header";

export const metadata = { title: "ارزها" };

export default async function CurrenciesAdmin() {
  const currencies = await db.select().from(schema.currencies);
  currencies.sort((a, b) => Number(b.isBase) - Number(a.isBase));
  return (
    <>
      <PageHeader
        title="ارزها و نرخ تبدیل"
        description="قیمت همه محصولات به تومان (ارز پایه) ذخیره می‌شود و برای هر زبان و کشور با این نرخ‌ها تبدیل می‌شود."
      />
      <div className="space-y-4">
        {currencies.map((c) => (
          <CurrencyForm key={`${c.code}-${c.rate}`} currency={c} />
        ))}
      </div>
      <h2 className="font-display mb-3 mt-10 text-2xl">افزودن ارز</h2>
      <CurrencyForm />
    </>
  );
}
