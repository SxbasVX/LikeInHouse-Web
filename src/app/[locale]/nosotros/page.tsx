import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { AboutContent } from "@/components/public/about-content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likeinhouse.com";
  return {
    title: t("about_title"),
    description: t("about_description"),
    alternates: { canonical: `${baseUrl}/${locale}/nosotros` },
    openGraph: {
      title: t("about_title"),
      description: t("about_description"),
      url: `${baseUrl}/${locale}/nosotros`,
      siteName: "Like In House",
      type: "website",
      locale: locale === "es" ? "es_PE" : "en_US",
    },
  };
}

export default async function AboutPage() {
  return (
    <div className="page-transition">
      <AboutContent />
    </div>
  );
}
