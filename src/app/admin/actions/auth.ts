"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { createSession, destroySession } from "@/lib/auth";

const attempts = new Map<string, { n: number; at: number }>();

export async function login(_prev: { error?: string } | undefined, form: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const rec = attempts.get(ip);
  if (rec && Date.now() - rec.at < 15 * 60_000 && rec.n >= 8)
    return { error: "تلاش‌های ناموفق زیاد بود. ۱۵ دقیقه دیگر دوباره امتحان کنید." };

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const [user] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email));
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!ok) {
    attempts.set(ip, { n: (rec && Date.now() - rec.at < 15 * 60_000 ? rec.n : 0) + 1, at: Date.now() });
    return { error: "نام کاربری یا رمز عبور درست نیست." };
  }
  attempts.delete(ip);
  await createSession({ uid: user.id, email: user.email, name: user.name });
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
