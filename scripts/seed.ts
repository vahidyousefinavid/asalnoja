/**
 * ساخت جداول و داده‌های اولیه.
 * اجرا: npm run db:setup
 * اجرای دوباره امن است؛ فقط چیزهایی که وجود ندارند اضافه می‌شوند.
 */
import { migrate } from "drizzle-orm/node-postgres/migrator";
import bcrypt from "bcryptjs";
import { db, pool, schema } from "../src/db";
import { defaultMessages } from "../src/i18n/defaults";

async function main() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ migrations");

  await db
    .insert(schema.currencies)
    .values([
      { code: "IRT", name: "تومان", symbol: "تومان", rate: 1, decimals: 0, isBase: true },
      { code: "USD", name: "دلار آمریکا", symbol: "$", rate: 0.00001, decimals: 2 },
      { code: "EUR", name: "یورو", symbol: "€", rate: 0.0000092, decimals: 2 },
      { code: "AED", name: "درهم امارات", symbol: "د.إ", rate: 0.0000367, decimals: 2 },
      { code: "TRY", name: "لیر ترکیه", symbol: "₺", rate: 0.00041, decimals: 2 },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.languages)
    .values([
      { code: "fa", name: "فارسی", nativeName: "فارسی", dir: "rtl", currencyCode: "IRT", isDefault: true, sortOrder: 0 },
      { code: "en", name: "انگلیسی", nativeName: "English", dir: "ltr", currencyCode: "USD", sortOrder: 1 },
      { code: "ar", name: "عربی", nativeName: "العربية", dir: "rtl", currencyCode: "AED", sortOrder: 2 },
    ])
    .onConflictDoNothing();

  for (const [locale, msgs] of Object.entries(defaultMessages)) {
    await db
      .insert(schema.translations)
      .values(Object.entries(msgs).map(([key, value]) => ({ locale, key, value })))
      .onConflictDoNothing();
  }
  console.log("✓ languages & translations");

  await db
    .insert(schema.paymentGateways)
    .values([
      { id: "zarinpal", name: "زرین‌پال", enabled: true, sandbox: true, config: { merchantId: "00000000-0000-0000-0000-000000000000" }, sortOrder: 0 },
      { id: "stripe", name: "Stripe", enabled: false, sandbox: true, config: {}, sortOrder: 1 },
      { id: "paypal", name: "PayPal", enabled: false, sandbox: true, config: {}, sortOrder: 2 },
      { id: "bank_transfer", name: "کارت به کارت / واریز", enabled: true, sandbox: false, config: {}, sortOrder: 3 },
      { id: "cod", name: "پرداخت در محل", enabled: true, sandbox: false, config: {}, sortOrder: 4 },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.countries)
    .values([
      { code: "IR", name: "ایران", currencyCode: "IRT", shippingCost: 120000, freeShippingOver: 3000000, sortOrder: 0 },
      { code: "AE", name: "امارات", currencyCode: "AED", shippingCost: 1500000, sortOrder: 1 },
      { code: "TR", name: "ترکیه", currencyCode: "TRY", shippingCost: 1200000, sortOrder: 2 },
      { code: "IQ", name: "عراق", currencyCode: "USD", shippingCost: 900000, sortOrder: 3 },
      { code: "DE", name: "آلمان", currencyCode: "EUR", shippingCost: 2500000, sortOrder: 4 },
      { code: "US", name: "آمریکا", currencyCode: "USD", shippingCost: 3500000, enabled: false, sortOrder: 5 },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.countryGateways)
    .values([
      { countryCode: "IR", gatewayId: "zarinpal" },
      { countryCode: "IR", gatewayId: "bank_transfer" },
      { countryCode: "IR", gatewayId: "cod" },
      ...["AE", "TR", "IQ", "DE", "US"].flatMap((c) => [
        { countryCode: c, gatewayId: "stripe" as const },
        { countryCode: c, gatewayId: "paypal" as const },
        { countryCode: c, gatewayId: "bank_transfer" as const },
      ]),
    ])
    .onConflictDoNothing();
  console.log("✓ countries, currencies & gateways");

  const existingCats = await db.select().from(schema.categories);
  if (!existingCats.length) {
    const cats = [
      { slug: "monofloral", fa: "تک‌گیاه", en: "Monofloral", ar: "أحادي الزهرة", d: { fa: "عسل‌هایی که بیشتر شهد آن از یک گیاه است.", en: "Honey made mostly from a single flower's nectar.", ar: "عسل معظم رحيقه من زهرة واحدة." } },
      { slug: "wildflower", fa: "چندگیاه", en: "Wildflower", ar: "زهور برية", d: { fa: "ترکیب طبیعی گل‌های کوهستان در یک فصل.", en: "A natural blend of a season's mountain flowers.", ar: "مزيج طبيعي من زهور الجبل في موسم واحد." } },
      { slug: "comb", fa: "شان عسل", en: "Honeycomb", ar: "شمع العسل", d: { fa: "عسل دست‌نخورده در قاب موم خودش.", en: "Untouched honey still in its own wax comb.", ar: "عسل لم يُمس داخل شمعه الطبيعي." } },
    ];
    for (const [i, c] of cats.entries()) {
      const [row] = await db.insert(schema.categories).values({ slug: c.slug, image: `/images/cat-${c.slug}.webp`, sortOrder: i }).returning();
      await db.insert(schema.categoryTranslations).values(
        (["fa", "en", "ar"] as const).map((l) => ({ categoryId: row.id, locale: l, name: c[l], description: c.d[l] })),
      );
    }
    console.log("✓ categories");
  }

  const existingProducts = await db.select().from(schema.products);
  if (!existingProducts.length) {
    const cats = await db.select().from(schema.categories);
    const cat = (slug: string) => cats.find((c) => c.slug === slug)!.id;
    const year = new Date().getFullYear();

    const items = [
      {
        slug: "astragalus-honey", sku: "NJ-GON-500", category: "monofloral", price: 1850000, compare: 2100000, stock: 24, tint: "#F2CF6B", altitude: 2800, moisture: 16.2, featured: true,
        fa: { name: "عسل گون", short: "روشن، لطیف و کم‌شیرینی؛ از گون‌زارهای بلند کوهستان.", flora: "گون", origin: "دامنه‌های زاگرس" },
        en: { name: "Astragalus honey", short: "Pale, delicate and lightly sweet, from high-mountain astragalus fields.", flora: "Astragalus", origin: "Zagros slopes" },
        ar: { name: "عسل القتاد", short: "فاتح ولطيف وقليل الحلاوة، من حقول القتاد في أعالي الجبال.", flora: "القتاد", origin: "منحدرات زاغروس" },
      },
      {
        slug: "thyme-honey", sku: "NJ-AVI-500", category: "monofloral", price: 1450000, compare: null, stock: 40, tint: "#E39A2C", altitude: 2400, moisture: 16.8, featured: true,
        fa: { name: "عسل آویشن", short: "عطر تند آویشن کوهی با طعمی گرم و ماندگار.", flora: "آویشن کوهی", origin: "ارتفاعات البرز" },
        en: { name: "Wild thyme honey", short: "The sharp scent of wild thyme with a warm, lingering taste.", flora: "Wild thyme", origin: "Alborz highlands" },
        ar: { name: "عسل الزعتر البري", short: "رائحة الزعتر البري القوية بطعم دافئ يدوم.", flora: "الزعتر البري", origin: "مرتفعات البرز" },
      },
      {
        slug: "sidr-honey", sku: "NJ-KON-500", category: "monofloral", price: 2200000, compare: 2450000, stock: 8, tint: "#B4621C", altitude: 400, moisture: 17.5, featured: true,
        fa: { name: "عسل کنار", short: "تیره، غلیظ و کاراملی؛ از درختان کنار جنوب.", flora: "کنار (سدر)", origin: "جنوب ایران" },
        en: { name: "Sidr honey", short: "Dark, thick and caramel-like, from southern sidr trees.", flora: "Sidr (Ziziphus)", origin: "Southern Iran" },
        ar: { name: "عسل السدر", short: "داكن وكثيف بطعم الكراميل، من أشجار السدر في الجنوب.", flora: "السدر", origin: "جنوب إيران" },
      },
      {
        slug: "wildflower-honey", sku: "NJ-CHG-500", category: "wildflower", price: 990000, compare: null, stock: 60, tint: "#DC8B1F", altitude: 1800, moisture: 17.1, featured: true,
        fa: { name: "عسل چندگیاه کوهستان", short: "ترکیب گل‌های بهاری؛ مناسب صبحانه هر روز.", flora: "گل‌های وحشی", origin: "دامنه‌های زاگرس" },
        en: { name: "Mountain wildflower honey", short: "A blend of spring flowers, made for everyday breakfast.", flora: "Wildflowers", origin: "Zagros slopes" },
        ar: { name: "عسل الزهور الجبلية", short: "مزيج من زهور الربيع، مثالي لفطور كل يوم.", flora: "زهور برية", origin: "منحدرات زاغروس" },
      },
      {
        slug: "honeycomb", sku: "NJ-SHN-1000", category: "comb", price: 2600000, compare: null, stock: 12, tint: "#EAB04A", altitude: 2200, moisture: 17.9, featured: false, weight: 1000,
        fa: { name: "شان عسل طبیعی", short: "قاب کامل موم و عسل، همان‌طور که از کندو برداشته شده.", flora: "گل‌های کوهستان", origin: "ارتفاعات البرز" },
        en: { name: "Natural honeycomb", short: "A whole frame of wax and honey, exactly as it left the hive.", flora: "Mountain flowers", origin: "Alborz highlands" },
        ar: { name: "شمع عسل طبيعي", short: "إطار كامل من الشمع والعسل كما خرج من الخلية.", flora: "زهور الجبل", origin: "مرتفعات البرز" },
      },
      {
        slug: "coriander-honey", sku: "NJ-GSH-500", category: "monofloral", price: 1350000, compare: null, stock: 0, tint: "#9C4E18", altitude: 1200, moisture: 17.4, featured: false,
        fa: { name: "عسل گشنیز", short: "تیره با عطر ادویه‌ای؛ برداشت محدود.", flora: "گشنیز", origin: "دشت‌های مرکزی" },
        en: { name: "Coriander honey", short: "Dark with a spicy aroma; limited harvest.", flora: "Coriander", origin: "Central plains" },
        ar: { name: "عسل الكزبرة", short: "داكن برائحة توابل؛ حصاد محدود.", flora: "الكزبرة", origin: "السهول الوسطى" },
      },
    ];

    const longText = {
      fa: (n: string, f: string, o: string) =>
        `${n} از کندوهایی برداشت شده که در فصل گل‌دهی ${f} در ${o} مستقر بودند. قاب‌ها فقط پس از بسته شدن سلول‌ها با موم برداشته شدند.\n\nاین عسل حرارت ندیده و فقط از صافی عبور کرده است؛ به همین دلیل ممکن است با گذشت زمان شکرک بزند که نشانه طبیعی بودن آن است.\n\nپیشنهاد مصرف: کنار نان و پنیر، در چای ولرم یا مستقیم با قاشق چوبی.`,
      en: (n: string, f: string, o: string) =>
        `This ${n.toLowerCase()} comes from hives placed in the ${o} while the ${f.toLowerCase()} was in bloom. Frames were harvested only after the bees had capped the cells with wax.\n\nThe honey is strained, never heated, so it may crystallise over time — a natural sign of raw honey.\n\nTry it with bread and cheese, stirred into warm (not hot) tea, or straight from a wooden spoon.`,
      ar: (n: string, f: string, o: string) =>
        `حُصد ${n} من خلايا وُضعت في ${o} خلال موسم إزهار ${f}. لم تُرفع الإطارات إلا بعد أن أغلق النحل الخلايا بالشمع.\n\nهذا العسل لم يُسخَّن وإنما صُفّي فقط، لذا قد يتبلور مع الوقت وهي علامة طبيعية على أنه خام.\n\nجرّبه مع الخبز والجبن، أو في شاي دافئ، أو مباشرة بملعقة خشبية.`,
    };

    // عکس‌های نمونه از Unsplash (public/images/CREDITS.md)؛ قبل از انتشار با عکس محصول واقعی عوض شوند
    const photo: Record<string, string> = {"astragalus-honey": "astragalus", "thyme-honey": "thyme", "sidr-honey": "sidr", "wildflower-honey": "wildflower", "honeycomb": "honeycomb", "coriander-honey": "coriander"};

    for (const [i, p] of items.entries()) {
      const [row] = await db
        .insert(schema.products)
        .values({
          slug: p.slug,
          sku: p.sku,
          categoryId: cat(p.category),
          price: p.price,
          compareAtPrice: p.compare,
          stock: p.stock,
          weightGrams: p.weight ?? 500,
          images: [1, 2].map((n) => `/images/products/${photo[p.slug]}-${n}.webp`),
          tint: p.tint,
          altitude: p.altitude,
          moisture: p.moisture,
          harvestYear: year,
          featured: p.featured,
          status: "published",
          sortOrder: i,
        })
        .returning();
      await db.insert(schema.productTranslations).values(
        (["fa", "en", "ar"] as const).map((l) => ({
          productId: row.id,
          locale: l,
          name: p[l].name,
          shortDescription: p[l].short,
          description: longText[l](p[l].name, p[l].flora, p[l].origin),
          flora: p[l].flora,
          origin: p[l].origin,
        })),
      );
    }
    console.log("✓ products");
  }

  await db
    .insert(schema.settings)
    .values([
      { key: "siteUrl", value: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000" },
      { key: "phone", value: "021-00000000" },
      { key: "email", value: "hello@asalnoja.ir" },
      { key: "instagram", value: "asalnoja" },
      { key: "address", value: "" },
      { key: "bankCardNumber", value: "6037-0000-0000-0000" },
      { key: "bankIban", value: "IR000000000000000000000000" },
      { key: "bankHolder", value: "عسل نوجا" },
    ])
    .onConflictDoNothing();

  const email = process.env.ADMIN_EMAIL ?? "admin@asalnoja.ir";
  const password = process.env.ADMIN_PASSWORD ?? "admin12345";
  await db
    .insert(schema.adminUsers)
    .values({ email, name: "مدیر", passwordHash: await bcrypt.hash(password, 10) })
    .onConflictDoNothing();
  console.log(`✓ admin: ${email}`);
}

main()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
