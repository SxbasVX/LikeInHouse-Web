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
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <h1 className="font-familia text-4xl leading-[1.06] text-fam-tinta sm:text-5xl">{t("catalog_title")}</h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-fam-tinta/75">{t("catalog_text")}</p>
            </div>
            <WhoTravels mode="filter" tone="light" initial={travelers} />
          </div>
        }
      />
    </div>
  );
}
