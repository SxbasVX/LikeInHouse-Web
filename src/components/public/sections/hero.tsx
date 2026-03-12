"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ArrowUpRight, Search } from "lucide-react";
import Image from "next/image";

const HERO_BG = "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1920&q=80";

const QUICK_SEARCHES = ["Cusco", "Machu Picchu", "Valle Sagrado", "Montaña 7 Colores", "Lago Titicaca"];

export function HeroSection() {
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
    <section className="relative -mt-[100px] min-h-screen lg:min-h-[110vh] overflow-hidden bg-[#0A0D0C] flex flex-col">
      {/* Background Image with Cinematic Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src={HERO_BG}
          alt="Peru inmersive landscape"
          fill
          priority
          className="object-cover scale-105 animate-[pulse_40s_ease-in-out_infinite]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/20 mix-blend-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0A0D0C] via-[#0A0D0C]/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#0A0D0C]/80 via-[#0A0D0C]/30 to-transparent" />
      </div>

      {/* Main centered content */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 w-full pt-28 pb-32 lg:pt-36 lg:pb-40 pointer-events-none">

        {/* Badge */}
        <div className="animate-slide-down inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-1.5 backdrop-blur-md mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-orange animate-pulse" />
          <span className="text-xs uppercase tracking-[0.2em] text-brand-beige">
            {t("hero_badge", { fallback: "Explora Perú como en casa" })}
          </span>
        </div>

        {/* Title */}
        <h1
          className="animate-slide-up flex flex-col font-heading text-5xl sm:text-7xl lg:text-[7rem] font-light leading-[1.05] tracking-tight text-white drop-shadow-2xl mb-12 lg:mb-14"
          style={{ animationDelay: "100ms", animationFillMode: "both" }}
        >
          <span className="block text-white/90">{t("hero_title_1")}</span>
          <span className="block font-serif italic font-normal text-brand-beige transform -rotate-1 my-1 lg:my-0 lg:-ml-12 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
            {t("hero_title_2")}
          </span>
          <span className="block text-white/90">{t("hero_title_3")}</span>
        </h1>

        {/* Search bar — pointer-events re-enabled */}
        <div
          className="animate-slide-up pointer-events-auto w-full max-w-3xl"
          style={{ animationDelay: "250ms", animationFillMode: "both" }}
        >
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-0 rounded-2xl bg-white p-2 shadow-[0_12px_50px_rgba(0,0,0,0.5)]"
          >
            <div className="flex-1 flex items-center gap-3 pl-4">
              <Search className="h-5 w-5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search_placeholder", { fallback: "Destino, tour o actividad..." })}
                className="flex-1 bg-transparent text-gray-800 placeholder:text-gray-400 text-base lg:text-lg outline-none py-3.5 min-w-0"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 px-7 py-3.5 rounded-xl bg-brand-orange hover:bg-[#e33e1a] flex items-center gap-2 text-white font-semibold text-sm lg:text-base transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(252,69,31,0.3)]"
            >
              <span>{t("hero_cta", { fallback: "Explorar" })}</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick search tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {QUICK_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleQuick(term)}
                className="rounded-full border border-white/25 bg-white/[0.08] px-4 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/20 hover:border-white/50 transition-all backdrop-blur-md"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: compact stats strip */}
      <div
        className="animate-slide-up relative z-30 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 lg:pb-12 flex items-center justify-start pointer-events-auto"
        style={{ animationDelay: "400ms", animationFillMode: "both" }}
      >
        <div className="flex items-center gap-4 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 px-5 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex -space-x-2.5">
            {[
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
              "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80",
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
            ].map((imgSrc, i) => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-[#0A0D0C] relative overflow-hidden">
                <Image src={imgSrc} alt="User" fill className="object-cover" />
              </div>
            ))}
          </div>
          <div className="h-4 w-px bg-white/20" />
          <p className="text-sm text-white/80 leading-tight">
            <span className="font-bold text-white">500+</span>{" "}
            {t("hero_travelers", { fallback: t("hero_stats") })}
          </p>
        </div>
      </div>
    </section>
  );
}
