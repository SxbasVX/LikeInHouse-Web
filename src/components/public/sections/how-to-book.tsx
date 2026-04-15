"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowUpRight, MousePointerClick, Sparkles } from "lucide-react";
import { useScrollAnimation, useStaggerAnimation } from "@/hooks/use-scroll-animation";

export function HowToBookSection() {
  const t = useTranslations("home");
  const titleAnim  = useScrollAnimation({ threshold: 0.1 });
  const cardsAnim  = useStaggerAnimation({ threshold: 0.1 });

  return (
    <section className="bg-brand-darkRed py-20 lg:py-28 overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">

        {/* Título */}
        <div
          ref={titleAnim.ref}
          className={`${titleAnim.isVisible ? "scroll-visible" : "scroll-hidden"} text-center mb-14`}
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-orange mb-3">
            {t("htb_badge")}
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white uppercase tracking-tight leading-tight">
            {t("htb_title")}
          </h2>
          <p className="mt-4 text-white/60 text-lg font-light max-w-xl mx-auto">
            {t("htb_subtitle")}
          </p>
        </div>

        {/* Dos cards */}
        <div
          ref={cardsAnim.ref}
          className={`grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto ${cardsAnim.className}`}
        >
          {/* Card 1 — Reserva en línea */}
          <div className="group relative flex flex-col rounded-3xl bg-white/8 border border-white/10 p-8 hover:bg-white/12 hover:border-brand-orange/40 transition-all duration-300">
            {/* Número */}
            <span className="text-[80px] font-bold leading-none text-white/5 absolute top-4 right-6 select-none group-hover:text-white/8 transition-colors">
              01
            </span>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-orange/15 border border-brand-orange/30 mb-6 group-hover:bg-brand-orange/25 transition-colors">
              <MousePointerClick className="h-6 w-6 text-brand-orange" />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-orange mb-3">
              {t("htb_path1_badge")}
            </p>
            <h3 className="text-xl font-bold text-white mb-3 font-heading">
              {t("htb_path1_title")}
            </h3>
            <p className="text-white/60 text-[15px] leading-relaxed flex-1">
              {t("htb_path1_desc")}
            </p>

            {/* Pasos inline */}
            <ol className="mt-6 space-y-2">
              {(["htb_path1_s1", "htb_path1_s2", "htb_path1_s3"] as const).map((key, i) => (
                <li key={key} className="flex items-center gap-3 text-[13px] text-white/50">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange/20 text-brand-orange text-[11px] font-bold">
                    {i + 1}
                  </span>
                  {t(key)}
                </li>
              ))}
            </ol>

            <Link
              href="/tours"
              className="mt-8 inline-flex items-center justify-between self-start rounded-full bg-brand-orange hover:bg-[#e33e1a] text-white pl-5 pr-1.5 py-1.5 text-sm font-bold transition-all group/btn shadow-lg shadow-brand-orange/20"
            >
              {t("htb_path1_cta")}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 group-hover/btn:bg-white group-hover/btn:text-brand-orange transition-colors ml-3">
                <ArrowUpRight className="h-4 w-4 group-hover/btn:rotate-12 transition-transform" />
              </span>
            </Link>
          </div>

          {/* Card 2 — Viaje personalizado */}
          <div className="group relative flex flex-col rounded-3xl bg-white/8 border border-white/10 p-8 hover:bg-white/12 hover:border-white/25 transition-all duration-300">
            <span className="text-[80px] font-bold leading-none text-white/5 absolute top-4 right-6 select-none group-hover:text-white/8 transition-colors">
              02
            </span>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/15 mb-6 group-hover:bg-white/15 transition-colors">
              <Sparkles className="h-6 w-6 text-white" />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-3">
              {t("htb_path2_badge")}
            </p>
            <h3 className="text-xl font-bold text-white mb-3 font-heading">
              {t("htb_path2_title")}
            </h3>
            <p className="text-white/60 text-[15px] leading-relaxed flex-1">
              {t("htb_path2_desc")}
            </p>

            <ol className="mt-6 space-y-2">
              {(["htb_path2_s1", "htb_path2_s2", "htb_path2_s3"] as const).map((key, i) => (
                <li key={key} className="flex items-center gap-3 text-[13px] text-white/50">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/60 text-[11px] font-bold">
                    {i + 1}
                  </span>
                  {t(key)}
                </li>
              ))}
            </ol>

            <a
              href="https://wa.me/51913406888"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center justify-between self-start rounded-full bg-white/15 hover:bg-white text-white hover:text-brand-darkRed border border-white/20 pl-5 pr-1.5 py-1.5 text-sm font-bold transition-all group/btn"
            >
              {t("htb_path2_cta")}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 group-hover/btn:bg-brand-darkRed group-hover/btn:text-white transition-colors ml-3">
                <ArrowUpRight className="h-4 w-4 group-hover/btn:rotate-12 transition-transform" />
              </span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
