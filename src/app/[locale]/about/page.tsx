import Image from "next/image";
import Link from "next/link";
import { getT } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  const t = await getT(locale);
  return buildMetadata({
    locale,
    path: "/about",
    title: t("about.title"),
    description: t("about.body").split("\n")[0],
    image: "/images/about-hives.webp",
  });
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  const t = await getT(locale);
  const [lead, ...rest] = t("about.body").split(/\n{2,}/);

  return (
    <article>
      <header className="relative isolate flex min-h-[60vh] items-end overflow-hidden bg-night text-on-night">
        <Image src="/images/about-hives.webp" alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-night/85 via-night/30 to-transparent" />
        <div className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-honey">{t("about.eyebrow")}</p>
          <h1 className="font-display mt-4 text-5xl sm:text-7xl">{t("about.title")}</h1>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-14 px-4 pt-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-24 lg:px-8">
        <div>
          <p className="font-display text-3xl leading-snug sm:text-4xl">{lead}</p>
          <div className="mt-10 space-y-6 text-lg leading-9 text-bark">
            {rest.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <Link href={`/${locale}/products`} className="mt-12 inline-flex items-center rounded-md bg-ink px-8 py-4 font-medium text-paper transition-opacity hover:opacity-90">
            {t("hero.cta")}
          </Link>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-comb">
          <Image src="/images/about-beekeeper.webp" alt={t("home.story.title")} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
        </div>
      </div>

      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="about-story">
        <div className="grid items-center gap-12 border-t border-line pt-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow">{t("home.story.eyebrow")}</p>
            <h2 id="about-story" className="font-display mt-3 text-4xl">{t("home.story.title")}</h2>
          </div>
          <p className="text-lg leading-9 text-bark">{t("home.story.body")}</p>
        </div>
      </section>
    </article>
  );
}
