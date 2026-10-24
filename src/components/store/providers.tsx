"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translator, type Messages } from "@/lib/i18n-client";
import { formatMoney, type CurrencyLike } from "@/lib/money";

export type CartItem = {
  id: number;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  tint: string;
  stock: number;
  qty: number;
};

type StoreCtx = {
  locale: string;
  dir: "rtl" | "ltr";
  currency: CurrencyLike;
  t: ReturnType<typeof translator>;
  money: (base: number) => string;
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
};

const Ctx = createContext<StoreCtx | null>(null);
const KEY = "noja-cart-v1";

export function StoreProvider({
  locale,
  dir,
  currency,
  messages,
  children,
}: {
  locale: string;
  dir: "rtl" | "ltr";
  currency: CurrencyLike;
  messages: Messages;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- بازیابی سبد ذخیره‌شده پس از hydration
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ذخیره‌سازی مرورگر در دسترس نیست */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* نادیده */
    }
  }, [items, loaded]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found)
        return prev.map((p) => (p.id === item.id ? { ...p, ...item, qty: Math.min(p.qty + qty, item.stock) } : p));
      return [...prev, { ...item, qty: Math.min(qty, item.stock) }];
    });
  }, []);

  const setQty = useCallback((id: number, qty: number) => {
    setItems((prev) =>
      prev.flatMap((p) => (p.id !== id ? [p] : qty <= 0 ? [] : [{ ...p, qty: Math.min(qty, p.stock) }])),
    );
  }, []);

  const remove = useCallback((id: number) => setItems((prev) => prev.filter((p) => p.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<StoreCtx>(() => {
    const t = translator(messages);
    return {
      locale,
      dir,
      currency,
      t,
      money: (base) => formatMoney(base, currency, locale),
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.qty * i.price, 0),
      add,
      setQty,
      remove,
      clear,
      cartOpen,
      setCartOpen,
    };
  }, [messages, locale, dir, currency, items, add, setQty, remove, clear, cartOpen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
