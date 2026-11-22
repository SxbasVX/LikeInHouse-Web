import { getTranslations } from "next-intl/server";
import { getFamilyBaseUrl } from "@/lib/family-site";
import { TextileBand } from "@/components/familia/textile";

// Banner "¿Viajas en familia?" de la web general: lleva a la web familiar.
// La página decide si mostrarlo (sólo cuando la web familiar está publicada).
export async function FamilyBannerSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "familia" });
  return (
    <section className="px-4 py-12 sm:px-6 lg:py-16" aria-labelledby="family-banner-title">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-fam-valle text-white">
        <TextileBand />
        <div className="flex flex-col gap-6 px-6 py-10 sm:px-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 id="family-banner-title" className="font-heading text-3xl font-bold sm:text-4xl">
              {t("banner_title")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-white/80">{t("banner_text")}</p>
          </div>
          <a
            href={`${getFamilyBaseUrl()}/${locale}`}
            className="inline-flex min-h-12 shrink-0 items-center justify-center self-start rounded-full bg-fam-maiz px-6 py-3 font-bold text-fam-tinta transition-colors hover:bg-[#F6C565] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-fam-valle md:self-center"
          >
            {t("banner_cta")}
          </a>
        </div>
      </div>
    </section>
  );
}
