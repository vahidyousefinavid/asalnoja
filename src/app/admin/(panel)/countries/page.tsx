import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { CountryForm } from "@/components/admin/commerce-forms";
import { PageHeader } from "@/components/admin/page-header";

export const metadata = { title: "کشورها و ارسال" };

export default async function CountriesAdmin() {
  const [countries, currencies, gateways, mapping] = await Promise.all([
    db.select().from(schema.countries).orderBy(asc(schema.countries.sortOrder)),
    db.select().from(schema.currencies),
    db.select().from(schema.paymentGateways).orderBy(asc(schema.paymentGateways.sortOrder)),
    db.select().from(schema.countryGateways),
  ]);
  const gws = gateways.map((g) => ({ id: g.id, name: g.name, enabled: g.enabled }));

  return (
    <>
      <PageHeader
        title="کشورها و ارسال"
        description="برای هر کشور مشخص کنید فروش فعال باشد یا نه، هزینه ارسال چقدر است و کدام درگاه‌های پرداخت به مشتری نمایش داده شود."
      />
      <div className="space-y-4">
        {countries.map((c) => (
          <CountryForm
            key={c.code}
            country={{ ...c, gateways: mapping.filter((m) => m.countryCode === c.code).map((m) => m.gatewayId) }}
            currencies={currencies}
            gateways={gws}
          />
        ))}
      </div>
      <h2 className="font-display mb-3 mt-10 text-2xl">افزودن کشور</h2>
      <CountryForm currencies={currencies} gateways={gws} />
    </>
  );
}
