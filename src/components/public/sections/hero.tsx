"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

const HERO_BG = "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1920&q=80";

const FLOATING_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=400&q=80",
    title: "Valle Sagrado",
    subtitle: "Inca Trails",
  },
  {
    src: "https://images.unsplash.com/photo-1531065208531-4036c0dba3ca?w=400&q=80",
    title: "Montaña 7 Colores",
    subtitle: "Natural Wonder",
  },
  {
    src: "https://images.unsplash.com/photo-1571536802086-159b3a365cf6?w=400&q=80",
    title: "Lago Titicaca",
    subtitle: "Floating Islands",
  },
];

export function HeroSection() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const router = useRouter();

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

      {/* Bottom Layout - Glass Panels & Floating Architecture */}
      <div className="relative z-30 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-10 lg:pb-16 flex flex-col lg:flex-row items-end justify-between gap-10">

        {/* Left Side: Luxurious Information Glass Box */}
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

        {/* Right Side: Architectural Floating Cards (Bento Style) */}
        <div className="animate-slide-up hidden md:flex gap-4 lg:gap-5 pointer-events-auto pb-4" style={{ animationDelay: "350ms", animationFillMode: "both" }}>
          {FLOATING_IMAGES.map((img, i) => (
            <div
              key={i}
              className="group relative w-40 lg:w-48 aspect-[3/4] overflow-hidden rounded-[1.5rem] lg:rounded-[2rem] border border-white/10 shadow-2xl cursor-pointer bg-[#0A0D0C] transition-all duration-700 hover:-translate-y-4 hover:border-brand-teal/30"
              onClick={() => router.push('/tours')}
            >
              <Image
                src={img.src}
                alt={img.title}
                fill
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110 opacity-70 group-hover:opacity-100"
                sizes="(max-width: 1024px) 192px, 224px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D0C] via-[#0A0D0C]/20 to-transparent opacity-90 transition-opacity group-hover:opacity-70" />
              
              <div className="absolute inset-x-0 bottom-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                 <p className="text-brand-beige text-[11px] lg:text-xs font-semibold tracking-wider uppercase mb-1 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">{img.subtitle}</p>
                 <h3 className="text-white text-[16px] lg:text-lg font-serif italic drop-shadow-md leading-tight">{img.title}</h3>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
