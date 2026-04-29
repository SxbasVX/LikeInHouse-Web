import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getServerCaller } from "@/lib/trpc-server";
import { FAQList } from "@/components/public/faq-list";
import { buildMetadata, safeJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return buildMetadata({
    locale,
    title: t("faq_title"),
    description: t("faq_description"),
    pathByLocale: "/faq",
  });
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEs = locale === "es";
  const [caller, t] = await Promise.all([
    getServerCaller(),
    getTranslations("faq"),
  ]);

  const faqs = await caller.public.faqs();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f: { questionEs: string; questionEn: string; answerEs: string; answerEn: string }) => ({
      "@type": "Question",
      name: isEs ? f.questionEs : f.questionEn,
      acceptedAnswer: {
        "@type": "Answer",
        text: isEs ? f.answerEs : f.answerEn,
      },
    })),
  };

  return (
    <div className="page-transition">
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
        />
      )}
      {/* Header */}
      <section className="bg-white border-b border-gray-100 pt-16 pb-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-orange mb-3">
            {t("title")}
          </span>
          <h1 className="font-heading text-4xl font-bold text-gray-900 sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-base text-gray-500 max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <FAQList faqs={faqs} />
        </div>
      </section>
    </div>
  );
}
