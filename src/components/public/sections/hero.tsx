"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ArrowUpRight, Search } from "lucide-react";
import Image from "next/image";

const DEFAULT_HERO_BG = "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1920&q=80";

const QUICK_SEARCHES = ["Cusco", "Machu Picchu", "Valle Sagrado", "Montaña 7 Colores", "Lago Titicaca"];

interface HeroProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
}

export function HeroSection({ title, subtitle, imageUrl }: HeroProps = {}) {
  const t = useTranslations("home");
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/tours?search=${encodeURIComponent(q)}` : "/tours");
  }

  function handleQuick(term: string) {
    router.push(`/tours?search=${encodeURIComponent(term)}`);
  }

  return (
    <section className="relative -mt-20 min-h-screen overflow-hidden bg-black flex flex-col">

      {/* Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src={imageUrl || DEFAULT_HERO_BG}
          alt="Peru inmersive landscape"
          fill
          priority
          className="object-cover scale-105 animate-[pulse_40s_ease-in-out_infinite]"
          sizes="100vw"
        />
        {/* Overlay neutro oscuro — sin tinte azulado, la foto domina */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/80" />
      </div>

      {/* Glow naranja difuso — el acento */}
      <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full bg-brand-orange/15 blur-3xl pointer-events-none z-10" />

      {/* ── Onda decorativa superior ── */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
          <path d="M0 0 L1440 0 L1440 40 Q1080 120 720 60 Q360 0 0 80 Z" fill="#FC451F" fillOpacity="0.12" />
        </svg>
      </div>

      {/* Main centered content */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 w-full pt-28 pb-32 lg:pt-36 lg:pb-40 pointer-events-none">

        {/* Badge */}
        <div className="animate-slide-down inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2 backdrop-blur-md mb-8">
          <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
          <span className="text-sm font-semibold tracking-wide uppercase text-white">
            {t("hero_badge")}
          </span>
        </div>

        {/* Title */}
        <h1
          className="animate-slide-up font-heading font-bold leading-[1.1] tracking-tight mb-6 max-w-5xl"
          style={{
            animationDelay: "100ms",
            animationFillMode: "both",
            fontSize: "clamp(2.8rem, 8vw, 6.5rem)",
            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}
        >
          {/* "Tu próxima historia" — toda la línea en itálica naranja */}
          <span className="font-serif italic font-normal text-brand-orange block">
            {t("hero_title_1")} {t("hero_title_2")}
          </span>
          {/* "comienza en Perú" — blanco, peso fuerte */}
          <span className="text-white block">{t("hero_title_3")}</span>
        </h1>

        {/* Subtítulo cálido */}
        <p
          className="animate-slide-up text-white/80 text-lg lg:text-xl font-light max-w-xl mb-10 leading-relaxed"
          style={{ animationDelay: "200ms", animationFillMode: "both" }}
        >
          {t("hero_subtitle", { fallback: "Viajes pensados para familias, amigos y aventureros que quieren vivir el Perú de verdad." })}
        </p>

        {/* Search bar */}
        <div
          className="animate-slide-up pointer-events-auto w-full max-w-3xl"
          style={{ animationDelay: "300ms", animationFillMode: "both" }}
        >
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-0 rounded-2xl bg-white p-2 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
          >
            <div className="flex-1 flex items-center gap-3 pl-4">
              <Search className="h-5 w-5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search_placeholder", { fallback: "Destino, tour o actividad..." })}
                className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 text-base lg:text-lg outline-none py-3.5 min-w-0 font-medium"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-brand-orange hover:bg-[#e33e1a] flex items-center gap-2 text-white font-bold transition-all hover:scale-[1.02] shadow-[0_0_16px_rgba(252,69,31,0.35)] px-4 py-3.5 sm:px-7 text-base"
            >
              <span className="hidden sm:inline">{t("hero_cta", { fallback: "Explorar" })}</span>
              <ArrowUpRight className="h-5 w-5" />
            </button>
          </form>

          {/* Quick search */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {QUICK_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleQuick(term)}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-all backdrop-blur-md border border-white/40 bg-white/10 text-white hover:bg-brand-orange hover:border-brand-orange"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Onda decorativa inferior (branding) ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <svg viewBox="0 0 1440 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
          <path d="M0 90 L1440 90 L1440 50 Q1080 0 720 40 Q360 80 0 20 Z" fill="white" fillOpacity="1" />
        </svg>
      </div>

    </section>
  );
}
