import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getServerCaller } from "@/lib/trpc-server";
import { buildFamilyMetadata, canViewFamilySite } from "@/lib/family-page";
import { ToursCatalog } from "@/components/public/tours-catalog";
import { WhoTravels } from "@/components/familia/who-travels";
import { parseTravelers, travelersToFilter, TRAVELERS_PARAM } from "@/lib/family-travelers";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "familia" });
  return buildFamilyMetadata({
    locale,
    title: t("meta_tours_title"),
    description: t("meta_tours_description"),
    pathByLocale: "/tours",
  });
}

export default async function FamilyToursPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const raw = (await searchParams)[TRAVELERS_PARAM];
  const travelers = parseTravelers(Array.isArray(raw) ? raw[0] : raw);
  setRequestLocale(locale);
  if (!(await canViewFamilySite())) return null;

  const caller = await getServerCaller();
  const [t, initialData, destinations, categories] = await Promise.all([
    getTranslations({ locale, namespace: "familia" }),
    caller.public.tours({ page: 1, limit: 9, sort: "newest", family: true, ...travelersToFilter(travelers) }),
    caller.public.destinations(),
    caller.public.categories(),
  ]);

  return (
    <div className="page-transition">
      <ToursCatalog
        initialData={initialData}
        destinations={destinations}
        categories={categories}
        family
        header={
          <div className="text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-brand-teal">{t("catalog_eyebrow")}</p>
            <h1 className="font-heading text-4xl font-light leading-[1.1] tracking-tight text-brand-darkRed sm:text-5xl lg:text-[3.5rem]">
              {t("catalog_title_1")} <span className="font-serif font-normal italic text-brand-teal">{t("catalog_title_2")}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-light text-gray-500">{t("catalog_text")}</p>
            <div className="mx-auto mt-10 max-w-3xl text-left">
              <WhoTravels mode="filter" tone="light" initial={travelers} />
            </div>
          </div>
        }
      />
    </div>
  );
}
