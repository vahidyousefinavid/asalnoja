import path from "node:path";

/** مسیر ثابت آپلودها؛ ثابت بودن ریشه مسیر جلوی trace شدن کل پروژه در build را می‌گیرد */
export function uploadPath(...parts: string[]) {
  return path.join(process.cwd(), "storage", "uploads", ...parts);
}
