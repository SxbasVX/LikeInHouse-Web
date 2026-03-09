import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getServerCaller } from "@/lib/trpc-server";
import { FAQList } from "@/components/public/faq-list";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likeinhouse.com";
  return {
    title: t("faq_title"),
    description: t("faq_description"),
    alternates: { canonical: `${baseUrl}/${locale}/faq` },
    openGraph: {
      title: t("faq_title"),
      description: t("faq_description"),
      url: `${baseUrl}/${locale}/faq`,
      siteName: "Like In House",
      type: "website",
      locale: locale === "es" ? "es_PE" : "en_US",
    },
  };
}

export default async function FAQPage() {
  const [caller, t] = await Promise.all([
    getServerCaller(),
    getTranslations("faq"),
  ]);

  const faqs = await caller.public.faqs();

  return (
    <div className="page-transition mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="animate-slide-up mb-10 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <FAQList faqs={faqs} />
    </div>
  );
}
