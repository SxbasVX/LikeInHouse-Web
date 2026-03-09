import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getServerCaller } from "@/lib/trpc-server";
import { ToursCatalog } from "@/components/public/tours-catalog";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likeinhouse.com";
  return {
    title: t("tours_title"),
    description: t("tours_description"),
    alternates: { canonical: `${baseUrl}/${locale}/tours` },
    openGraph: {
      title: t("tours_title"),
      description: t("tours_description"),
      url: `${baseUrl}/${locale}/tours`,
      siteName: "Like In House",
      type: "website",
      locale: locale === "es" ? "es_PE" : "en_US",
    },
  };
}

export default async function ToursPage() {
  const caller = await getServerCaller();

  const [initialData, destinations, categories] = await Promise.all([
    caller.public.tours({ page: 1, limit: 9, sort: "newest" }),
    caller.public.destinations(),
    caller.public.categories(),
  ]);

  return (
    <div className="page-transition">
      <ToursCatalog
        initialData={initialData}
        destinations={destinations}
        categories={categories}
      />
    </div>
  );
}
