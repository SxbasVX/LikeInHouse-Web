"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const CTA_BG = "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1600&q=80";

export function CTASection() {
  const t = useTranslations("home");
  const section = useScrollAnimation({ threshold: 0.15 });

  return (
    <section className="bg-white py-12 lg:py-16 px-4 sm:px-6 lg:px-12 xl:px-16 overflow-hidden">
      <div ref={section.ref} className={`${section.isVisible ? "scroll-visible-scale" : "scroll-hidden-scale"} mx-auto max-w-[1600px] relative overflow-hidden rounded-[2.5rem] shadow-2xl min-h-[500px] lg:min-h-[600px] flex items-center justify-center p-8 lg:p-16 group`}>
        
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src={CTA_BG}
            alt="Peru magic landscape"
            fill
            className="object-cover transition-transform duration-[20s] ease-linear group-hover:scale-105"
            sizes="(max-width: 1600px) 100vw, 1600px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl text-center flex flex-col items-center">
          <h2 className="font-heading text-4xl font-medium text-white sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight drop-shadow-lg">
            {t("cta_title_1")}
            <br className="hidden sm:block" />
            {" "}<span className="font-serif italic font-normal text-brand-beige">
               {t("cta_title_2")}
            </span>{" "}
            <br className="sm:hidden" />
            {t("cta_title_3")}
          </h2>
          
          <p className="mt-6 max-w-2xl text-[15px] sm:text-lg text-white/90 font-light leading-relaxed drop-shadow-md">
            {t("cta_subtitle")}
          </p>
          
          <div className="mt-10">
            <Link
              href="/contacto"
              className="inline-flex h-14 items-center justify-center gap-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-xl pl-8 pr-2.5 transition-all hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.2)] group/btn"
            >
              <span className="text-white text-base font-medium">
                {t("cta_button")}
              </span>
              <div className="flex items-center justify-center h-10 w-10 shrink-0 bg-white rounded-full text-brand-darkRed transition-transform group-hover/btn:bg-brand-orange group-hover/btn:text-white shadow-sm">
                 <ArrowUpRight className="h-5 w-5 group-hover/btn:rotate-12 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
        
      </div>
    </section>
  );
}
