import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { getFamilyBaseUrl } from "@/lib/family-site";

// Banner "¿Viajas en familia?" de la web principal: lleva a la web familiar.
// La página decide si mostrarlo (sólo cuando la web familiar está publicada).
export async function FamilyBannerSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "familia" });
  return (
    <section className="bg-white px-4 py-12 sm:px-6 lg:px-12 lg:py-16" aria-labelledby="family-banner-title">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 rounded-[2rem] bg-[#faf8f5] px-6 py-10 sm:px-12 md:flex-row md:items-center md:justify-between lg:py-14">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-teal">{t("banner_eyebrow")}</p>
          <h2 id="family-banner-title" className="font-heading text-3xl font-light tracking-tight text-brand-darkRed sm:text-4xl">
            {t("banner_title_1")}{" "}
            <span className="font-serif font-normal italic text-brand-orange">{t("banner_title_2")}</span>
          </h2>
          <p className="mt-3 text-lg font-light leading-relaxed text-gray-500">{t("banner_text")}</p>
        </div>
        <a
          href={`${getFamilyBaseUrl()}/${locale}`}
          className="group inline-flex w-fit shrink-0 items-center rounded-full bg-brand-orange py-1.5 pl-6 pr-1.5 text-sm font-bold text-white transition-colors hover:bg-brand-darkRed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 sm:text-base"
        >
          {t("banner_cta")}
          <span className="ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 transition-colors group-hover:bg-white group-hover:text-brand-darkRed">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </a>
      </div>
    </section>
  );
}
