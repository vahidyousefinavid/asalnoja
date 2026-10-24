import { PasswordForm, SettingsForm } from "@/components/admin/commerce-forms";
import { PageHeader } from "@/components/admin/page-header";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "تنظیمات" };

export default async function SettingsAdmin() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader title="تنظیمات" description="نام و شعار سایت در هر زبان از بخش «زبان‌ها و ترجمه» (کلیدهای site.*) ویرایش می‌شود." />
      <SettingsForm settings={settings} />
      <div className="mt-8">
        <PasswordForm />
      </div>
    </>
  );
}
