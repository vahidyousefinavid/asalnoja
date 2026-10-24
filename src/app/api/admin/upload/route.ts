import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { uploadPath } from "@/lib/uploads";

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};
const MAX = 6 * 1024 * 1024;

export async function POST(req: NextRequest) {
  if (!(await verifySession(req.cookies.get(SESSION_COOKIE)?.value)))
    return NextResponse.json({ error: "ابتدا وارد پنل شوید." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "فایلی انتخاب نشده است." }, { status: 400 });
  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ error: "فقط JPG، PNG، WebP یا AVIF قابل آپلود است." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "حجم تصویر باید کمتر از ۶ مگابایت باشد." }, { status: 400 });

  const now = new Date();
  const sub = path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
  const name = `${crypto.randomUUID().slice(0, 12)}${ext}`;
  await mkdir(uploadPath(sub), { recursive: true });
  await writeFile(uploadPath(sub, name), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/media/${sub.replaceAll(path.sep, "/")}/${name}` });
}
