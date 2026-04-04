import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ContactContent } from "@/components/public/contact-content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likeinhouse.com";
  return {
    title: t("contact_title"),
    description: t("contact_description"),
    alternates: { canonical: `${baseUrl}/${locale}/contacto` },
    openGraph: {
      title: t("contact_title"),
      description: t("contact_description"),
      url: `${baseUrl}/${locale}/contacto`,
      siteName: "Like In House",
      type: "website",
      locale: locale === "es" ? "es_PE" : "en_US",
    },
  };
}

export default async function ContactPage() {
  return (
    <div className="page-transition">
      <ContactContent />
    </div>
  );
}
