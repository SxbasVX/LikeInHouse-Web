import type { Metadata } from "next";
import { isFamilyFaq } from "@/lib/family-site";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getServerCaller } from "@/lib/trpc-server";
import { buildFamilyMetadata, canViewFamilySite } from "@/lib/family-page";
import { safeJsonLd } from "@/lib/seo";
import { FAQList } from "@/components/public/faq-list";
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
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
        <div>
          <h1 className="font-familia text-4xl leading-[1.06] text-fam-tinta sm:text-5xl">{t("faq_page_title")}</h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-fam-tinta/75">{t("faq_page_text")}</p>
          <Link href="/contacto" className={`${familyBtnSecondary} mt-8`}>
            {t("faq_contact")}
          </Link>
        </div>
        <div>
          {usingGeneral && faqs.length > 0 && (
            <p className="mb-6 rounded-2xl bg-fam-niebla px-5 py-4 text-sm leading-relaxed text-fam-tinta/80">
              {t("faq_general_note")}
            </p>
          )}
          <FAQList faqs={faqs} />
        </div>
      </section>
    </div>
  );
}
