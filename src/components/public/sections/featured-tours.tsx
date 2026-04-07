"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation, useStaggerAnimation } from "@/hooks/use-scroll-animation";

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
  durationHours?: number | null;
  isFeatured: boolean;
  tourType?: string;
  images: { url: string; altEs: string | null; altEn: string | null }[];
  pricing: { basePriceUsdAdult: any; tiers?: { priceUsd: any; isDefault: boolean }[] } | null;
}

const SHOWCASE_BG = "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&q=80";

interface FeaturedToursSectionProps {
  tours: Tour[];
  title?: string;
  subtitle?: string;
}

export function FeaturedToursSection({ tours, title, subtitle }: FeaturedToursSectionProps) {
  const t = useTranslations("home");
  const tt = useTranslations("tours");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isEs = locale === "es";

  const header = useScrollAnimation({ threshold: 0.2 });
  const grid = useStaggerAnimation({ threshold: 0.1 });
  const viewAll = useScrollAnimation({ threshold: 0.3 });

  if (tours.length === 0) return null;

  return (
    <section className="bg-white py-24 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-12 xl:px-16">

        {/* Header - Editorial Style */}
        <div ref={header.ref} className={`${header.isVisible ? "scroll-visible" : "scroll-hidden"} text-center mb-20`}>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-orange mb-3">
            {isEs ? "Experiencias" : "Experiences"}
          </span>
          {title ? (
            <h2 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl leading-tight">
              {title}
              {subtitle && (
                <>
                  <br />
                  <span className="font-serif italic font-normal text-brand-darkRed">{subtitle}</span>
                </>
              )}
            </h2>
          ) : (
            <>
              <h2 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl leading-tight">
                {t("featured_tours_1")}
                <br />
                <span className="font-serif italic font-normal text-brand-darkRed">
                  {t("featured_tours_2")}
                </span>
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-500 font-light leading-relaxed">
                {t("featured_subtitle")}
              </p>
            </>
          )}
        </div>

        {/* Tours Grid */}
        <div ref={grid.ref} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 ${grid.className}`}>
          {tours.slice(0, 6).map((tour) => {
            const name = isEs ? tour.nameEs : tour.nameEn;
            const desc = isEs ? tour.shortDescEs : tour.shortDescEn;
            const image = tour.images[0];
            const price = tour.pricing
              ? (() => {
                  const defaultTier = tour.pricing.tiers?.find((t) => t.isDefault) || tour.pricing.tiers?.[0];
                  const raw = defaultTier ? Number(defaultTier.priceUsd) : Number(tour.pricing.basePriceUsdAdult);
                  return isFinite(raw) ? raw : null;
                })()
              : null;

            return (
              <Link key={tour.id} href={`/tours/${tour.slug}`} className="flex flex-col group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-gray-100 mb-5">
                  {image ? (
                    <Image
                      src={image.url}
                      alt={(isEs ? image.altEs : image.altEn) || name}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-gray-300 font-light">No image</span>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-brand-darkRed mb-2 leading-tight line-clamp-2 group-hover:text-brand-orange transition-colors">
                  {name}
                </h3>
                <p className="text-[14px] text-gray-500 line-clamp-2 leading-relaxed font-light flex-grow mb-5">
                  {desc}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  {tour.tourType === "INFORMATIONAL" ? (
                    <span className="text-sm font-medium text-gray-400">
                      {tt("informational")}
                    </span>
                  ) : price ? (
                    <p className="text-lg font-bold text-brand-darkRed">
                      ${price.toFixed(0)}{" "}
                      <span className="text-[13px] font-light text-gray-500">
                        / {tt("per_person")}
                      </span>
                    </p>
                  ) : <span />}

                  <Button
                    variant="outline"
                    className="rounded-full border-gray-200 hover:border-brand-orange hover:bg-brand-orange hover:text-white px-5 h-10 font-medium transition-all group-hover:shadow-[0_4px_14px_rgba(252,69,31,0.2)]"
                  >
                    {tt("book_now")}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All Button */}
        <div ref={viewAll.ref} className={`mt-20 text-center ${viewAll.isVisible ? "scroll-visible" : "scroll-hidden"}`}>
          <Button
            variant="ghost"
            size="lg"
            className="rounded-full border border-brand-darkRed/20 text-brand-darkRed hover:bg-brand-darkRed hover:text-white px-10 h-14 font-semibold transition-all text-[15px]"
            asChild
          >
            <Link href="/tours">
              {tc("view_more")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
