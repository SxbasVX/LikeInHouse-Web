import type { Metadata } from "next";
import { isFamilyFaq } from "@/lib/family-site";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock3, Luggage, ShieldCheck, Smile } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getServerCaller } from "@/lib/trpc-server";
import { buildFamilyMetadata, canViewFamilySite } from "@/lib/family-page";
import { waUrl } from "@/lib/whatsapp";
import { TourCard } from "@/components/public/tour-card";
import { FAQList } from "@/components/public/faq-list";
import { FamilyQuoteButton } from "@/components/familia/family-quote-button";
import { AndesScene, Balloons, BrowserFrame, SmilingSun, Waves } from "@/components/familia/illustrations";
import { familyBtnPrimary, familyBtnSecondary } from "@/components/familia/styles";

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
        ? ["viajes en familia Perú", "tours con niños", "Machu Picchu con niños", "Cusco en familia"]
        : ["family trips Peru", "Peru tours with kids", "Machu Picchu with kids", "Cusco family travel"],
  });
}

const WHY = [
  { key: "why_1", icon: ShieldCheck, border: "border-brand-teal" },
  { key: "why_2", icon: Clock3, border: "border-brand-orange" },
  { key: "why_3", icon: Smile, border: "border-brand-orange" },
  { key: "why_4", icon: Luggage, border: "border-brand-teal" },
] as const;

const STEPS = ["step_1", "step_2", "step_3"] as const;

export default async function FamilyHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await canViewFamilySite())) return null;

  const caller = await getServerCaller();
  const [t, tours, allFaqs] = await Promise.all([
    getTranslations({ locale, namespace: "familia" }),
    caller.public.familyFeaturedTours(),
    caller.public.faqs({ scope: "all" }),
  ]);

  // Preguntas familiares; si aún no hay, las generales
  const familyFaqs = allFaqs.filter((f) => isFamilyFaq(f.category));
  const faqs = (familyFaqs.length > 0 ? familyFaqs : allFaqs).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-beige">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-16 lg:pt-16">
          <div>
            <h1 className="font-heading text-[2.1rem] font-black leading-[1.05] tracking-tight text-brand-darkRed sm:text-5xl lg:text-6xl">
              {t("hero_title")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-darkRed/85">{t("hero_text")}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/tours" className={familyBtnPrimary}>
                {t("hero_cta_tours")}
              </Link>
              <FamilyQuoteButton className={familyBtnSecondary}>{t("hero_cta_quote")}</FamilyQuoteButton>
            </div>
            <ul className="mt-8 flex flex-wrap gap-2">
              {(["hero_chip_1", "hero_chip_2", "hero_chip_3"] as const).map((k, i) => (
                <li
                  key={k}
                  className={`rounded-full border-2 bg-white px-3 py-1 text-sm font-bold text-brand-darkRed ${i === 1 ? "border-brand-orange" : "border-brand-teal"}`}
                >
                  {t(k)}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <BrowserFrame className="rotate-1" label="familia.likeinhouseperu.com">
              <AndesScene className="block h-auto w-full" title={t("hero_illustration")} />
            </BrowserFrame>
            <Balloons className="absolute -right-2 -top-10 w-16 -rotate-6 sm:-right-6 sm:w-24" />
          </div>
        </div>
        <Waves color="#FFFBEF" className="h-6 sm:h-10" />
      </section>

      {/* Tours familiares */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20" aria-labelledby="family-tours">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 id="family-tours" className="font-heading text-3xl font-black text-brand-darkRed sm:text-4xl">
              {t("tours_title")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-brand-darkRed/80">{t("tours_text")}</p>
          </div>
          {tours.length > 0 && (
            <Link href="/tours" className={`${familyBtnSecondary} self-start sm:self-auto`}>
              {t("tours_all")}
            </Link>
          )}
        </div>

        {tours.length > 0 ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour, i) => (
              <li
                key={tour.id}
                className={`flex rounded-3xl border-2 bg-white p-3 sm:p-4 ${i % 2 === 0 ? "border-brand-teal" : "border-brand-orange"}`}
              >
                <div className="flex w-full flex-col">
                  <TourCard tour={tour} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <BrowserFrame className="mt-10" label={t("site_name")}>
            <div className="flex flex-col items-center gap-6 px-6 py-10 text-center sm:flex-row sm:text-left">
              <Balloons className="w-20 shrink-0 sm:w-24" />
              <div className="flex-1">
                <h3 className="font-heading text-xl font-extrabold text-brand-darkRed sm:text-2xl">{t("tours_empty_title")}</h3>
                <p className="mt-2 max-w-xl text-brand-darkRed/80">{t("tours_empty_text")}</p>
              </div>
              <FamilyQuoteButton className={`${familyBtnPrimary} shrink-0`}>{t("tours_empty_cta")}</FamilyQuoteButton>
            </div>
          </BrowserFrame>
        )}
      </section>

      {/* Por qué viajar con nosotros */}
      <section className="bg-brand-beige" aria-labelledby="family-why">
        <Waves color="#FBEDBE" className="h-6 rotate-180 bg-[#FFFBEF] sm:h-10" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <SmilingSun className="absolute right-4 top-0 hidden w-24 sm:block lg:w-32" />
          <div className="max-w-2xl">
            <h2 id="family-why" className="font-heading text-3xl font-black text-brand-darkRed sm:text-4xl">
              {t("why_title")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-brand-darkRed/80">{t("why_text")}</p>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map(({ key, icon: Icon, border }) => (
              <li key={key} className={`rounded-3xl border-2 ${border} bg-white p-6`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-brand-darkRed bg-[#FFC93C]">
                  <Icon className="h-6 w-6 text-brand-darkRed" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-heading text-lg font-extrabold leading-snug text-brand-darkRed">{t(`${key}_title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-darkRed/80">{t(`${key}_text`)}</p>
              </li>
            ))}
          </ul>
        </div>
        <Waves color="#FFFBEF" className="h-6 sm:h-10" />
      </section>

      {/* Cómo reservar: es una secuencia real, por eso va numerada */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20" aria-labelledby="family-steps">
        <h2 id="family-steps" className="font-heading text-3xl font-black text-brand-darkRed sm:text-4xl">
          {t("steps_title")}
        </h2>
        <ol className="relative mt-10 grid gap-8 md:grid-cols-3">
          <span aria-hidden="true" className="absolute left-7 right-7 top-7 hidden border-t-4 border-dashed border-brand-teal/40 md:block" />
          {STEPS.map((key, i) => (
            <li key={key} className="relative flex gap-4 md:flex-col">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-brand-darkRed bg-brand-orange font-heading text-2xl font-black text-white shadow-[3px_3px_0_0_#441514]">
                {i + 1}
              </span>
              <div>
                <h3 className="font-heading text-xl font-extrabold text-brand-darkRed">{t(`${key}_title`)}</h3>
                <p className="mt-1 leading-relaxed text-brand-darkRed/80">{t(`${key}_text`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Preguntas frecuentes */}
      {faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-14 sm:px-6 lg:pb-20" aria-labelledby="family-faq">
          <h2 id="family-faq" className="font-heading text-3xl font-black text-brand-darkRed sm:text-4xl">
            {t("faq_title")}
          </h2>
          <div className="mt-8">
            <FAQList faqs={faqs} />
          </div>
          <Link href="/faq" className={`${familyBtnSecondary} mt-8`}>
            {t("faq_all")}
          </Link>
        </section>
      )}

      {/* Llamado final */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border-2 border-brand-darkRed bg-[#FFC93C] px-6 py-12 shadow-[6px_6px_0_0_#441514] sm:px-12">
          <Balloons className="absolute -bottom-6 right-4 hidden w-24 sm:block" />
          <div className="max-w-xl">
            <h2 className="font-heading text-3xl font-black text-brand-darkRed sm:text-4xl">{t("cta_title")}</h2>
            <p className="mt-3 text-lg leading-relaxed text-brand-darkRed/90">{t("cta_text")}</p>
            <a
              href={waUrl(t("cta_whatsapp_message"))}
              target="_blank"
              rel="noopener noreferrer"
              className={`${familyBtnPrimary} mt-7`}
            >
              {t("cta_button")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
