"use client";

import Image from "next/image";
import { useState } from "react";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      {images.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto lg:w-20 lg:flex-col">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${alt} — ${i + 1}`}
              aria-pressed={i === active}
              className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-sm bg-comb opacity-60 ring-ink transition-opacity hover:opacity-100 aria-pressed:opacity-100 aria-pressed:ring-1"
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-md bg-comb">
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === active ? alt : ""}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className={`object-cover transition-opacity duration-500 ${i === active ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
    </div>
  );
}
