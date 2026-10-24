"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { ImagePlaceholder } from "@/components/brand";
import { formatNumber } from "@/lib/money";
import { useStore, type CartItem } from "./providers";

export function CartDrawer() {
  const { t, items, subtotal, money, cartOpen, setCartOpen, locale } = useStore();

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t("cart.title")}>
      <button type="button" aria-label={t("nav.close")} className="absolute inset-0 bg-[var(--scrim)]" onClick={() => setCartOpen(false)} />
      <aside className="rise absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-paper shadow-2xl">
        <div className="flex h-[72px] items-center justify-between border-b border-line px-6">
          <h2 className="font-display text-2xl">
            {t("cart.title")}
            {items.length ? <span className="tabular ms-2 text-base text-bark">({formatNumber(items.reduce((s, i) => s + i.qty, 0), locale)})</span> : null}
          </h2>
          <button type="button" onClick={() => setCartOpen(false)} className="-me-2 grid size-11 place-items-center" aria-label={t("nav.close")} autoFocus>
            <X className="size-6" strokeWidth={1.5} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <ShoppingBag className="size-10 text-bark" strokeWidth={1.25} />
            <p className="text-bark">{t("cart.empty")}</p>
            <Link
              href={`/${locale}/products`}
              onClick={() => setCartOpen(false)}
              className="inline-flex h-12 items-center rounded-md bg-ink px-7 text-sm font-medium text-paper"
            >
              {t("cart.emptyCta")}
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {items.map((item) => (
                <CartLine key={item.id} item={item} />
              ))}
            </ul>
            <div className="border-t border-line px-6 py-6">
              <div className="mb-1 flex items-baseline justify-between">
                <span>{t("cart.subtotal")}</span>
                <span className="tabular text-lg font-medium">{money(subtotal)}</span>
              </div>
              <p className="mb-5 text-xs text-bark">{t("cart.shippingNote")}</p>
              <Link
                href={`/${locale}/checkout`}
                onClick={() => setCartOpen(false)}
                className="flex h-13 items-center justify-center rounded-md bg-ink py-4 font-medium text-paper transition-opacity hover:opacity-90"
              >
                {t("cart.checkout")}
              </Link>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="mt-2 h-11 w-full text-sm text-bark underline-offset-4 hover:text-ink hover:underline"
              >
                {t("cart.continue")}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function CartLine({ item }: { item: CartItem }) {
  const { t, money, setQty, remove, locale, setCartOpen } = useStore();
  return (
    <li className="flex gap-4 py-5">
      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-comb">
        {item.image ? (
          <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
        ) : (
          <ImagePlaceholder tint={item.tint} />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/${locale}/products/${item.slug}`}
            onClick={() => setCartOpen(false)}
            className="font-display truncate text-xl leading-tight hover:underline"
          >
            {item.name}
          </Link>
          <button
            type="button"
            onClick={() => remove(item.id)}
            className="-me-2 -mt-2 grid size-10 shrink-0 place-items-center text-bark hover:text-danger"
            aria-label={`${t("cart.remove")}: ${item.name}`}
          >
            <Trash2 className="size-4" strokeWidth={1.5} />
          </button>
        </div>
        <span className="tabular mt-0.5 text-sm text-bark">{money(item.price)}</span>
        <div className="mt-auto flex items-center justify-between pt-2">
          <QtyStepper value={item.qty} max={item.stock} onChange={(q) => setQty(item.id, q)} size="sm" />
          <span className="tabular font-medium">{money(item.price * item.qty)}</span>
        </div>
      </div>
    </li>
  );
}

export function QtyStepper({
  value,
  max,
  onChange,
  size = "md",
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
}) {
  const { t, locale } = useStore();
  const btn = size === "sm" ? "size-9" : "size-12";
  return (
    <div className="inline-flex items-center rounded-md border border-line" role="group" aria-label={t("product.quantity")}>
      <button
        type="button"
        className={`${btn} grid place-items-center transition-colors hover:bg-comb disabled:opacity-30`}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1 && size === "md"}
        aria-label={t("cart.decrease")}
      >
        <Minus className="size-4" strokeWidth={1.5} />
      </button>
      <output className="tabular min-w-8 text-center text-sm font-medium" aria-live="polite">
        {formatNumber(value, locale)}
      </output>
      <button
        type="button"
        className={`${btn} grid place-items-center transition-colors hover:bg-comb disabled:opacity-30`}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={t("cart.increase")}
      >
        <Plus className="size-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}

type Addable = Omit<CartItem, "qty">;

export function AddToCart({ product, variant = "full" }: { product: Addable; variant?: "full" | "compact" }) {
  const { t, add, setCartOpen } = useStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;

  useEffect(() => {
    if (!added) return;
    const id = setTimeout(() => setAdded(false), 2200);
    return () => clearTimeout(id);
  }, [added]);

  const onAdd = () => {
    add(product, variant === "full" ? qty : 1);
    setAdded(true);
    if (variant === "full") setCartOpen(true);
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onAdd}
        disabled={soldOut}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-paper/95 text-sm font-medium text-ink shadow-sm ring-1 ring-line backdrop-blur transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-50 md:ring-0"
        aria-label={soldOut ? t("product.outOfStock") : `${t("product.addToCart")}: ${product.name}`}
      >
        {added ? <Check className="size-4" strokeWidth={2} /> : <Plus className="size-4" strokeWidth={1.75} />}
        <span aria-live="polite">{soldOut ? t("product.outOfStock") : added ? t("product.added") : t("product.addToCart")}</span>
      </button>
    );
  }

  return (
    <div className="flex gap-3">
      {!soldOut ? <QtyStepper value={qty} max={product.stock} onChange={(q) => setQty(Math.max(1, q))} /> : null}
      <button
        type="button"
        onClick={onAdd}
        disabled={soldOut}
        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-ink px-8 font-medium text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {added ? <Check className="size-5" strokeWidth={1.75} /> : <ShoppingBag className="size-5" strokeWidth={1.5} />}
        {soldOut ? t("product.outOfStock") : added ? t("product.added") : t("product.addToCart")}
      </button>
    </div>
  );
}
