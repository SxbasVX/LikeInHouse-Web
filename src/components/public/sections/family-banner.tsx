import { getTranslations } from "next-intl/server";
import { getFamilyBaseUrl } from "@/lib/family-site";
import { Balloons, SmilingSun } from "@/components/familia/illustrations";

// Banner "¿Viajas con niños?" de la web general: lleva a la web familiar.
// La página decide si mostrarlo (sólo cuando la web familiar está publicada).
export async function FamilyBannerSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "familia" });
  return (
    <section className="px-4 py-12 sm:px-6 lg:py-16" aria-labelledby="family-banner-title">
      <div className="relative mx-auto flex max-w-5xl flex-col gap-6 overflow-hidden rounded-3xl border-2 border-brand-darkRed bg-brand-beige px-6 py-10 shadow-[6px_6px_0_0_#441514] sm:px-10 md:flex-row md:items-center">
        <SmilingSun className="absolute -right-6 -top-6 w-24 opacity-90 sm:w-28" />
        <Balloons className="hidden w-20 shrink-0 md:block" />
        <div className="relative max-w-xl flex-1">
          <h2 id="family-banner-title" className="font-heading text-3xl font-black text-brand-darkRed sm:text-4xl">
            {t("banner_title")}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-brand-darkRed/85">{t("banner_text")}</p>
        </div>
        <a
          href={`${getFamilyBaseUrl()}/${locale}`}
          className="relative inline-flex shrink-0 items-center justify-center self-start rounded-full border-2 border-brand-darkRed bg-brand-darkTeal px-6 py-3 font-heading font-extrabold text-white shadow-[4px_4px_0_0_#441514] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 md:self-center"
        >
          {t("banner_cta")}
        </a>
      </div>
    </section>
  );
}
