import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { AboutContent } from "@/components/public/about-content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return buildMetadata({
    locale,
    title: t("about_title"),
    description: t("about_description"),
    pathByLocale: "/nosotros",
  });
}

export default async function AboutPage() {
  return (
    <div className="page-transition">
      <AboutContent />
    </div>
  );
}
