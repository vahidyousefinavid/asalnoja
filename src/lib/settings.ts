import { cache } from "react";
import { db, schema } from "@/db";

export const settingDefaults = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  phone: "",
  email: "",
  instagram: "",
  telegram: "",
  address: "",
  ogImage: "",
  googleVerification: "",
  bankCardNumber: "",
  bankIban: "",
  bankHolder: "",
};

export type Settings = typeof settingDefaults;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.select().from(schema.settings);
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const merged = { ...settingDefaults, ...stored } as Settings;
  merged.siteUrl = merged.siteUrl.replace(/\/+$/, "") || settingDefaults.siteUrl;
  return merged;
});
