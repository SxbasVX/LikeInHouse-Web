"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export function CTASection() {
  const t = useTranslations("home");

  return (
    <section className="bg-primary py-16 text-white lg:py-20">
      <div className="animate-slide-up mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold sm:text-4xl">{t("cta")}</h2>
        <p className="mt-4 text-lg text-white/90">{t("cta_subtitle")}</p>
        <div className="mt-8 flex justify-center gap-4">
          <Button size="lg" variant="secondary" className="transition-transform hover:scale-105" asChild>
            <Link href="/contacto">{t("cta_button")}</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white/10 transition-transform hover:scale-105"
            asChild
          >
            <Link href="/tours">{t("hero_cta")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
