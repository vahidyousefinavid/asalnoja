"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";

export function ImageUploader({ name, initial }: { name: string; initial: string[] }) {
  const [images, setImages] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.set("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "آپلود انجام نشد");
        setImages((prev) => [...prev, json.url]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "آپلود انجام نشد");
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  const move = (i: number, dir: -1 | 1) =>
    setImages((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(images)} />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((src, i) => (
          <div key={src} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-comb">
            <Image src={src} alt="" fill sizes="160px" className="object-cover" />
            {i === 0 ? <span className="absolute start-1.5 top-1.5 rounded-md bg-ink px-1.5 text-[11px] text-paper">اصلی</span> : null}
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1">
              <button type="button" onClick={() => move(i, -1)} className="grid size-8 place-items-center rounded-lg bg-paper/90" aria-label="جابه‌جایی به قبل">
                <ArrowRight className="size-4" />
              </button>
              <button type="button" onClick={() => setImages((p) => p.filter((x) => x !== src))} className="grid size-8 place-items-center rounded-lg bg-paper/90 text-danger" aria-label="حذف تصویر">
                <X className="size-4" />
              </button>
              <button type="button" onClick={() => move(i, 1)} className="grid size-8 place-items-center rounded-lg bg-paper/90" aria-label="جابه‌جایی به بعد">
                <ArrowLeft className="size-4" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line text-sm text-bark hover:border-ink hover:text-ink"
        >
          {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          افزودن تصویر
        </button>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => upload(e.target.files)} />
      <p className="mt-2 text-xs text-bark">تصویر اول، تصویر اصلی محصول و تصویر اشتراک‌گذاری در شبکه‌های اجتماعی است. بدون تصویر، شیشه با رنگ عسل نمایش داده می‌شود.</p>
      {error ? <p role="alert" className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
