import type { Metadata } from "next";
import { getServerCaller } from "@/lib/trpc-server";
import { notFound } from "next/navigation";
import { TourDetail } from "@/components/public/tour-detail";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const caller = await getServerCaller();
  const tour = await caller.public.tourBySlug({ slug });
  if (!tour) return { title: "Tour not found" };

  const isEs = locale === "es";
  const name = isEs ? tour.nameEs : tour.nameEn;
  const description = isEs ? tour.shortDescEs : tour.shortDescEn;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likeinhouse.com";
  const image = tour.images?.[0]?.url;

  return {
    title: name,
    description,
    alternates: { canonical: `${baseUrl}/${locale}/tours/${slug}` },
    openGraph: {
      title: name,
      description: description || undefined,
      url: `${baseUrl}/${locale}/tours/${slug}`,
      siteName: "Like In House",
      type: "website",
      locale: locale === "es" ? "es_PE" : "en_US",
      ...(image && { images: [{ url: image }] }),
    },
  };
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

  // Basic SEO logic for translating database fields
  const isEs = locale === "es";
  const name = isEs ? tour.nameEs : tour.nameEn;
  const description = isEs ? tour.shortDescEs : tour.shortDescEn;

  // Build the JSON-LD Structured Data for Google Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: tour.images?.[0]?.url || "",
    offers: {
      "@type": "Offer",
      price: (() => {
        const dt = (tour.pricing as any)?.tiers?.find((t: any) => t.isDefault) || (tour.pricing as any)?.tiers?.[0];
        return dt ? String(Number(dt.priceUsd)) : (tour.pricing?.basePriceUsdAdult?.toString() || "0.00");
      })(),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/${locale}/tours/${slug}`,
    },
  };

  return (
    <div className="page-transition">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\//g, '\\u002f') }}
      />
      <TourDetail tour={tour} />
    </div>
  );
}
