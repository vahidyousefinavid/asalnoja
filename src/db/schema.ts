import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/* ---------- انواع ---------- */

export const gatewayIds = ["zarinpal", "stripe", "paypal", "bank_transfer", "cod"] as const;
export type GatewayId = (typeof gatewayIds)[number];

export const orderStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "failed"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const textDir = pgEnum("text_dir", ["rtl", "ltr"]);
export const gatewayEnum = pgEnum("gateway_id", gatewayIds);
export const orderStatusEnum = pgEnum("order_status", orderStatuses);
export const productStatusEnum = pgEnum("product_status", ["draft", "published"]);
export const deviceEnum = pgEnum("device", ["mobile", "tablet", "desktop"]);

/* ---------- زبان‌ها و ترجمه رابط کاربری ---------- */

export const languages = pgTable("languages", {
  code: text("code").primaryKey(), // fa, en, ar, ...
  name: text("name").notNull(), // نام به زبان مدیر: «انگلیسی»
  nativeName: text("native_name").notNull(), // English
  dir: textDir("dir").notNull().default("ltr"),
  currencyCode: text("currency_code").notNull().default("IRT"), // ارز نمایش قیمت در این زبان
  enabled: boolean("enabled").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const translations = pgTable(
  "translations",
  {
    id: serial("id").primaryKey(),
    locale: text("locale")
      .notNull()
      .references(() => languages.code, { onDelete: "cascade", onUpdate: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
  },
  (t) => [uniqueIndex("translations_locale_key").on(t.locale, t.key)],
);

/* ---------- کاتالوگ ---------- */

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  image: text("image"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const categoryTranslations = pgTable(
  "category_translations",
  {
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    locale: text("locale")
      .notNull()
      .references(() => languages.code, { onDelete: "cascade", onUpdate: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
  },
  (t) => [primaryKey({ columns: [t.categoryId, t.locale] })],
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    sku: text("sku").notNull().default(""),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    /** قیمت به ارز پایه (تومان) */
    price: integer("price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    stock: integer("stock").notNull().default(0),
    weightGrams: integer("weight_grams").notNull().default(500),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    /** رنگ عسل؛ برای پس‌زمینه تصویر و جزئیات صفحه محصول */
    tint: text("tint").notNull().default("#C98A2B"),
    /** شناسنامه برداشت */
    altitude: integer("altitude"), // متر
    moisture: doublePrecision("moisture"), // درصد رطوبت
    harvestYear: integer("harvest_year"),
    featured: boolean("featured").notNull().default(false),
    status: productStatusEnum("status").notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("products_status").on(t.status), index("products_category").on(t.categoryId)],
);

export const productTranslations = pgTable(
  "product_translations",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    locale: text("locale")
      .notNull()
      .references(() => languages.code, { onDelete: "cascade", onUpdate: "cascade" }),
    name: text("name").notNull(),
    shortDescription: text("short_description").notNull().default(""),
    description: text("description").notNull().default(""),
    flora: text("flora").notNull().default(""), // گیاه غالب: گون، آویشن، ...
    origin: text("origin").notNull().default(""), // منطقه برداشت
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
  },
  (t) => [primaryKey({ columns: [t.productId, t.locale] })],
);

/* ---------- کشورها، ارزها و درگاه‌ها ---------- */

export const currencies = pgTable("currencies", {
  code: text("code").primaryKey(), // IRT, USD, EUR, ...
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  /** چند واحد از این ارز = ۱ واحد ارز پایه (تومان) */
  rate: doublePrecision("rate").notNull().default(1),
  decimals: integer("decimals").notNull().default(0),
  isBase: boolean("is_base").notNull().default(false),
});

export const countries = pgTable("countries", {
  code: text("code").primaryKey(), // ISO 3166-1 alpha-2
  name: text("name").notNull(),
  currencyCode: text("currency_code")
    .notNull()
    .references(() => currencies.code, { onUpdate: "cascade" }),
  enabled: boolean("enabled").notNull().default(true),
  /** هزینه ارسال به ارز پایه */
  shippingCost: integer("shipping_cost").notNull().default(0),
  freeShippingOver: integer("free_shipping_over"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const paymentGateways = pgTable("payment_gateways", {
  id: gatewayEnum("id").primaryKey(),
  name: text("name").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  sandbox: boolean("sandbox").notNull().default(true),
  config: jsonb("config").$type<Record<string, string>>().notNull().default({}),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const countryGateways = pgTable(
  "country_gateways",
  {
    countryCode: text("country_code")
      .notNull()
      .references(() => countries.code, { onDelete: "cascade", onUpdate: "cascade" }),
    gatewayId: gatewayEnum("gateway_id")
      .notNull()
      .references(() => paymentGateways.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.countryCode, t.gatewayId] })],
);

/* ---------- سفارش‌ها ---------- */

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(), // کد سفارش قابل نمایش
    accessToken: text("access_token").notNull(),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull().default(""),
    countryCode: text("country_code").notNull(),
    city: text("city").notNull(),
    address: text("address").notNull(),
    postalCode: text("postal_code").notNull().default(""),
    notes: text("notes").notNull().default(""),
    locale: text("locale").notNull(),
    currencyCode: text("currency_code").notNull(),
    rate: doublePrecision("rate").notNull(),
    subtotal: integer("subtotal").notNull(), // ارز پایه
    shipping: integer("shipping").notNull(), // ارز پایه
    total: integer("total").notNull(), // ارز پایه
    totalCharged: doublePrecision("total_charged").notNull(), // به ارز پرداخت
    status: orderStatusEnum("status").notNull().default("pending"),
    gatewayId: gatewayEnum("gateway_id").notNull(),
    paymentAuthority: text("payment_authority"),
    paymentRef: text("payment_ref"),
    createdAt: createdAt(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [index("orders_created").on(t.createdAt), index("orders_status").on(t.status)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_order").on(t.orderId)],
);

/* ---------- آمار بازدید ---------- */

export const pageViews = pgTable(
  "page_views",
  {
    id: serial("id").primaryKey(),
    path: text("path").notNull(),
    locale: text("locale").notNull().default(""),
    productId: integer("product_id"),
    referrer: text("referrer").notNull().default(""),
    country: text("country").notNull().default(""),
    device: deviceEnum("device").notNull().default("desktop"),
    visitorId: text("visitor_id").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("page_views_created").on(t.createdAt), index("page_views_product").on(t.productId)],
);

/* ---------- تنظیمات و مدیران ---------- */

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

export type Language = typeof languages.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductTranslation = typeof productTranslations.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Currency = typeof currencies.$inferSelect;
export type Country = typeof countries.$inferSelect;
export type PaymentGateway = typeof paymentGateways.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
