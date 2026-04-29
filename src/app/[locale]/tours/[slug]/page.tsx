import type { Metadata } from "next";
import { getServerCaller } from "@/lib/trpc-server";
import { notFound } from "next/navigation";
import { TourDetail } from "@/components/public/tour-detail";
import {
  buildMetadata,
  touristTripJsonLd,
  breadcrumbJsonLd,
  safeJsonLd,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const caller = await getServerCaller();
  const tour = await caller.public.tourBySlug({ slug });
  if (!tour) return { title: "Tour not found", robots: { index: false, follow: false } };

  const isEs = locale === "es";
  const title = (isEs ? tour.metaTitleEs : tour.metaTitleEn) || (isEs ? tour.nameEs : tour.nameEn);
  const description =
    (isEs ? tour.metaDescEs : tour.metaDescEn) ||
    (isEs ? tour.shortDescEs : tour.shortDescEn);
  const image = tour.images?.[0]?.url;

  return buildMetadata({
    locale,
    title,
    description,
    pathByLocale: `/tours/${slug}`,
    image,
    ogType: "website",
    keywords:
      locale === "es"
        ? [tour.nameEs, tour.destination, tour.category, "tour Perú", "viaje Perú"].filter(Boolean) as string[]
        : [tour.nameEn, tour.destination, tour.category, "Peru tour", "Peru travel"].filter(Boolean) as string[],
  });
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const caller = await getServerCaller();
  const tour = await caller.public.tourBySlug({ slug });

  if (!tour) notFound();

  const isEs = locale === "es";

  const tripJsonLd = touristTripJsonLd({
    locale,
    slug: tour.slug,
    nameEs: tour.nameEs,
    nameEn: tour.nameEn,
    shortDescEs: tour.shortDescEs,
    shortDescEn: tour.shortDescEn,
    imageUrls: (tour.images || []).map((i: { url: string }) => i.url),
    durationDays: tour.durationDays,
    durationHours: tour.durationHours,
    destinationEs: tour.destination,
    destinationEn: tour.destination,
    categoryEs: tour.category,
    categoryEn: tour.category,
    tiers: (tour.pricing as { tiers?: Array<{ labelEs: string; labelEn: string; priceUsd: number | string; isDefault: boolean }> } | null)?.tiers || [],
    basePriceUsd: tour.pricing?.basePriceUsdAdult ? Number(tour.pricing.basePriceUsdAdult) : null,
    updatedAt: tour.updatedAt,
  });

  const breadcrumbLd = breadcrumbJsonLd(locale, [
    { name: isEs ? "Inicio" : "Home", path: "" },
    { name: isEs ? "Tours" : "Tours", path: "/tours" },
    { name: isEs ? tour.nameEs : tour.nameEn, path: `/tours/${slug}` },
  ]);

  return (
    <div className="page-transition">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(tripJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      <TourDetail tour={tour} />
    </div>
  );
}
