import type { Metadata } from "next";
import { SectionHeading } from "@/components/familia/section-heading";
import { isFamilyFaq } from "@/lib/family-site";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getServerCaller } from "@/lib/trpc-server";
import { buildFamilyMetadata, canViewFamilySite } from "@/lib/family-page";
import { safeJsonLd } from "@/lib/seo";
import { FAQList } from "@/components/public/faq-list";
import { familyBtnPrimary } from "@/components/familia/styles";

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
      <section className="border-b border-gray-100 bg-[#faf8f5] py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <SectionHeading as="h1" eyebrow={t("faq_eyebrow")} title={t("faq_page_title_1")} accent={t("faq_page_title_2")} text={t("faq_page_text")} />
        </div>
      </section>
      <section className="bg-white px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-3xl">
          {usingGeneral && faqs.length > 0 && (
            <p className="mb-6 rounded-2xl border border-gray-100 bg-[#faf8f5] px-5 py-4 text-sm font-light leading-relaxed text-gray-600">
              {t("faq_general_note")}
            </p>
          )}
          <FAQList faqs={faqs} />
          <div className="mt-10 text-center">
            <Link href="/contacto" className={familyBtnPrimary}>
              {t("faq_contact")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
