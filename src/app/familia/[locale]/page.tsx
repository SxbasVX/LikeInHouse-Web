import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FamilyIcon } from "@/components/familia/family-icons";
import { DrawOnView } from "@/components/familia/draw-on-view";
import { isFamilyFaq, parseFamilySiteImages } from "@/lib/family-site";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { getServerCaller } from "@/lib/trpc-server";
import { buildFamilyMetadata, canViewFamilySite } from "@/lib/family-page";
import { DEFAULT_HERO_IMAGE } from "@/lib/site-images";
import { FeaturedToursSection } from "@/components/public/sections/featured-tours";
import { TestimonialsSection } from "@/components/public/sections/testimonials";
import { FAQSection } from "@/components/public/sections/faq";
import { FamilyHero } from "@/components/familia/family-hero";
import { FamilyCarousel } from "@/components/familia/family-carousel";
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

// Cada generación con su color de la marca y una leve inclinación (se endereza al pasar el mouse).
const GENERATIONS = [
  { key: "gen_kids", photo: "kids", icon: "tea", color: "#E0A126" }, // Viajes a su ritmo
  { key: "gen_teens", photo: "teens", icon: "stroller", color: "#FC451F" }, // Edades claras
  { key: "gen_parents", photo: "parents", icon: "map", color: "#15A58E" }, // Todo organizado
  { key: "gen_grandparents", photo: "grandparents", icon: "kite", color: "#441514" }, // Recuerdos para todos
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

  // Polaroid del hero: la primera foto real de "Así se vive el Perú en familia" (si hay).
  const polaroid = images.gallery[0] ?? null;

  return (
    <div>
      {/* Emoción */}
      <FamilyHero locale={locale} imageUrl={heroImage} polaroid={polaroid} />

      {/* Descubrimiento */}
      {tours.length > 0 ? (
        <FeaturedToursSection
          tours={tours}
          copy={{ eyebrow: t("tours_eyebrow"), title: t("tours_title_1"), accent: t("tours_title_2"), description: t("tours_text") }}
        />
      ) : (
        <section className="bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
            <SectionHeading eyebrow={t("tours_eyebrow")} title={t("tours_title_1")} accent={t("tours_title_2")} text={t("tours_text")} />
            <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-6 rounded-[2rem] border border-gray-100 bg-[#faf8f5] px-6 py-12 text-center sm:px-12">
              <h3 className="font-heading text-2xl font-bold text-brand-darkRed">{t("tours_empty_title")}</h3>
              <p className="max-w-xl text-lg font-light text-gray-500">{t("tours_empty_text")}</p>
              <FamilyQuoteButton className={familyBtnPrimary}>
                {t("tours_empty_cta")}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </FamilyQuoteButton>
            </div>
          </div>
        </section>
      )}

      {/* Personalización: pensado para cada generación (foto real por grupo, o su ícono) */}
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
          {/* En el celular se desliza de lado; en pantallas grandes es una grilla */}
          <ul className="-mx-4 mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
            {GENERATIONS.map(({ key, photo, icon, color }) => {
              const src = images.generations[photo];
              return (
                <li key={key} className="group w-[82%] shrink-0 snap-center sm:w-auto">
                  <div
                    className="relative aspect-[4/5] overflow-hidden rounded-[2rem]"
                    style={{ backgroundColor: `${color}1F` }}
                  >
                    {src ? (
                      <Image
                        src={src}
                        alt={t(`${key}_title`)}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transform-none"
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 82vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center" style={{ color }}>
                        <DrawOnView>
                          <FamilyIcon name={icon} className="h-24 w-24" />
                        </DrawOnView>
                      </div>
                    )}
                    <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/95 py-1.5 pl-1.5 pr-3.5 text-xs font-bold text-brand-darkRed shadow-sm sm:text-sm">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: `${color}26`, color }}>
                        <FamilyIcon name={icon} className="h-4 w-4" />
                      </span>
                      {t(`${key}_title`)}
                    </span>
                  </div>
                  <div className="relative mx-3 -mt-16 rounded-[1.75rem] bg-white p-6 shadow-[0_14px_34px_-16px_rgba(68,21,20,0.3)]">
                    <span aria-hidden="true" className="mb-4 block h-1 w-10 rounded-full" style={{ backgroundColor: color }} />
                    <h3 className="font-serif text-xl italic leading-snug text-brand-darkRed">{t(`${key}_lead`)}</h3>
                    <p className="mt-3 text-[15px] font-light leading-relaxed text-gray-500">{t(`${key}_text`)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        {images.gallery.length < 3 && <SoftWave position="bottom" />}
      </section>

      {/* Emoción compartida: así se vive el Perú en familia (fotos reales del panel) */}
      {images.gallery.length >= 3 && (
        <section className="relative overflow-hidden bg-[#FFF8EC] pb-24 lg:pb-32" aria-labelledby="family-moments">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
            <SectionHeading id="family-moments" eyebrow={t("moments_eyebrow")} title={t("moments_title_1")} accent={t("moments_title_2")} text={t("moments_text")} />
          </div>
          <div className="mt-8">
            <FamilyCarousel
              items={images.gallery}
              label={t("moments_eyebrow")}
              prevLabel={t("moments_prev")}
              nextLabel={t("moments_next")}
              alts={images.gallery.map((g, i) => g.caption || t("moments_alt", { n: i + 1 }))}
            />
          </div>
          <SoftWave position="bottom" />
        </section>
      )}

      {/* Confianza: reseñas reales de Google */}
      {testimonials.length > 0 && (
        <TestimonialsSection
          testimonials={testimonials}
          copy={{ eyebrow: t("testi_eyebrow"), title: t("testi_title_1"), accent: t("testi_title_2"), link: t("testi_link") }}
        />
      )}

      {/* Dudas antes de reservar */}
      <FAQSection
        faqs={faqs}
        copy={{ eyebrow: t("faqh_eyebrow"), title: t("faqh_title_1"), accent: t("faqh_title_2"), link: t("faqh_link") }}
      />
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
