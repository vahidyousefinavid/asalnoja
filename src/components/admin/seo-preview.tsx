/** پیش‌نمایش نتیجه جستجوی گوگل */
export function SeoPreview({ url, title, description, dir }: { url: string; title: string; description: string; dir: "rtl" | "ltr" }) {
  const t = title.length > 60 ? title.slice(0, 58) + "…" : title;
  const d = description.length > 160 ? description.slice(0, 158) + "…" : description;
  return (
    <div className="rounded-xl bg-white p-4 text-start shadow-sm ring-1 ring-black/5" dir={dir} aria-label="پیش‌نمایش در نتایج جستجو">
      <p className="truncate text-xs text-[#4d5156]" dir="ltr">{decodeURI(url)}</p>
      <p className="mt-1 text-lg leading-snug text-[#1a0dab]">{t}</p>
      <p className="mt-1 text-sm leading-6 text-[#4d5156]">{d || "توضیحی وارد نشده؛ گوگل خودش بخشی از صفحه را نشان می‌دهد."}</p>
    </div>
  );
}
