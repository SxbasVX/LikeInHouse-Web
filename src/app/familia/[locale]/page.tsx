import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { isFamilyFaq } from "@/lib/family-site";
import { getServerCaller } from "@/lib/trpc-server";
import { buildFamilyMetadata, canViewFamilySite } from "@/lib/family-page";
import { waUrl } from "@/lib/whatsapp";
import { DEFAULT_HERO_IMAGE } from "@/lib/site-images";
import { TourCard } from "@/components/public/tour-card";
import { FAQList } from "@/components/public/faq-list";
import { FamilyQuoteButton } from "@/components/familia/family-quote-button";
import { WhoTravels } from "@/components/familia/who-travels";
import { ArchPhoto, TextileBand, Thread } from "@/components/familia/textile";
import { familyBtnOnDark, familyBtnPrimary, familyBtnSecondary } from "@/components/familia/styles";

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

// Cada generación de la familia tiene su hilo de color (el mismo del selector).
const GENERATIONS = [
  { key: "gen_kids", thread: "#F2B33D" },
  { key: "gen_teens", thread: "#FC451F" },
  { key: "gen_parents", thread: "#15A58E" },
  { key: "gen_grandparents", thread: "#7A2A24" },
] as const;

const STEPS = ["step_1", "step_2", "step_3"] as const;

type HomeSection = { type: string; imageUrl: string | null };

export default async function FamilyHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await canViewFamilySite())) return null;

  const caller = await getServerCaller();
  const [t, tours, allFaqs, sections] = await Promise.all([
    getTranslations({ locale, namespace: "familia" }),
    caller.public.familyFeaturedTours(),
    caller.public.faqs({ scope: "all" }),
    caller.public.homeSections(),
  ]);

  // Foto del hero: la del primer tour familiar; si aún no hay, la del inicio de la web general.
  const heroImage =
    tours.find((tour) => tour.images?.[0]?.url)?.images[0].url ??
    (sections as HomeSection[]).find((s) => s.type === "HERO")?.imageUrl ??
    DEFAULT_HERO_IMAGE;

  const familyFaqs = allFaqs.filter((f) => isFamilyFaq(f.category));
  const faqs = (familyFaqs.length > 0 ? familyFaqs : allFaqs).slice(0, 5);

  return (
    <div>
      {/* Hero: quiénes viajan */}
      <section className="bg-fam-valle text-white" aria-labelledby="family-hero">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:pb-20 lg:pt-16">
          <div>
            <h1 id="family-hero" className="max-w-[14ch] font-familia text-[2.6rem] leading-[1.04] sm:text-6xl lg:text-[4.25rem]">
              {t("hero_title")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">{t("hero_text")}</p>
            <div className="mt-9 max-w-2xl">
              <WhoTravels mode="go" tone="dark" />
            </div>
          </div>
          <ArchPhoto src={heroImage} alt={t("hero_photo_alt")} className="mx-auto w-full max-w-sm lg:max-w-none" />
        </div>
        <TextileBand />
      </section>

      {/* Tours familiares */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24" aria-labelledby="family-tours">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 id="family-tours" className="font-familia text-3xl leading-tight text-fam-tinta sm:text-[2.6rem]">
              {t("tours_title")}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-fam-tinta/75">{t("tours_text")}</p>
          </div>
          {tours.length > 0 && (
            <Link href="/tours" className={`${familyBtnSecondary} self-start sm:self-auto`}>
              {t("tours_all")}
            </Link>
          )}
        </div>

        {tours.length > 0 ? (
          <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <li key={tour.id} className="flex">
                <TourCard tour={tour} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10 grid gap-6 rounded-3xl bg-fam-niebla p-8 sm:p-10 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h3 className="font-familia text-2xl text-fam-tinta">{t("tours_empty_title")}</h3>
              <p className="mt-2 max-w-xl text-fam-tinta/75">{t("tours_empty_text")}</p>
            </div>
            <FamilyQuoteButton className={familyBtnPrimary}>{t("tours_empty_cta")}</FamilyQuoteButton>
          </div>
        )}
      </section>

      {/* Cada generación */}
      <section className="bg-fam-niebla" aria-labelledby="family-generations">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-2xl">
            <h2 id="family-generations" className="font-familia text-3xl leading-tight text-fam-tinta sm:text-[2.6rem]">
              {t("gen_title")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-fam-tinta/75">{t("gen_text")}</p>
          </div>
          <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-fam-tinta/10">
            {GENERATIONS.map(({ key, thread }) => (
              <li key={key} className="lg:px-7 lg:first:pl-0 lg:last:pr-0">
                <Thread color={thread} />
                <h3 className="mt-5 font-familia text-2xl text-fam-tinta">{t(`${key}_title`)}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-fam-tinta/75">{t(`${key}_text`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cómo reservar: es una secuencia real, por eso va numerada */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24" aria-labelledby="family-steps">
        <h2 id="family-steps" className="font-familia text-3xl leading-tight text-fam-tinta sm:text-[2.6rem]">
          {t("steps_title")}
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((key, i) => (
            <li key={key} className="border-t border-fam-tinta/15 pt-6">
              <span className="font-familia text-5xl leading-none text-fam-valle" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold text-fam-tinta">{t(`${key}_title`)}</h3>
              <p className="mt-2 leading-relaxed text-fam-tinta/75">{t(`${key}_text`)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Preguntas frecuentes */}
      {faqs.length > 0 && (
        <section className="border-t border-fam-tinta/10" aria-labelledby="family-faq">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-24">
            <div>
              <h2 id="family-faq" className="font-familia text-3xl leading-tight text-fam-tinta sm:text-[2.6rem]">
                {t("faq_title")}
              </h2>
              <Link href="/faq" className={`${familyBtnSecondary} mt-8`}>
                {t("faq_all")}
              </Link>
            </div>
            <FAQList faqs={faqs} />
          </div>
        </section>
      )}

      {/* Cierre */}
      <section className="bg-fam-valle text-white">
        <TextileBand />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="max-w-[18ch] font-familia text-3xl leading-tight sm:text-5xl">{t("cta_title")}</h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/80">{t("cta_text")}</p>
          <a href={waUrl(t("cta_whatsapp_message"))} target="_blank" rel="noopener noreferrer" className={`${familyBtnOnDark} mt-8`}>
            {t("cta_button")}
          </a>
        </div>
      </section>
    </div>
  );
}
