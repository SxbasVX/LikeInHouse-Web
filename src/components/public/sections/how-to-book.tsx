"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowUpRight, CheckCircle2, MessageCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { waUrl } from "@/lib/whatsapp";

const STEPS_PATH1 = ["htb_path1_s1", "htb_path1_s2", "htb_path1_s3"] as const;
const STEPS_PATH2 = ["htb_path2_s1", "htb_path2_s2", "htb_path2_s3"] as const;

export function HowToBookSection() {
  const t = useTranslations("home");
  const leftAnim  = useScrollAnimation({ threshold: 0.1 });
  const rightAnim = useScrollAnimation({ threshold: 0.1 });

  return (
    <section className="bg-[#faf8f5] py-20 lg:py-28 overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-teal mb-3">
            {t("htb_badge")}
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl font-light text-brand-darkRed tracking-tight">
            {t("htb_title_1")}{" "}
            <span className="font-serif italic font-normal text-brand-orange">
              {t("htb_title_2")}
            </span>
          </h2>
          <p className="mt-4 text-gray-500 text-lg font-light max-w-xl mx-auto">
            {t("htb_subtitle")}
          </p>
        </div>

        {/* Dos paneles */}
        <div className="grid lg:grid-cols-2 gap-0 rounded-[2rem] overflow-hidden shadow-2xl">

          {/* Panel 1 — Reserva online */}
          <div
            ref={leftAnim.ref}
            className={`${leftAnim.isVisible ? "scroll-visible-left" : "scroll-hidden-left"} relative bg-brand-orange flex flex-col p-10 lg:p-14`}
          >
            {/* Número decorativo */}
            <span className="absolute bottom-6 right-8 text-[160px] font-bold leading-none text-white/10 select-none pointer-events-none">
              1
            </span>

            <div className="relative z-10 flex flex-col h-full">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70 mb-6">
                {t("htb_path1_badge")}
              </p>

              <h3 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                {t("htb_path1_title")}
              </h3>

              <p className="text-white/80 text-[16px] leading-relaxed mb-8">
                {t("htb_path1_desc")}
              </p>

              <ul className="space-y-3 mb-10 flex-1">
                {STEPS_PATH1.map((key) => (
                  <li key={key} className="flex items-center gap-3 text-[15px] text-white/90">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                    {t(key)}
                  </li>
                ))}
              </ul>

              <Link
                href="/tours"
                className="inline-flex items-center justify-between self-start rounded-full bg-white text-brand-orange pl-6 pr-1.5 py-1.5 text-sm font-bold transition-all hover:shadow-xl hover:-translate-y-0.5 group/btn"
              >
                {t("htb_path1_cta")}
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange/10 group-hover/btn:bg-brand-orange group-hover/btn:text-white transition-colors ml-3">
                  <ArrowUpRight className="h-4 w-4 group-hover/btn:rotate-12 transition-transform" />
                </span>
              </Link>
            </div>
          </div>

          {/* Panel 2 — Personalizado */}
          <div
            ref={rightAnim.ref}
            className={`${rightAnim.isVisible ? "scroll-visible-right" : "scroll-hidden-right"} relative bg-brand-darkRed flex flex-col p-10 lg:p-14`}
          >
            {/* Número decorativo */}
            <span className="absolute bottom-6 right-8 text-[160px] font-bold leading-none text-white/5 select-none pointer-events-none">
              2
            </span>

            {/* Línea separadora vertical en desktop */}
            <div className="hidden lg:block absolute left-0 top-10 bottom-10 w-px bg-white/10" />

            <div className="relative z-10 flex flex-col h-full">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-orange mb-6">
                {t("htb_path2_badge")}
              </p>

              <h3 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                {t("htb_path2_title")}
              </h3>

              <p className="text-white/65 text-[16px] leading-relaxed mb-8">
                {t("htb_path2_desc")}
              </p>

              <ul className="space-y-3 mb-10 flex-1">
                {STEPS_PATH2.map((key) => (
                  <li key={key} className="flex items-center gap-3 text-[15px] text-white/80">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-orange" />
                    {t(key)}
                  </li>
                ))}
              </ul>

              <a
                href={waUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between self-start rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white pl-5 pr-1.5 py-1.5 text-sm font-bold transition-all hover:-translate-y-0.5 group/btn"
              >
                <MessageCircle className="h-4 w-4 mr-2 shrink-0" />
                {t("htb_path2_cta")}
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 group-hover/btn:bg-brand-orange transition-colors ml-3">
                  <ArrowUpRight className="h-4 w-4 group-hover/btn:rotate-12 transition-transform" />
                </span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
