import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { WhoTravels } from "@/components/familia/who-travels";
import { WalkingFamily } from "@/components/familia/walking-family";

// Hero de la web familiar: misma estructura que el de la web principal
// (foto a pantalla completa, titular cursiva naranja + blanco, ola inferior),
// con "¿Quiénes viajan?" en lugar del buscador.
export async function FamilyHero({
  locale,
  imageUrl,
  polaroid,
}: {
  locale: string;
  imageUrl: string;
  /** Foto real de una familia (la primera del carrusel). Sin fotos cargadas, no se muestra. */
  polaroid?: { url: string; caption: string } | null;
}) {
  const t = await getTranslations({ locale, namespace: "familia" });

  return (
    <section className="relative -mt-20 flex min-h-screen flex-col overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image src={imageUrl} alt="" fill priority className="scale-105 object-cover" sizes="100vw" />
        {/* Más contraste al centro para que el título y el texto se lean sobre cualquier foto */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.35)_0%,transparent_65%)]" />
      </div>

      <div className="pointer-events-none absolute bottom-40 left-1/2 z-10 h-[200px] w-[600px] -translate-x-1/2 rounded-full bg-brand-orange/15 blur-3xl" />

      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10">
        <svg viewBox="0 0 1440 120" fill="none" className="w-full" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0 L1440 0 L1440 40 Q1080 120 720 60 Q360 0 0 80 Z" fill="rgb(var(--brand-orange-rgb))" fillOpacity="0.12" />
        </svg>
      </div>

      {/* Presencia humana: polaroid de una familia real que ya viajó (sólo pantallas grandes) */}
      {polaroid && (
        <figure className="pointer-events-none absolute bottom-[26%] right-6 z-20 hidden w-44 rotate-3 bg-white p-2 pb-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)] xl:block 2xl:right-14 2xl:w-56">
          <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
            <Image src={polaroid.url} alt={polaroid.caption || ""} fill className="object-cover" sizes="240px" />
          </div>
          {polaroid.caption && (
            <figcaption className="pt-2 text-center font-serif text-sm italic text-brand-darkRed">{polaroid.caption}</figcaption>
          )}
        </figure>
      )}

      <div className="relative z-20 flex w-full flex-1 flex-col items-center justify-center px-4 pb-28 pt-24 text-center sm:pb-32 sm:pt-28 lg:pb-40 lg:pt-32">
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 backdrop-blur-md sm:mb-8 sm:px-5 sm:py-2"
          style={{ opacity: 0, animation: "hero-reveal 0.7s cubic-bezier(0.16,1,0.3,1) 200ms forwards" }}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-orange" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-white sm:text-sm">{t("hero_badge")}</span>
        </div>

        <h1
          className="mb-5 max-w-5xl overflow-hidden px-2 font-heading font-bold leading-[1.05] tracking-tight sm:mb-6 sm:leading-[1.1]"
          style={{ fontSize: "clamp(2.1rem, 6.4vw, 5.25rem)", textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}
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
          className="mb-8 max-w-2xl px-2 text-[15px] font-light leading-relaxed text-white/90 sm:mb-10 sm:text-lg"
          style={{ opacity: 0, animation: "hero-reveal 0.7s cubic-bezier(0.16,1,0.3,1) 700ms forwards" }}
        >
          {t("hero_text")}
        </p>

        <div
          className="w-full max-w-[52rem]"
          style={{ opacity: 0, animation: "hero-reveal 0.7s cubic-bezier(0.16,1,0.3,1) 880ms forwards" }}
        >
          <WhoTravels mode="go" />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10">
        {/* Familia caminando sobre la ola (se apoya en la curva, a la izquierda) */}
        <WalkingFamily className="absolute bottom-[38%] left-[36%] z-[1] h-11 w-auto sm:bottom-[50%] sm:left-[9%] sm:h-16 lg:h-20" />
        <svg viewBox="0 0 1440 140" fill="none" className="h-16 w-full sm:h-24 lg:h-32" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 140 L1440 140 L1440 60 C1200 0 960 0 720 60 C480 120 240 120 0 40 Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
