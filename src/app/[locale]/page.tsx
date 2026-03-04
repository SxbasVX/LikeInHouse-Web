"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { trpc } from "@/lib/trpc";
import { TourCard } from "@/components/public/tour-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ArrowRight, Quote } from "lucide-react";

export default function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isEs = locale === "es";

  const { data: tours, isLoading: toursLoading } = trpc.public.featuredTours.useQuery();
  const { data: testimonials } = trpc.public.testimonials.useQuery();

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/90 to-primary py-24 text-white lg:py-32">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {t("hero_title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90 sm:text-xl">
            {t("hero_subtitle")}
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/tours">{t("hero_cta")}</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/contacto">{t("cta_button")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Tours */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t("featured_tours")}</h2>
            <p className="mt-2 text-muted-foreground">{t("featured_subtitle")}</p>
          </div>

          {toursLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-lg" />
              ))}
            </div>
          ) : tours && tours.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              {tc("no_results")}
            </p>
          )}

          <div className="mt-10 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/tours">
                {tc("view_more")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section className="bg-gray-50 py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">{t("testimonials")}</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.slice(0, 3).map((test) => (
                <Card key={test.id} className="relative">
                  <CardContent className="pt-6">
                    <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/10" />
                    <div className="mb-3 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < test.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                      &ldquo;{isEs ? test.textEs : (test.textEn || test.textEs)}&rdquo;
                    </p>
                    <div>
                      <p className="font-medium text-sm">{test.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {test.country}
                        {test.tourName && ` | ${test.tourName}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-primary py-16 text-white lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("cta")}</h2>
          <p className="mt-4 text-lg text-white/90">{t("cta_subtitle")}</p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contacto">{t("cta_button")}</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/tours">{t("hero_cta")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
