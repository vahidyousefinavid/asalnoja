"use client";

import { useState } from "react";

export type AdminLang = { code: string; name: string; nativeName: string; dir: "rtl" | "ltr"; isDefault: boolean };

/**
 * زبانه‌های ترجمه. همه پنل‌ها رندر می‌شوند (فقط پنهان) تا همه زبان‌ها با هم در فرم ارسال شوند.
 */
export function LangTabs({
  languages,
  filled,
  children,
}: {
  languages: AdminLang[];
  /** زبان‌هایی که ترجمه دارند؛ برای نشانگر کنار نام زبان */
  filled: string[];
  children: (lang: AdminLang) => React.ReactNode;
}) {
  const [active, setActive] = useState(languages.find((l) => l.isDefault)?.code ?? languages[0]?.code);
  return (
    <div>
      <div role="tablist" aria-label="زبان" className="flex flex-wrap gap-1.5 border-b border-line pb-3">
        {languages.map((l) => (
          <button
            key={l.code}
            type="button"
            role="tab"
            id={`tab-${l.code}`}
            aria-selected={active === l.code}
            aria-controls={`panel-${l.code}`}
            onClick={() => setActive(l.code)}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium text-bark hover:bg-comb aria-selected:bg-ink aria-selected:text-paper"
          >
            <span
              className={`size-2 rounded-full ${filled.includes(l.code) ? "bg-thyme" : "border border-current"}`}
              aria-hidden="true"
            />
            {l.name}
            {l.isDefault ? <span className="text-[11px] opacity-70">(پیش‌فرض)</span> : null}
          </button>
        ))}
      </div>
      {languages.map((l) => (
        <div
          key={l.code}
          role="tabpanel"
          id={`panel-${l.code}`}
          aria-labelledby={`tab-${l.code}`}
          hidden={active !== l.code}
          dir={l.dir}
          lang={l.code}
          className="pt-4"
        >
          {children(l)}
        </div>
      ))}
    </div>
  );
}
