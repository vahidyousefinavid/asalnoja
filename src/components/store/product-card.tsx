import Image from "next/image";
import Link from "next/link";
import { ImagePlaceholder } from "@/components/brand";
import type { LocalizedProduct } from "@/lib/catalog";
import { formatMoney, formatNumber, formatPercent, type CurrencyLike } from "@/lib/money";
import { AddToCart } from "./cart";

export function ProductCard({
  product,
  locale,
  currency,
  t,
  priority = false,
}: {
  product: LocalizedProduct;
  locale: string;
  currency: CurrencyLike;
  t: (k: string, v?: Record<string, string | number>) => string;
  priority?: boolean;
}) {
  const [img, alt] = product.images;
  const soldOut = product.stock <= 0;
  const off =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : 0;
  const sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 92vw";

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-comb">
        {img ? (
          <>
            <Image
              src={img}
              alt={product.t.name}
              fill
              sizes={sizes}
              priority={priority}
              className={`object-cover transition duration-700 ease-[var(--ease-honey)] group-hover:scale-[1.03] ${alt ? "group-hover:opacity-0" : ""}`}
            />
            {alt ? (
              <Image src={alt} alt="" fill sizes={sizes} className="object-cover opacity-0 transition duration-700 ease-[var(--ease-honey)] group-hover:opacity-100" />
            ) : null}
          </>
        ) : (
          <ImagePlaceholder tint={product.tint} />
        )}
        <div className="absolute start-3 top-3 flex flex-col items-start gap-1.5">
          {soldOut ? (
            <span className="rounded-sm bg-paper px-2 py-1 text-xs font-medium text-ink">{t("product.outOfStock")}</span>
          ) : off > 0 ? (
            <span className="tabular rounded-sm bg-ink px-2 py-1 text-xs font-medium text-paper">
              {t("product.save")} {formatPercent(off, locale, 0)}
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-3 bottom-3 z-10 translate-y-2 opacity-0 transition duration-300 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">
          <AddToCart
            variant="compact"
            product={{
              id: product.id,
              slug: product.slug,
              name: product.t.name,
              price: product.price,
              image: img ?? null,
              tint: product.tint,
              stock: product.stock,
            }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[13px] text-bark">
          {product.t.flora} · <span className="tabular">{formatNumber(product.weightGrams, locale)}</span> {t("product.grams")}
        </p>
        <h3 className="font-display mt-1 text-[1.45rem] leading-tight">
          <Link href={`/${locale}/products/${product.slug}`} className="after:absolute after:inset-0">
            {product.t.name}
          </Link>
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="tabular font-medium">{formatMoney(product.price, currency, locale)}</span>
          {off > 0 ? <s className="tabular text-sm text-bark">{formatMoney(product.compareAtPrice!, currency, locale)}</s> : null}
        </div>
        <div className="relative z-10 mt-3 md:hidden">
          <AddToCart
            variant="compact"
            product={{
              id: product.id,
              slug: product.slug,
              name: product.t.name,
              price: product.price,
              image: img ?? null,
              tint: product.tint,
              stock: product.stock,
            }}
          />
        </div>
      </div>
    </article>
  );
}
