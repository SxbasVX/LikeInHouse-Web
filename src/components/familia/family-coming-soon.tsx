import { getTranslations } from "next-intl/server";
import { getBaseUrl } from "@/lib/seo";
import { Balloons, BrowserFrame, SmilingSun } from "@/components/familia/illustrations";
import { familyBtnPrimary } from "@/components/familia/styles";

// Página "Próximamente": se muestra cuando la web familiar aún no es visible.
export async function FamilyComingSoon({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "familia" });
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-beige px-4 py-16">
      <SmilingSun className="absolute -right-8 -top-8 w-32 sm:w-44" />
      <Balloons className="absolute bottom-6 left-2 w-16 sm:left-10 sm:w-24" />
      <BrowserFrame className="relative w-full max-w-lg" label={t("site_name")}>
        <div className="px-6 py-10 text-center sm:px-10">
          <p className="inline-block -rotate-2 rounded-full border-2 border-brand-darkRed bg-[#FFC93C] px-4 py-1 font-heading text-sm font-extrabold text-brand-darkRed">
            {t("soon_badge")}
          </p>
          <h1 className="mt-5 font-heading text-2xl font-extrabold leading-tight text-brand-darkRed sm:text-3xl">
            {t("soon_title")}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-brand-darkRed/80">{t("soon_text")}</p>
          <a href={`${getBaseUrl()}/${locale}`} className={`${familyBtnPrimary} mt-8`}>
            {t("soon_cta")}
          </a>
        </div>
      </BrowserFrame>
    </main>
  );
}
