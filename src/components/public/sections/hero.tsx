"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
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
    <section className="relative -mt-[100px] min-h-screen lg:min-h-[110vh] overflow-hidden bg-[#0A0D0C] flex flex-col justify-between">
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

      {/* Hero Center Typography */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 w-full mt-24 lg:mt-32 pointer-events-none">
        <div className="animate-slide-down inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-1.5 backdrop-blur-md mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-orange animate-pulse" />
          <span className="text-xs uppercase tracking-[0.2em] text-brand-beige">{t("hero_badge", { fallback: "Explora Perú como en casa" })}</span>
        </div>

        <h1 className="animate-slide-up flex flex-col font-heading text-5xl sm:text-7xl lg:text-[7rem] font-light leading-[1.05] tracking-tight text-white drop-shadow-2xl" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <span className="block text-white/90">{t("hero_title_1")}</span>
          <span className="block font-serif italic font-normal text-brand-beige transform -rotate-1 my-1 lg:my-0 lg:-ml-12 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
            {t("hero_title_2")}
          </span>
          <span className="block text-white/90">{t("hero_title_3")}</span>
        </h1>
      </div>

      {/* Bottom Layout */}
      <div className="relative z-30 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-10 lg:pb-16 flex flex-col lg:flex-row items-end justify-between gap-8 lg:gap-10">

        {/* Left Side: Glass Info Box */}
        <div className="animate-slide-up w-full lg:max-w-[24rem] p-7 lg:p-9 rounded-[2rem] lg:rounded-[2.5rem] bg-white/[0.03] backdrop-blur-[20px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] pointer-events-auto" style={{ animationDelay: "250ms", animationFillMode: "both" }}>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex -space-x-3">
               {[
                 "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
                 "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80",
                 "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
                 "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
               ].map((imgSrc, i) => (
                  <div key={i} className="h-11 w-11 rounded-full border-[2px] border-[#161b19] relative overflow-hidden">
                     <Image src={imgSrc} alt="User" fill className="object-cover" />
                  </div>
                ))}
            </div>
            <p className="text-xs font-medium text-white/80 leading-snug">
              <span className="text-white font-bold block text-[15px] mb-0.5">500+</span>
              {t("hero_stats")}
            </p>
          </div>

          <p className="text-white/70 text-[14px] leading-relaxed font-light mb-7">
             {t("hero_subtitle")}
          </p>

          <Button
            onClick={() => router.push('/tours')}
            className="w-full lg:w-auto h-12 lg:h-14 rounded-full bg-brand-orange hover:bg-[#e33e1a] text-white px-7 lg:px-8 text-[14px] font-semibold flex items-center justify-between lg:justify-center gap-3 lg:gap-4 transition-all hover:scale-105 shadow-[0_0_20px_rgba(252,69,31,0.3)] group"
          >
            <span>{t("hero_cta")}</span>
            <div className="bg-white/20 rounded-full p-2 group-hover:bg-white group-hover:text-brand-orange transition-all duration-300">
             <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
            </div>
          </Button>
        </div>

        {/* Right Side: Search Bar */}
        <div className="animate-slide-up w-full lg:max-w-[30rem] pointer-events-auto" style={{ animationDelay: "350ms", animationFillMode: "both" }}>
          <p className="text-white/50 text-xs uppercase tracking-widest mb-3 font-medium">
            {t("search_placeholder", { fallback: "Buscar destino, tour o actividad..." })}
          </p>

          <form onSubmit={handleSearch} className="flex items-center gap-2 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/15 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div className="flex-1 flex items-center gap-3 pl-3">
              <Search className="h-5 w-5 text-white/40 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search_placeholder", { fallback: "Destino, tour o actividad..." })}
                className="flex-1 bg-transparent text-white placeholder:text-white/40 text-[15px] outline-none py-2 min-w-0"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 h-12 w-12 rounded-xl bg-brand-orange hover:bg-[#e33e1a] flex items-center justify-center text-white transition-all hover:scale-105 shadow-[0_0_16px_rgba(252,69,31,0.4)]"
            >
              <ArrowUpRight className="h-5 w-5" />
            </button>
          </form>

          {/* Quick search tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleQuick(term)}
                className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-xs text-white/70 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-md"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
