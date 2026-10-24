export function buttonClass(variant: "primary" | "ghost" | "danger" | "honey" = "primary") {
  const base =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  return {
    primary: `${base} bg-ink text-paper hover:bg-ink/90`,
    honey: `${base} bg-honey text-on-honey hover:bg-honey-deep`,
    ghost: `${base} border border-line bg-paper text-ink hover:bg-comb`,
    danger: `${base} border border-danger/40 text-danger hover:bg-danger/10`,
  }[variant];
}
