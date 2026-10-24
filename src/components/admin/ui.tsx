"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { buttonClass } from "./button-class";

export { buttonClass };

export type ActionState = { ok?: boolean; message?: string; errors?: Record<string, string> } | undefined;

const field =
  "w-full rounded-xl border border-line bg-paper px-3.5 text-[15px] text-ink placeholder:text-bark/60 focus:border-ink focus:outline-none disabled:opacity-50";

export function Input({
  label,
  hint,
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const id = props.id ?? `in-${props.name}`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {props.required ? <span className="text-danger"> *</span> : null}
      </label>
      <input id={id} className={`${field} h-11`} aria-invalid={!!error} {...props} />
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-bark">{hint}</p> : null}
    </div>
  );
}

export function Textarea({
  label,
  hint,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const id = props.id ?? `ta-${props.name}`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <textarea id={id} className={`${field} py-2.5 leading-7`} rows={4} {...props} />
      {hint ? <p className="text-xs text-bark">{hint}</p> : null}
    </div>
  );
}

export function Select({
  label,
  children,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const id = props.id ?? `se-${props.name}`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select id={id} className={`${field} h-11`} {...props}>
        {children}
      </select>
    </div>
  );
}

/** سوییچ روشن/خاموش که یک checkbox واقعی است و با فرم ارسال می‌شود */
export function Toggle({
  label,
  name,
  defaultChecked,
  checked,
  onChange,
  hideLabel,
}: {
  label: string;
  name?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  hideLabel?: boolean;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm">
      <span className="relative inline-flex">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          checked={checked}
          onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
          className="peer sr-only"
          aria-label={hideLabel ? label : undefined}
        />
        <span className="h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-thyme peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-honey-deep" />
        <span className="absolute start-0.5 top-0.5 size-5 rounded-full bg-paper shadow transition-transform peer-checked:-translate-x-5 ltr:peer-checked:translate-x-5" />
      </span>
      {hideLabel ? null : <span>{label}</span>}
    </label>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || props.disabled} className={`${buttonClass(variant)} ${className}`} {...props}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

/** نتیجه اکشن؛ پیام موفقیت بعد از چند ثانیه محو می‌شود */
export function FormMessage({ state }: { state: ActionState }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- هر نتیجه جدید دوباره نمایش داده می‌شود
    setVisible(true);
    if (state?.ok) {
      const id = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(id);
    }
  }, [state]);
  if (!state?.message || !visible) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      aria-live="polite"
      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
        state.ok ? "bg-thyme/12 text-thyme" : "bg-danger/10 text-danger"
      }`}
    >
      {state.ok ? <CircleCheck className="size-4" /> : <CircleAlert className="size-4" />}
      {state.message}
    </p>
  );
}

export function Card({ title, children, actions, className = "" }: { title?: string; children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-paper ${className}`}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-bold">{title}</h2>
          {actions}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad" | "info"; children: React.ReactNode }) {
  const tones = {
    neutral: "bg-comb text-bark",
    good: "bg-thyme/15 text-thyme",
    warn: "bg-honey/25 text-amber-ink",
    bad: "bg-danger/10 text-danger",
    info: "bg-ink/10 text-ink",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

export function ConfirmButton({
  children,
  message,
  className,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className ?? buttonClass("danger")}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
