import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { WhoTravels } from "@/components/familia/who-travels";
import { WalkingFamily } from "@/components/familia/walking-family";

// Hero de la web familiar: foto de una familia a pantalla completa con el lenguaje de la web
// principal (titular cursiva + blanco, ola inferior). El texto va a la izquierda para que la
// familia de la foto se vea a la derecha; en el celular el selector baja debajo del hero.
export async function FamilyHero({ locale, imageUrl }: { locale: string; imageUrl: string }) {
  const t = await getTranslations({ locale, namespace: "familia" });

  return (
    <>
      <section className="relative -mt-20 flex min-h-[88svh] flex-col overflow-hidden bg-black lg:min-h-screen">
        <div className="pointer-events-none absolute inset-0 z-0">
          {/* En el celular se encuadra hacia la derecha, donde está la familia */}
          <Image
            src={imageUrl}
            alt=""
            fill
            priority
            className="object-cover object-[78%_center] lg:object-center"
            sizes="100vw"
          />
          {/* Celular: oscuro arriba (logo) y abajo (texto). Escritorio: oscuro sólo a la izquierda */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/80 lg:hidden" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-black/80 via-black/45 to-transparent lg:block" />
          <div className="absolute inset-x-0 top-0 hidden h-40 bg-gradient-to-b from-black/50 to-transparent lg:block" />
        </div>

        <div className="relative z-20 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-end px-4 pb-16 pt-28 text-center sm:px-6 sm:pb-32 lg:justify-center lg:px-12 lg:pb-40 lg:pt-32 lg:text-left">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-[46rem]">
            <div
              className="mb-5 hidden items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 backdrop-blur-md sm:mb-7 sm:inline-flex sm:px-5 sm:py-2"
              style={{ opacity: 0, animation: "hero-reveal 0.7s cubic-bezier(0.16,1,0.3,1) 200ms forwards" }}
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-orange" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white sm:text-sm">{t("hero_badge")}</span>
            </div>

            <h1
              className="mb-5 font-heading font-bold leading-[1.05] tracking-tight sm:mb-6"
              style={{ fontSize: "clamp(2rem, 4.6vw, 4.5rem)", textShadow: "0 2px 16px rgba(0,0,0,0.45)" }}
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
              className="max-w-xl text-[15px] font-light leading-relaxed text-white/90 sm:text-lg lg:mb-10"
              style={{ opacity: 0, animation: "hero-reveal 0.7s cubic-bezier(0.16,1,0.3,1) 700ms forwards" }}
            >
              {t("hero_text")}
            </p>

            {/* Selector en el hero sólo en pantallas grandes */}
            <div
              className="hidden lg:block"
              style={{ opacity: 0, animation: "hero-reveal 0.7s cubic-bezier(0.16,1,0.3,1) 880ms forwards" }}
            >
              <WhoTravels mode="go" />
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10">
          {/* Familia caminando sobre la ola */}
          <WalkingFamily className="absolute bottom-[38%] left-[36%] z-[1] h-11 w-auto sm:bottom-[50%] sm:left-[9%] sm:h-16 lg:h-20" />
          <svg viewBox="0 0 1440 140" fill="none" className="h-16 w-full sm:h-24 lg:h-32" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 140 L1440 140 L1440 60 C1200 0 960 0 720 60 C480 120 240 120 0 40 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Celular y tablet: el selector va debajo del hero para no tapar a la familia */}
      <div className="relative z-30 -mt-6 bg-white px-4 pb-8 sm:px-6 lg:hidden">
        <div className="mx-auto max-w-2xl">
          <WhoTravels mode="go" />
        </div>
      </div>
    </>
  );
}
