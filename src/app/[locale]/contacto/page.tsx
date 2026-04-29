import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ContactContent } from "@/components/public/contact-content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return buildMetadata({
    locale,
    title: t("contact_title"),
    description: t("contact_description"),
    pathByLocale: "/contacto",
  });
}

export default async function ContactPage() {
  return (
    <div className="page-transition">
      <ContactContent />
    </div>
  );
}
