import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { GatewayForm } from "@/components/admin/commerce-forms";
import { PageHeader } from "@/components/admin/page-header";
import { adapters } from "@/lib/payments";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "درگاه‌های پرداخت" };

export default async function PaymentsAdmin() {
  const [gateways, settings] = await Promise.all([
    db.select().from(schema.paymentGateways).orderBy(asc(schema.paymentGateways.sortOrder)),
    getSettings(),
  ]);
  return (
    <>
      <PageHeader
        title="درگاه‌های پرداخت"
        description="درگاه خاموش در هیچ کشوری نمایش داده نمی‌شود. اینکه هر درگاه در کدام کشور فعال باشد را از «کشورها و ارسال» تعیین کنید."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {gateways.map((g) => (
          <GatewayForm
            key={g.id}
            // کلیدهای محرمانه به مرورگر فرستاده نمی‌شوند؛ فقط اینکه ذخیره شده‌اند
            gateway={{
              ...g,
              config: Object.fromEntries(
                Object.entries(g.config).map(([k, v]) => [k, adapters[g.id].fields.find((f) => f.key === k)?.secret ? (v ? "set" : "") : v]),
              ),
            }}
            fields={adapters[g.id].fields}
            callbackUrl={adapters[g.id].start ? `${settings.siteUrl}/api/payment/${g.id}/callback` : undefined}
          />
        ))}
      </div>
    </>
  );
}
