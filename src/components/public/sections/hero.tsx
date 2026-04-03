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
    <section className="relative -mt-20 min-h-screen overflow-hidden bg-[#0A0D0C] flex flex-col">
      {/* Background Image with stronger overlay for readability */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src={imageUrl || DEFAULT_HERO_BG}
          alt="Peru inmersive landscape"
          fill
          priority
          className="object-cover scale-105 animate-[pulse_40s_ease-in-out_infinite]"
          sizes="100vw"
        />
        {/* Single smooth overlay — uniform readability without banding */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0D0C]/75 via-black/45 to-[#0A0D0C]/95" />
      </div>

      {/* Main centered content */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 w-full pt-28 pb-32 lg:pt-36 lg:pb-40 pointer-events-none">

        {/* Badge — higher contrast */}
        <div className="animate-slide-down inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/40 px-5 py-2 backdrop-blur-md mb-8">
          <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
          <span className="text-sm font-medium tracking-widest uppercase text-white">
            {subtitle || t("hero_badge", { fallback: "Explora Perú como en casa" })}
          </span>
        </div>

        {/* Title — full white, strong text shadow for readability over image */}
        <h1
          className="animate-slide-up flex flex-col font-heading text-5xl sm:text-7xl lg:text-[7rem] font-light leading-[1.05] tracking-tight mb-12 lg:mb-14"
          style={{
            animationDelay: "100ms",
            animationFillMode: "both",
            textShadow: "0 2px 20px rgba(0,0,0,0.6), 0 4px 40px rgba(0,0,0,0.45)",
          }}
        >
          <span className="block text-white">{t("hero_title_1")}</span>
          <span className="block font-serif italic font-normal text-[#f5dfc0] transform -rotate-1 my-1 lg:my-0 lg:-ml-12">
            {t("hero_title_2")}
          </span>
          <span className="block text-white">{t("hero_title_3")}</span>
        </h1>

        {/* Search bar */}
        <div
          className="animate-slide-up pointer-events-auto w-full max-w-3xl"
          style={{ animationDelay: "250ms", animationFillMode: "both" }}
        >
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-0 rounded-2xl bg-white p-2 shadow-[0_12px_50px_rgba(0,0,0,0.6)]"
          >
            <div className="flex-1 flex items-center gap-3 pl-4">
              <Search className="h-5 w-5 text-gray-500 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search_placeholder", { fallback: "Destino, tour o actividad..." })}
                className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-500 text-base lg:text-lg outline-none py-3.5 min-w-0 font-medium"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-brand-orange hover:bg-[#e33e1a] flex items-center gap-2 text-white font-bold transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(252,69,31,0.4)] px-4 py-3.5 sm:px-7 text-base"
            >
              <span className="hidden sm:inline">{t("hero_cta", { fallback: "Explorar" })}</span>
              <ArrowUpRight className="h-5 w-5" />
            </button>
          </form>

          {/* Quick search tags — white solid for max contrast */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {QUICK_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleQuick(term)}
                className="rounded-full border-2 border-white/60 bg-black/50 px-4 py-1.5 text-sm font-medium text-white hover:bg-white hover:text-gray-900 hover:border-white transition-all backdrop-blur-md"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: stats strip */}
      <div
        className="animate-slide-up relative z-30 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 lg:pb-12 flex items-center justify-start pointer-events-auto"
        style={{ animationDelay: "400ms", animationFillMode: "both" }}
      >
        <div className="flex items-center gap-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/20 px-5 py-3">
          <div className="flex -space-x-2.5">
            {[
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
              "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80",
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
            ].map((imgSrc, i) => (
              <div key={i} className="h-9 w-9 rounded-full border-2 border-[#0A0D0C] relative overflow-hidden">
                <Image src={imgSrc} alt="Viajero feliz" fill className="object-cover" />
              </div>
            ))}
          </div>
          <div className="h-5 w-px bg-white/30" />
          <p className="text-base text-white leading-tight">
            <span className="font-bold text-white text-lg">500+</span>{" "}
            {t("hero_travelers", { fallback: t("hero_stats") })}
          </p>
        </div>
      </div>
    </section>
  );
}
