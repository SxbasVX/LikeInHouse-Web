import { getTranslations } from "next-intl/server";
import { getBaseUrl } from "@/lib/seo";
import { TextileBand } from "@/components/familia/textile";
import { familyBtnOnDark } from "@/components/familia/styles";

// Página "Próximamente": se muestra mientras la web familiar no esté publicada.
export async function FamilyComingSoon({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "familia" });
  return (
    <main className="flex min-h-screen flex-col bg-fam-valle text-white">
      <TextileBand />
      <div className="flex flex-1 items-center px-4 py-16 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          <p className="font-familia text-2xl text-fam-maiz">{t("site_name")}</p>
          <h1 className="mt-6 font-familia text-4xl leading-[1.08] sm:text-5xl">{t("soon_title")}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">{t("soon_text")}</p>
          <a href={`${getBaseUrl()}/${locale}`} className={`${familyBtnOnDark} mt-9`}>
            {t("soon_cta")}
          </a>
        </div>
      </div>
      <TextileBand />
    </main>
  );
}
