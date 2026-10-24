/** روشن/تیره کردن یک رنگ hex؛ amount بین -1 و 1 */
export function shade(hex: string, amount: number) {
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n.padEnd(6, "0");
  const ch = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  const out = ch.map((c) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${out.join("")}`;
}

/** درخشندگی نسبی برای انتخاب رنگ متن روی پس‌زمینه */
export function isDark(hex: string) {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5;
}
