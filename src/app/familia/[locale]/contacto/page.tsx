import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildFamilyMetadata, canViewFamilySite } from "@/lib/family-page";
import { FamilyContact } from "@/components/familia/family-contact";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "familia" });
  return buildFamilyMetadata({
    locale,
    title: t("meta_contact_title"),
    description: t("meta_contact_description"),
    pathByLocale: "/contacto",
  });
}

export default async function FamilyContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await canViewFamilySite())) return null;
  return <FamilyContact />;
}
