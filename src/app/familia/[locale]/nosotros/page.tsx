import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeartHandshake, Leaf, ReceiptText } from "lucide-react";
import { Link } from "@/i18n/routing";
import { buildFamilyMetadata, canViewFamilySite } from "@/lib/family-page";
import { BrowserFrame, SmilingSun, Waves } from "@/components/familia/illustrations";
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
  { key: "about_value_1", icon: HeartHandshake, border: "border-brand-orange" },
  { key: "about_value_2", icon: ReceiptText, border: "border-brand-teal" },
  { key: "about_value_3", icon: Leaf, border: "border-brand-orange" },
] as const;

export default async function FamilyAboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await canViewFamilySite())) return null;
  const t = await getTranslations({ locale, namespace: "familia" });

  return (
    <div>
      <section className="relative overflow-hidden bg-brand-beige">
        <div className="mx-auto max-w-4xl px-4 pb-12 pt-12 sm:px-6 lg:pt-16">
          <SmilingSun className="absolute right-2 top-4 w-20 sm:right-10 sm:w-28" />
          <h1 className="max-w-2xl pr-16 font-heading text-[2rem] font-black leading-tight text-brand-darkRed sm:pr-0 sm:text-5xl">
            {t("about_title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-brand-darkRed/85">{t("about_intro")}</p>
        </div>
        <Waves color="#FFFBEF" className="h-6 sm:h-10" />
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <BrowserFrame>
          <div className="px-6 py-8 sm:px-10">
            <h2 className="font-heading text-2xl font-black text-brand-darkRed sm:text-3xl">{t("about_story_title")}</h2>
            <p className="mt-4 max-w-prose leading-relaxed text-brand-darkRed/85">{t("about_story_1")}</p>
            <p className="mt-4 max-w-prose leading-relaxed text-brand-darkRed/85">{t("about_story_2")}</p>
          </div>
        </BrowserFrame>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:pb-16" aria-labelledby="family-values">
        <h2 id="family-values" className="font-heading text-2xl font-black text-brand-darkRed sm:text-3xl">
          {t("about_values_title")}
        </h2>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {VALUES.map(({ key, icon: Icon, border }) => (
            <li key={key} className={`rounded-3xl border-2 ${border} bg-white p-6`}>
              <Icon className="h-8 w-8 text-brand-darkTeal" aria-hidden="true" />
              <h3 className="mt-3 font-heading text-lg font-extrabold text-brand-darkRed">{t(`${key}_title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-darkRed/80">{t(`${key}_text`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-5 rounded-3xl border-2 border-brand-darkRed bg-[#FFC93C] px-6 py-10 shadow-[6px_6px_0_0_#441514] sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <h2 className="font-heading text-2xl font-black text-brand-darkRed sm:text-3xl">{t("about_cta_title")}</h2>
          <Link href="/tours" className={familyBtnPrimary}>
            {t("about_cta_button")}
          </Link>
        </div>
      </section>
    </div>
  );
}
