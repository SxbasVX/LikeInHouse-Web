import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getServerCaller } from "@/lib/trpc-server";
import { buildFamilyMetadata, canViewFamilySite } from "@/lib/family-page";
import { ToursCatalog } from "@/components/public/tours-catalog";

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

export default async function FamilyToursPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await canViewFamilySite())) return null;

  const caller = await getServerCaller();
  const [initialData, destinations, categories] = await Promise.all([
    caller.public.tours({ page: 1, limit: 9, sort: "newest", family: true }),
    caller.public.destinations(),
    caller.public.categories(),
  ]);

  return (
    <div className="page-transition">
      <ToursCatalog initialData={initialData} destinations={destinations} categories={categories} family />
    </div>
  );
}
