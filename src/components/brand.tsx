/** نشان نوجا: سلول شش‌ضلعی خطی با قطره عسل */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 44" className={className} aria-hidden="true" fill="none">
      <path d="M20 2 37.3 12v20L20 42 2.7 32V12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 13.5c4 5.4 6.2 8.6 6.2 11.6a6.2 6.2 0 0 1-12.4 0c0-3 2.2-6.2 6.2-11.6z" fill="var(--honey)" />
    </svg>
  );
}

export function Logo({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="size-8" />
      <span className="font-display text-[1.65rem] leading-none tracking-tight">{name}</span>
    </span>
  );
}

/** جای خالی تصویر محصول وقتی هنوز عکسی آپلود نشده */
export function ImagePlaceholder({ tint, className = "" }: { tint: string; className?: string }) {
  return (
    <div
      className={`grid size-full place-items-center ${className}`}
      style={{ background: `linear-gradient(160deg, ${tint}26, ${tint}0d)` }}
      aria-hidden="true"
    >
      <LogoMark className="size-14 text-ink/25" />
    </div>
  );
}
