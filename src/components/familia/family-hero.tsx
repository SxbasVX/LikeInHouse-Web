import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { WhoTravels } from "@/components/familia/who-travels";

// Hero de la web familiar: misma estructura que el de la web principal
// (foto a pantalla completa, titular cursiva naranja + blanco, ola inferior),
// con "¿Quiénes viajan?" en lugar del buscador.
export async function FamilyHero({ locale, imageUrl }: { locale: string; imageUrl: string }) {
  const t = await getTranslations({ locale, namespace: "familia" });

  return (
    <section className="relative -mt-20 flex min-h-screen flex-col overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image src={imageUrl} alt="" fill priority className="scale-105 object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/80" />
      </div>

      <div className="pointer-events-none absolute bottom-40 left-1/2 z-10 h-[200px] w-[600px] -translate-x-1/2 rounded-full bg-brand-orange/15 blur-3xl" />

      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10">
        <svg viewBox="0 0 1440 120" fill="none" className="w-full" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0 L1440 0 L1440 40 Q1080 120 720 60 Q360 0 0 80 Z" fill="rgb(var(--brand-orange-rgb))" fillOpacity="0.12" />
        </svg>
      </div>

      <div className="relative z-20 flex w-full flex-1 flex-col items-center justify-center px-4 pb-28 pt-24 text-center sm:pb-32 sm:pt-28 lg:pb-40 lg:pt-36">
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 backdrop-blur-md sm:mb-8 sm:px-5 sm:py-2"
          style={{ opacity: 0, animation: "hero-reveal 0.7s cubic-bezier(0.16,1,0.3,1) 200ms forwards" }}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-orange" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-white sm:text-sm">{t("hero_badge")}</span>
        </div>

        <h1
          className="mb-5 max-w-5xl overflow-hidden px-2 font-heading font-bold leading-[1.05] tracking-tight sm:mb-6 sm:leading-[1.1]"
          style={{ fontSize: "clamp(2.1rem, 8vw, 6rem)", textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
        >
          <span
            className="block font-serif font-normal italic text-[#3FD0B4]"
            style={{ opacity: 0, animation: "hero-title 0.85s cubic-bezier(0.16,1,0.3,1) 380ms forwards" }}
          >
            {t("hero_title_1")}
          </span>
          <span
            className="block text-white"
            style={{ opacity: 0, animation: "hero-title 0.85s cubic-bezier(0.16,1,0.3,1) 530ms forwards" }}
          >
            {t("hero_title_2")}
          </span>
        </h1>

        <p
          className="mb-7 max-w-xl px-4 text-sm font-light leading-relaxed text-white/80 sm:mb-10 sm:text-lg lg:text-xl"
          style={{ opacity: 0, animation: "hero-reveal 0.7s cubic-bezier(0.16,1,0.3,1) 700ms forwards" }}
        >
          {t("hero_text")}
        </p>

        <div
          className="w-full max-w-[60rem] text-left"
          style={{ opacity: 0, animation: "hero-reveal 0.7s cubic-bezier(0.16,1,0.3,1) 880ms forwards" }}
        >
          <WhoTravels mode="go" tone="dark" />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10">
        <svg viewBox="0 0 1440 140" fill="none" className="h-16 w-full sm:h-24 lg:h-32" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 140 L1440 140 L1440 60 C1200 0 960 0 720 60 C480 120 240 120 0 40 Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
