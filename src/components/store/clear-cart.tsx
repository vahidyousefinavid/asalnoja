"use client";

import { useEffect } from "react";
import { useStore } from "./providers";

/** بعد از ثبت موفق سفارش، سبد خرید مرورگر را خالی می‌کند */
export function ClearCart() {
  const { clear } = useStore();
  useEffect(() => clear(), [clear]);
  return null;
}
