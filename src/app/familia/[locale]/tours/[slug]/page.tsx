import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getServerCaller } from "@/lib/trpc-server";
import { getFamilyBaseUrl } from "@/lib/family-site";
import { buildFamilyMetadata, canViewFamilySite } from "@/lib/family-page";
import { TourDetail } from "@/components/public/tour-detail";
import { touristTripJsonLd, breadcrumbJsonLd, safeJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const caller = await getServerCaller();
  const tour = await caller.public.tourBySlug({ slug, family: true });
  if (!tour) return { title: "Tour not found", robots: { index: false, follow: false } };

  const isEs = locale === "es";
  const title = (isEs ? tour.metaTitleEs : tour.metaTitleEn) || (isEs ? tour.nameEs : tour.nameEn);
  const description =
    (isEs ? tour.metaDescEs : tour.metaDescEn) ||
    (isEs ? tour.shortDescEs : tour.shortDescEn);

  return buildFamilyMetadata({
    locale,
    title,
    description,
    pathByLocale: `/tours/${slug}`,
    image: tour.images?.[0]?.url,
    keywords:
      locale === "es"
        ? ([tour.nameEs, tour.destination, "tour en familia", "Perú con niños"].filter(Boolean) as string[])
        : ([tour.nameEn, tour.destination, "family tour", "Peru with kids"].filter(Boolean) as string[]),
  });
}

export default async function FamilyTourDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  if (!(await canViewFamilySite())) return null;

  const caller = await getServerCaller();
  const tour = await caller.public.tourBySlug({ slug, family: true });
  if (!tour) notFound();

  const isEs = locale === "es";
  const baseUrl = getFamilyBaseUrl();

  const tripJsonLd = touristTripJsonLd({
    locale,
    baseUrl,
    informational: tour.tourType === "INFORMATIONAL",
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

  const breadcrumbLd = breadcrumbJsonLd(
    locale,
    [
      { name: isEs ? "Inicio" : "Home", path: "" },
      { name: "Tours", path: "/tours" },
      { name: isEs ? tour.nameEs : tour.nameEn, path: `/tours/${slug}` },
    ],
    baseUrl
  );

  return (
    <div className="page-transition">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(tripJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
      <TourDetail tour={tour} />
    </div>
  );
}
