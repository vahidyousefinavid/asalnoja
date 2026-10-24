import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { uploadPath } from "@/lib/uploads";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

/** فایل‌های آپلودشده از پنل مدیریت (بیرون از public تا بعد از build هم سرو شوند) */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: parts } = await ctx.params;
  const root = uploadPath();
  const file = path.normalize(uploadPath(...parts));
  if (!file.startsWith(root + path.sep)) return new NextResponse(null, { status: 400 });
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) return new NextResponse(null, { status: 404 });
  try {
    const data = await readFile(file);
    return new NextResponse(data, {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
