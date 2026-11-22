import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Baby, Backpack, HeartHandshake, Users } from "lucide-react";
import { isFamilyFaq, parseFamilySiteImages } from "@/lib/family-site";
import Image from "next/image";
import { getServerCaller } from "@/lib/trpc-server";
import { buildFamilyMetadata, canViewFamilySite } from "@/lib/family-page";
import { DEFAULT_HERO_IMAGE } from "@/lib/site-images";
import { FeaturedToursSection } from "@/components/public/sections/featured-tours";
import { HowToBookSection } from "@/components/public/sections/how-to-book";
import { TestimonialsSection } from "@/components/public/sections/testimonials";
import { FAQSection } from "@/components/public/sections/faq";
import { FamilyHero } from "@/components/familia/family-hero";
import { FamilyQuoteButton } from "@/components/familia/family-quote-button";
import { SectionHeading } from "@/components/familia/section-heading";
import { familyBtnPrimary } from "@/components/familia/styles";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "familia" });
  return buildFamilyMetadata({
    locale,
    title: t("meta_home_title"),
    description: t("meta_home_description"),
    pathByLocale: "",
    keywords:
      locale === "es"
        ? ["viajes en familia Perú", "tours en familia", "Machu Picchu en familia", "Cusco con niños", "viajar con abuelos Perú"]
        : ["family trips Peru", "Peru family tours", "Machu Picchu family", "Cusco with kids", "multigenerational travel Peru"],
  });
}

const GENERATIONS = [
  { key: "gen_kids", icon: Baby },
  { key: "gen_teens", icon: Backpack },
  { key: "gen_parents", icon: Users },
  { key: "gen_grandparents", icon: HeartHandshake },
] as const;

type HomeSection = { type: string; imageUrl: string | null };

export default async function FamilyHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await canViewFamilySite())) return null;

  const caller = await getServerCaller();
  const [t, tours, allFaqs, sections, testimonials, settings] = await Promise.all([
    getTranslations({ locale, namespace: "familia" }),
    caller.public.familyFeaturedTours(),
    caller.public.faqs({ scope: "all" }),
    caller.public.homeSections(),
    caller.public.testimonials(),
    caller.public.settings(),
  ]);
  const images = parseFamilySiteImages(settings as Record<string, unknown>);

  // Foto del hero: la que se sube en el panel; si no, la del primer tour familiar; si no, la del inicio principal.
  const heroImage =
    images.hero ??
    tours.find((tour) => tour.images?.[0]?.url)?.images[0].url ??
    (sections as HomeSection[]).find((s) => s.type === "HERO")?.imageUrl ??
    DEFAULT_HERO_IMAGE;

  const familyFaqs = allFaqs.filter((f) => isFamilyFaq(f.category));
  const faqs = familyFaqs.length > 0 ? familyFaqs : allFaqs;

  return (
    <div>
      <FamilyHero locale={locale} imageUrl={heroImage} />

      {tours.length > 0 ? (
        <FeaturedToursSection tours={tours} title={t("tours_title_1")} subtitle={t("tours_title_2")} />
      ) : (
        <section className="bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
            <SectionHeading eyebrow={t("tours_eyebrow")} title={t("tours_title_1")} accent={t("tours_title_2")} />
            <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-6 rounded-[2rem] border border-gray-100 bg-[#faf8f5] px-6 py-12 text-center sm:px-12">
              <h3 className="font-heading text-2xl font-bold text-brand-darkRed">{t("tours_empty_title")}</h3>
              <p className="max-w-xl text-lg font-light text-gray-500">{t("tours_empty_text")}</p>
              <FamilyQuoteButton className={familyBtnPrimary}>{t("tours_empty_cta")}</FamilyQuoteButton>
            </div>
          </div>
        </section>
      )}

      {/* Pensado para cada generación */}
      <section className="relative bg-[#FFF8EC] py-24 lg:py-32" aria-labelledby="family-generations">
        <SoftWave position="top" />
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <SectionHeading
            id="family-generations"
            eyebrow={t("gen_eyebrow")}
            title={t("gen_title_1")}
            accent={t("gen_title_2")}
            text={t("gen_text")}
          />
          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {GENERATIONS.map(({ key, icon: Icon }) => (
              <li key={key} className="rounded-[2.5rem] bg-white p-8 shadow-[0_10px_30px_-12px_rgba(68,21,20,0.15)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange/10 text-brand-orange">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-heading text-xl font-bold text-brand-darkRed">{t(`${key}_title`)}</h3>
                <p className="mt-3 text-[15px] font-light leading-relaxed text-gray-500">{t(`${key}_text`)}</p>
              </li>
            ))}
          </ul>
        </div>
        {images.gallery.length < 3 && <SoftWave position="bottom" color="#faf8f5" />}
      </section>

      {/* Momentos en familia: fotos reales que se suben en el panel */}
      {images.gallery.length >= 3 && (
        <section className="relative bg-[#FFF8EC] pb-24 lg:pb-32" aria-labelledby="family-moments">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
            <SectionHeading id="family-moments" eyebrow={t("moments_eyebrow")} title={t("moments_title_1")} accent={t("moments_title_2")} text={t("moments_text")} />
            <ul className="mt-12 grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:gap-4 lg:grid-cols-4">
              {images.gallery.map((url, i) => (
                <li
                  key={url}
                  className={`relative overflow-hidden rounded-[2rem] ${i === 0 ? "col-span-2 row-span-2" : ""} ${i === 3 ? "lg:row-span-2" : ""}`}
                >
                  <Image src={url} alt={t("moments_alt", { n: i + 1 })} fill className="object-cover" sizes="(min-width: 1024px) 25vw, 50vw" />
                </li>
              ))}
            </ul>
          </div>
          <SoftWave position="bottom" color="#faf8f5" />
        </section>
      )}

      <HowToBookSection />

      {testimonials.length > 0 && <TestimonialsSection testimonials={testimonials} />}

      <FAQSection faqs={faqs} />
    </div>
  );
}

// Onda suave entre secciones (blanco ↔ crema), igual al lenguaje del hero.
function SoftWave({ position, color = "#FFFFFF" }: { position: "top" | "bottom"; color?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute left-0 h-10 w-full sm:h-16 ${position === "top" ? "top-0" : "bottom-0 rotate-180"}`}
    >
      <path d="M0 0 L1440 0 L1440 30 C1180 80 960 80 720 40 C480 0 240 0 0 40 Z" fill={color} />
    </svg>
  );
}
