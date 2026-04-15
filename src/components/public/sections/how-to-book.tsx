"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowUpRight } from "lucide-react";
import { useStaggerAnimation, useScrollAnimation } from "@/hooks/use-scroll-animation";

const STEPS = [1, 2, 3] as const;

export function HowToBookSection() {
  const t = useTranslations("home");
  const titleAnim = useScrollAnimation({ threshold: 0.1 });
  const stepsAnim = useStaggerAnimation({ threshold: 0.1 });

  return (
    <section className="bg-brand-darkRed py-20 lg:py-28 overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">

        {/* Título */}
        <div
          ref={titleAnim.ref}
          className={`${titleAnim.isVisible ? "scroll-visible" : "scroll-hidden"} mb-16`}
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-orange mb-3">
            {t("htb_badge")}
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white uppercase tracking-tight leading-tight">
            {t("htb_title")}
          </h2>
        </div>

        {/* Steps */}
        <div
          ref={stepsAnim.ref}
          className={`relative grid gap-10 sm:grid-cols-3 ${stepsAnim.className}`}
        >
          {/* Línea conectora — solo desktop */}
          <div
            className="hidden sm:block absolute top-6 left-0 right-0 h-px bg-white/20 pointer-events-none"
            style={{ top: "24px" }}
            aria-hidden
          />

          {STEPS.map((n) => (
            <div key={n} className="relative flex flex-col gap-5">
              {/* Círculo numerado */}
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange text-white text-lg font-bold shadow-lg shadow-brand-orange/30 shrink-0">
                {n}
              </div>

              {/* Texto */}
              <div>
                <p className="text-base font-bold text-white mb-2">
                  {t(`htb_step${n}_title`)}
                </p>
                <p className="text-[15px] text-white/65 leading-relaxed">
                  {t(`htb_step${n}_desc`)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          ref={titleAnim.ref}
          className="mt-14 flex justify-start"
        >
          <Link
            href="/contacto"
            className="inline-flex items-center justify-between rounded-full bg-brand-orange hover:bg-[#e33e1a] text-white pl-6 pr-1.5 py-1.5 text-sm font-bold transition-all group shadow-lg shadow-brand-orange/30"
          >
            {t("htb_cta")}
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 group-hover:bg-white group-hover:text-brand-orange transition-colors ml-3">
              <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
            </span>
          </Link>
        </div>

      </div>
    </section>
  );
}
