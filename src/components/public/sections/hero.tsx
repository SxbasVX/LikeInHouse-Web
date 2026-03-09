"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/90 to-primary py-24 text-white lg:py-32">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="animate-slide-up text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          {t("hero_title")}
        </h1>
        <p className="animate-slide-up mx-auto mt-4 max-w-2xl text-lg text-white/90 sm:text-xl" style={{ animationDelay: "100ms" }}>
          {t("hero_subtitle")}
        </p>
        <div className="animate-slide-up mt-8 flex justify-center gap-4" style={{ animationDelay: "200ms" }}>
          <Button size="lg" variant="secondary" className="transition-transform hover:scale-105" asChild>
            <Link href="/tours">{t("hero_cta")}</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white/10 transition-transform hover:scale-105"
            asChild
          >
            <Link href="/contacto">{t("cta_button")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
