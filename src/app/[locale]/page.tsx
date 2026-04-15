import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getServerCaller } from "@/lib/trpc-server";
import { HeroSection } from "@/components/public/sections/hero";
import { FeaturedToursSection } from "@/components/public/sections/featured-tours";
import { TestimonialsSection } from "@/components/public/sections/testimonials";
import { FAQSection } from "@/components/public/sections/faq";
import { CTASection } from "@/components/public/sections/cta";
import { CertificationsSection } from "@/components/public/sections/certifications";
import { HowToBookSection } from "@/components/public/sections/how-to-book";
import { PromoBannersSection } from "@/components/public/sections/promo-banners";

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
  const [caller, locale] = await Promise.all([
    getServerCaller(),
    getLocale(),
  ]);

  const [tours, testimonials, faqs, homeSections] = await Promise.all([
    caller.public.featuredTours(),
    caller.public.testimonials(),
    caller.public.faqs(),
    caller.public.homeSections(),
  ]);

  const isEs = locale === "es";

  // Crear mapa de secciones por tipo para acceso rápido
  const sectionMap = new Map(
    homeSections.map((s: { type: string; titleEs: string | null; titleEn: string | null; subtitleEs: string | null; subtitleEn: string | null; imageUrl: string | null; sortOrder: number }) => [s.type, s])
  );

  // Helper para obtener título/subtítulo localizado
  const getTitle = (type: string) => {
    const s = sectionMap.get(type);
    if (!s) return undefined;
    return (isEs ? s.titleEs : s.titleEn) || undefined;
  };
  const getSubtitle = (type: string) => {
    const s = sectionMap.get(type);
    if (!s) return undefined;
    return (isEs ? s.subtitleEs : s.subtitleEn) || undefined;
  };
  const getImage = (type: string) => {
    const s = sectionMap.get(type);
    return s?.imageUrl || undefined;
  };

  // Verificar visibilidad (las secciones vienen filtradas por isVisible=true)
  const isVisible = (type: string) => sectionMap.has(type);

  // Definir orden de las secciones basado en sortOrder del admin
  type SectionEntry = { type: string; render: () => React.ReactNode };
  const allSections: SectionEntry[] = [
    {
      type: "HERO",
      render: () => (
        <HeroSection
          key="hero"
          title={getTitle("HERO")}
          subtitle={getSubtitle("HERO")}
          imageUrl={getImage("HERO")}
        />
      ),
    },
    {
      type: "FEATURED_TOURS",
      render: () =>
        tours.length > 0 ? (
          <FeaturedToursSection
            key="featured"
            tours={tours}
            title={getTitle("FEATURED_TOURS")}
            subtitle={getSubtitle("FEATURED_TOURS")}
          />
        ) : null,
    },
    {
      type: "TESTIMONIALS",
      render: () =>
        testimonials.length > 0 ? (
          <TestimonialsSection
            key="testimonials"
            testimonials={testimonials}
            title={getTitle("TESTIMONIALS")}
            subtitle={getSubtitle("TESTIMONIALS")}
          />
        ) : null,
    },
    {
      type: "CTA",
      render: () => (
        <CTASection
          key="cta"
          title={getTitle("CTA")}
          subtitle={getSubtitle("CTA")}
          imageUrl={getImage("CTA")}
        />
      ),
    },
  ];

  // Filtrar por visibilidad y ordenar por sortOrder del admin
  const sortedSections = allSections
    .filter((s) => isVisible(s.type))
    .sort((a, b) => {
      const orderA = sectionMap.get(a.type)?.sortOrder ?? 99;
      const orderB = sectionMap.get(b.type)?.sortOrder ?? 99;
      return orderA - orderB;
    });

  return (
    <div>
      {sortedSections.map((s) => s.render())}
      {/* Banners promocionales (solo si hay activos) */}
      <PromoBannersSection />
      {/* Cómo reservar */}
      <HowToBookSection />
      {/* Certificaciones — solo aparece si hay logos configurados */}
      <CertificationsSection />
      {/* FAQs siempre visibles — no están en el sistema de HomeSections */}
      <FAQSection faqs={faqs} />
    </div>
  );
}
