"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Tour {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  shortDescEs: string;
  shortDescEn: string;
  destination: string;
  category: string;
  difficulty: string;
  durationDays: number;
  durationNights: number;
  isFeatured: boolean;
  tourType?: string;
  images: { url: string; altEs: string | null; altEn: string | null }[];
  pricing: { basePriceUsdAdult: any } | null;
}

const SHOWCASE_BG = "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80";

export function FeaturedToursSection({ tours }: { tours: Tour[] }) {
  const t = useTranslations("home");
  const tt = useTranslations("tours");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isEs = locale === "es";

  if (tours.length === 0) return null;

  return (
    <section className="bg-gray-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="animate-slide-up text-center mb-14">
          <h2 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
            {t("featured_tours")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 sm:text-lg">
            {t("featured_subtitle")}
          </p>
        </div>

        {/* Asymmetric Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          {/* Left: Tall showcase card */}
          <div className="lg:col-span-4 lg:row-span-2">
            <div className="relative h-full min-h-[400px] overflow-hidden rounded-3xl lg:min-h-0">
              <Image
                src={tours[0]?.images[0]?.url || SHOWCASE_BG}
                alt="Peru adventures"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                <h3 className="font-heading text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                  {t("showcase_title")}
                </h3>
                <Button
                  className="mt-4 rounded-full bg-white text-gray-900 hover:bg-white/90 font-semibold px-6"
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

          {/* Right: Tour cards 2x2 grid */}
          {tours.slice(0, 4).map((tour) => {
            const name = isEs ? tour.nameEs : tour.nameEn;
            const desc = isEs ? tour.shortDescEs : tour.shortDescEn;
            const image = tour.images[0];
            const price = tour.pricing
              ? (() => {
                  const raw = Number(tour.pricing.basePriceUsdAdult);
                  return isFinite(raw) ? raw : null;
                })()
              : null;

            return (
              <div key={tour.id} className="lg:col-span-4">
                <Link href={`/tours/${tour.slug}`} className="group block">
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
                    {/* Image */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {image ? (
                        <Image
                          src={image.url}
                          alt={(isEs ? image.altEs : image.altEn) || name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100">
                          <span className="text-gray-300">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5">
                      <h3 className="text-base font-bold text-gray-900 line-clamp-1 group-hover:text-brand-orange transition-colors sm:text-lg">
                        {name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{desc}</p>

                      <div className="mt-3 flex items-center justify-between">
                        {tour.tourType === "INFORMATIONAL" ? (
                          <span className="text-sm text-gray-400">
                            {isEs ? "Solo informativo" : "Info only"}
                          </span>
                        ) : price ? (
                          <p className="text-base font-bold text-gray-900">
                            ${price.toFixed(0)}{" "}
                            <span className="text-sm font-normal text-gray-400">
                              / {tt("per_person")}
                            </span>
                          </p>
                        ) : null}

                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition-colors group-hover:border-brand-orange group-hover:text-brand-orange">
                          {tt("book_now")}
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* View All */}
        <div className="animate-fade-in mt-12 text-center" style={{ animationDelay: "300ms" }}>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full border-gray-300 px-8 font-semibold hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
            asChild
          >
            <Link href="/tours">
              {tc("view_more")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
