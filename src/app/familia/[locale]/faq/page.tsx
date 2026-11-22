import type { Metadata } from "next";
import { isFamilyFaq } from "@/lib/family-site";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getServerCaller } from "@/lib/trpc-server";
import { buildFamilyMetadata, canViewFamilySite } from "@/lib/family-page";
import { safeJsonLd } from "@/lib/seo";
import { FAQList } from "@/components/public/faq-list";
import { Waves } from "@/components/familia/illustrations";
import { familyBtnSecondary } from "@/components/familia/styles";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "familia" });
  return buildFamilyMetadata({
    locale,
    title: t("meta_faq_title"),
    description: t("meta_faq_description"),
    pathByLocale: "/faq",
  });
}

export default async function FamilyFAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await canViewFamilySite())) return null;

  const isEs = locale === "es";
  const caller = await getServerCaller();
  const [t, allFaqs] = await Promise.all([
    getTranslations({ locale, namespace: "familia" }),
    caller.public.faqs({ scope: "all" }),
  ]);

  // Preguntas de la categoría "familia"; si todavía no hay, se muestran las generales
  const familyFaqs = allFaqs.filter((f) => isFamilyFaq(f.category));
  const usingGeneral = familyFaqs.length === 0;
  const faqs = usingGeneral ? allFaqs : familyFaqs;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: isEs ? f.questionEs : f.questionEn || f.questionEs,
      acceptedAnswer: { "@type": "Answer", text: isEs ? f.answerEs : f.answerEn || f.answerEs },
    })),
  };

  return (
    <div>
      {faqs.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />
      )}
      <section className="bg-brand-beige">
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-12 sm:px-6 lg:pt-16">
          <h1 className="font-heading text-[2rem] font-black leading-tight text-brand-darkRed sm:text-5xl">{t("faq_page_title")}</h1>
          <p className="mt-4 text-lg leading-relaxed text-brand-darkRed/85">{t("faq_page_text")}</p>
        </div>
        <Waves color="#FFFBEF" className="h-6 sm:h-10" />
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {usingGeneral && faqs.length > 0 && (
          <p className="mb-6 rounded-2xl border-2 border-dashed border-brand-teal bg-white px-4 py-3 text-sm text-brand-darkRed/85">
            {t("faq_general_note")}
          </p>
        )}
        <FAQList faqs={faqs} />
        <Link href="/contacto" className={`${familyBtnSecondary} mt-10`}>
          {t("faq_contact")}
        </Link>
      </section>
    </div>
  );
}
