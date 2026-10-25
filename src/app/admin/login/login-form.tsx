"use client";

import { useActionState } from "react";
import { CircleAlert } from "lucide-react";
import { LogoMark } from "@/components/brand";
import { Input, SubmitButton } from "@/components/admin/ui";
import { login } from "../actions/auth";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="w-full max-w-sm rounded-[28px] bg-paper p-8 shadow-2xl">
      <div className="mb-6 flex items-center gap-3">
        <LogoMark className="size-11" />
        <div>
          <h1 className="font-display text-2xl leading-none">پنل نوجا</h1>
          <p className="text-sm text-bark">برای مدیریت فروشگاه وارد شوید</p>
        </div>
      </div>
      <div className="space-y-4">
        <Input label="نام کاربری" name="email" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required dir="ltr" />
        <Input label="رمز عبور" name="password" type="password" autoComplete="current-password" required dir="ltr" />
        {state?.error ? (
          <p role="alert" className="flex items-center gap-2 text-sm text-danger">
            <CircleAlert className="size-4" /> {state.error}
          </p>
        ) : null}
        <SubmitButton className="w-full">ورود</SubmitButton>
      </div>
    </form>
  );
}
