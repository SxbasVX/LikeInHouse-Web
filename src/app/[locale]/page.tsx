import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getServerCaller } from "@/lib/trpc-server";
import { HeroSection } from "@/components/public/sections/hero";
import { GalleryCarousel } from "@/components/public/sections/gallery-carousel";
import { FeaturedToursSection } from "@/components/public/sections/featured-tours";
import { TestimonialsSection } from "@/components/public/sections/testimonials";
import { CTASection } from "@/components/public/sections/cta";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likeinhouse.com";
  return {
    title: t("home_title"),
    description: t("home_description"),
    alternates: { canonical: `${baseUrl}/${locale}` },
    openGraph: {
      title: t("home_title"),
      description: t("home_description"),
      url: `${baseUrl}/${locale}`,
      siteName: "Like In House",
      type: "website",
      locale: locale === "es" ? "es_PE" : "en_US",
    },
  };
}

export default async function HomePage() {
  const [caller, t] = await Promise.all([
    getServerCaller(),
    getTranslations("home"),
  ]);

  const [tours, testimonials] = await Promise.all([
    caller.public.featuredTours(),
    caller.public.testimonials(),
  ]);

  return (
    <div>
      <HeroSection />
      <GalleryCarousel />
      <FeaturedToursSection tours={tours} />
      {testimonials.length > 0 && (
        <TestimonialsSection testimonials={testimonials} />
      )}
      <CTASection />
    </div>
  );
}
