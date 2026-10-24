import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "ورود" };

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  return (
    <div className="grid min-h-dvh place-items-center bg-honey px-4">
      <LoginForm />
    </div>
  );
}
