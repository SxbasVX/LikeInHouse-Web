"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ArrowUpRight, Search, MapPin } from "lucide-react";
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
    <section className="relative -mt-20 min-h-screen overflow-hidden bg-[#0A2A28] flex flex-col">

      {/* Background Image — lighter overlay, más alegre */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src={imageUrl || DEFAULT_HERO_BG}
          alt="Peru inmersive landscape"
          fill
          priority
          className="object-cover scale-105 animate-[pulse_40s_ease-in-out_infinite]"
          sizes="100vw"
        />
        {/* Overlay más suave — deja respirar la imagen */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A2A28]/55 via-[#0A2A28]/30 to-[#0A2A28]/80" />
        {/* Tinte teal sutil a la izquierda para separar del contenido */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d4f4a]/40 via-transparent to-transparent" />
      </div>

      {/* ── Onda decorativa superior (branding) ── */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
          <path d="M0 0 L1440 0 L1440 40 Q1080 120 720 60 Q360 0 0 80 Z" fill="#17827a" fillOpacity="0.25" />
          <path d="M0 0 L1440 0 L1440 20 Q1200 80 900 30 Q600 -20 0 50 Z" fill="#FC451F" fillOpacity="0.15" />
        </svg>
      </div>

      {/* ── Elemento decorativo: círculo teal difuso arriba a la derecha ── */}
      <div className="absolute top-24 right-[-80px] w-[380px] h-[380px] rounded-full bg-brand-teal/15 blur-3xl pointer-events-none z-10" />
      {/* ── Elemento decorativo: círculo naranja difuso abajo a la izquierda ── */}
      <div className="absolute bottom-32 left-[-60px] w-[280px] h-[280px] rounded-full bg-brand-orange/20 blur-3xl pointer-events-none z-10" />

      {/* ── Sticker flotante — sabor branding ── */}
      <div className="absolute top-36 right-8 lg:right-16 z-20 pointer-events-none hidden md:block animate-[bounce_6s_ease-in-out_infinite]">
        <div className="relative flex items-center justify-center w-24 h-24 lg:w-28 lg:h-28">
          {/* Fondo con forma ticket */}
          <div className="absolute inset-0 rounded-2xl bg-brand-orange rotate-6 shadow-lg" />
          <div className="relative z-10 text-center rotate-6 px-2">
            <MapPin className="h-5 w-5 text-white mx-auto mb-1" />
            <p className="text-white text-[10px] font-bold uppercase leading-tight">+50 destinos</p>
            <p className="text-white/80 text-[9px]">en Perú</p>
          </div>
        </div>
      </div>

      {/* ── Sticker flotante 2 ── */}
      <div className="absolute bottom-40 right-12 lg:right-24 z-20 pointer-events-none hidden lg:block animate-[bounce_8s_ease-in-out_infinite_1s]">
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-brand-teal -rotate-3 shadow-lg" />
          <div className="relative z-10 text-center -rotate-3">
            <p className="text-white text-[11px] font-bold leading-tight">100%</p>
            <p className="text-white/90 text-[9px] font-medium">Familiar</p>
          </div>
        </div>
      </div>

      {/* Main centered content */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 w-full pt-28 pb-32 lg:pt-36 lg:pb-40 pointer-events-none">

        {/* Badge — alegre, colorido */}
        <div className="animate-slide-down inline-flex items-center gap-2 rounded-full border border-brand-teal/50 bg-brand-teal/20 px-5 py-2 backdrop-blur-md mb-8">
          <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
          <span className="text-sm font-semibold tracking-wide uppercase text-white">
            {subtitle || t("hero_badge", { fallback: "Explora Perú como en casa" })}
          </span>
        </div>

        {/* Title — más directo, cálido, menos "premium frío" */}
        <h1
          className="animate-slide-up font-heading font-bold leading-[1.05] tracking-tight mb-6 max-w-5xl"
          style={{
            animationDelay: "100ms",
            animationFillMode: "both",
            fontSize: "clamp(2.8rem, 8vw, 6.5rem)",
            textShadow: "0 2px 12px rgba(0,0,0,0.35), 0 4px 24px rgba(0,0,0,0.2)",
          }}
        >
          <span className="text-white">{t("hero_title_1")}</span>{" "}
          <span
            className="font-serif italic font-normal"
            style={{ color: "#4ec9be" }}
          >
            {t("hero_title_2")}
          </span>{" "}
          <span className="text-white">{t("hero_title_3")}</span>
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

          {/* Quick search — alternando teal/naranja, más alegre */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {QUICK_SEARCHES.map((term, i) => (
              <button
                key={term}
                type="button"
                onClick={() => handleQuick(term)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all backdrop-blur-md border-2 ${
                  i % 2 === 0
                    ? "border-brand-teal/70 bg-brand-teal/20 text-white hover:bg-brand-teal hover:border-brand-teal"
                    : "border-brand-orange/70 bg-brand-orange/20 text-white hover:bg-brand-orange hover:border-brand-orange"
                }`}
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
