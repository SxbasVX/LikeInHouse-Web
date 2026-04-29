import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getServerCaller } from "@/lib/trpc-server";
import { ToursCatalog } from "@/components/public/tours-catalog";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return buildMetadata({
    locale,
    title: t("tours_title"),
    description: t("tours_description"),
    pathByLocale: "/tours",
    keywords:
      locale === "es"
        ? ["tours Perú", "catálogo tours", "Cusco tours", "Machu Picchu tour", "Valle Sagrado", "paquetes turísticos Perú"]
        : ["Peru tours", "tour catalog", "Cusco tours", "Machu Picchu tour", "Sacred Valley", "Peru tour packages"],
  });
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
