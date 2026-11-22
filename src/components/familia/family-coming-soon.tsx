import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getBaseUrl } from "@/lib/seo";
import { DEFAULT_HERO_IMAGE } from "@/lib/site-images";
import { familyBtnPrimary } from "@/components/familia/styles";

// Página "Próximamente": mismo estilo que el hero de la web principal.
export async function FamilyComingSoon({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "familia" });
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-20 text-center">
      <Image src={DEFAULT_HERO_IMAGE} alt="" fill priority className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/80" />
      <div className="relative z-10 mx-auto max-w-3xl">
        <Image src="/Logo.svg" alt="Like In House" width={200} height={51} className="mx-auto h-auto w-40 sm:w-48" />
        <h1 className="mt-10 font-heading font-bold leading-[1.08] text-white" style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)" }}>
          <span className="block font-serif font-normal italic text-brand-orange">{t("soon_title_1")}</span>
          <span className="block">{t("soon_title_2")}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg font-light leading-relaxed text-white/80">{t("soon_text")}</p>
        <a href={`${getBaseUrl()}/${locale}`} className={`${familyBtnPrimary} mt-10`}>
          {t("soon_cta")}
        </a>
      </div>
    </main>
  );
}
