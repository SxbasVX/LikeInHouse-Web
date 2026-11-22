import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeartHandshake, Leaf, ReceiptText, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { buildFamilyMetadata, canViewFamilySite } from "@/lib/family-page";
import { SectionHeading } from "@/components/familia/section-heading";
import { familyBtnPrimary } from "@/components/familia/styles";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "familia" });
  return buildFamilyMetadata({
    locale,
    title: t("meta_about_title"),
    description: t("meta_about_description"),
    pathByLocale: "/nosotros",
  });
}

const VALUES = [
  { key: "about_value_1", icon: HeartHandshake },
  { key: "about_value_2", icon: ReceiptText },
  { key: "about_value_3", icon: Leaf },
] as const;

export default async function FamilyAboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await canViewFamilySite())) return null;
  const t = await getTranslations({ locale, namespace: "familia" });

  return (
    <div>
      <section className="border-b border-gray-100 bg-[#faf8f5] py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <SectionHeading as="h1" eyebrow={t("about_eyebrow")} title={t("about_title_1")} accent={t("about_title_2")} text={[t("about_intro_1"), t("about_intro_2"), t("about_intro_3")]} />
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
          <h2 className="font-heading text-3xl font-bold leading-tight text-brand-darkRed sm:text-4xl">{t("about_story_title")}</h2>
          <div className="max-w-[65ch] space-y-5 text-lg font-light leading-relaxed text-gray-600">
            <p>{t("about_story_1")}</p>
            <p>{t("about_story_2")}</p>
            <p>{t("about_story_3")}</p>
          </div>
        </div>
      </section>

      <section className="bg-[#faf8f5] py-16 lg:py-24" aria-labelledby="family-values">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <SectionHeading id="family-values" title={t("about_values_title_1")} accent={t("about_values_title_2")} />
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {VALUES.map(({ key, icon: Icon }) => (
              <li key={key} className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-heading text-xl font-bold text-brand-darkRed">{t(`${key}_title`)}</h3>
                <p className="mt-3 text-[15px] font-light leading-relaxed text-gray-500">{t(`${key}_text`)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-12 text-center">
            <Link href="/tours" className={familyBtnPrimary}>
              {t("about_cta_button")}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
