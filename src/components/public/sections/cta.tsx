"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import Image from "next/image";

const CTA_BG = "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1600&q=80";

export function CTASection() {
  const t = useTranslations("home");

  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src={CTA_BG}
          alt="Peru landscape"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="animate-slide-up font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl leading-tight">
            {t("cta")}
          </h2>
          <p className="animate-slide-up mt-4 text-lg text-white/80" style={{ animationDelay: "100ms" }}>
            {t("cta_subtitle")}
          </p>
          <div className="animate-slide-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "200ms" }}>
            <Button
              size="lg"
              className="rounded-full bg-white text-gray-900 hover:bg-white/90 font-semibold px-8 shadow-lg"
              asChild
            >
              <Link href="/contacto">
                <MessageCircle className="mr-2 h-4 w-4" />
                {t("cta_button")}
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/30 text-white hover:bg-white/10 font-semibold px-8"
              asChild
            >
              <Link href="/tours">
                {t("hero_cta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
