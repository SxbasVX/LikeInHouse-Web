import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { buildFamilyMetadata, canViewFamilySite } from "@/lib/family-page";
import { TextileBand, Thread } from "@/components/familia/textile";
import { familyBtnOnDark } from "@/components/familia/styles";

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
  { key: "about_value_1", thread: "#15A58E" },
  { key: "about_value_2", thread: "#F2B33D" },
  { key: "about_value_3", thread: "#7A2A24" },
] as const;

export default async function FamilyAboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await canViewFamilySite())) return null;
  const t = await getTranslations({ locale, namespace: "familia" });

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 lg:pb-20 lg:pt-20">
        <h1 className="max-w-[18ch] font-familia text-4xl leading-[1.06] text-fam-tinta sm:text-[3.4rem]">{t("about_title")}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fam-tinta/80">{t("about_intro")}</p>
      </section>

      <section className="bg-fam-niebla">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
          <h2 className="font-familia text-3xl leading-tight text-fam-tinta sm:text-[2.4rem]">{t("about_story_title")}</h2>
          <div className="max-w-[62ch] space-y-5 text-[17px] leading-[1.75] text-fam-tinta/85">
            <p>{t("about_story_1")}</p>
            <p>{t("about_story_2")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20" aria-labelledby="family-values">
        <h2 id="family-values" className="font-familia text-3xl leading-tight text-fam-tinta sm:text-[2.4rem]">
          {t("about_values_title")}
        </h2>
        <ul className="mt-10 grid gap-10 md:grid-cols-3">
          {VALUES.map(({ key, thread }) => (
            <li key={key}>
              <Thread color={thread} />
              <h3 className="mt-5 font-familia text-2xl text-fam-tinta">{t(`${key}_title`)}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-fam-tinta/75">{t(`${key}_text`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-fam-valle text-white">
        <TextileBand />
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <h2 className="font-familia text-3xl sm:text-4xl">{t("about_cta_title")}</h2>
          <Link href="/tours" className={familyBtnOnDark}>
            {t("about_cta_button")}
          </Link>
        </div>
      </section>
    </div>
  );
}
