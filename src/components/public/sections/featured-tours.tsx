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
  isFeatured: boolean;
  tourType?: string;
  images: { url: string; altEs: string | null; altEn: string | null }[];
  pricing: { basePriceUsdAdult: any } | null;
}

const SHOWCASE_BG = "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&q=80";

export function FeaturedToursSection({ tours }: { tours: Tour[] }) {
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
          <h2 className="font-heading text-4xl font-light text-brand-darkRed sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.1]">
            {t("featured_tours_1")}{" "}
            <span className="font-serif italic text-brand-teal font-normal">
               {t("featured_tours_2")}
            </span>
            <br className="hidden sm:block" />
            {" "}{t("featured_tours_3")}
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-500 font-light leading-relaxed">
            {t("featured_subtitle")}
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 items-stretch">
          
          {/* Left: Huge Vertical Showcase */}
          <div className="lg:col-span-5 relative group overflow-hidden rounded-[2.5rem] shadow-2xl h-[500px] lg:h-auto min-h-[600px] xl:min-h-[700px]">
            <Image
              src={tours[0]?.images[0]?.url || SHOWCASE_BG}
              alt="Peru adventures"
              fill
              className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />
            
            <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
              <h3 className="font-heading text-4xl lg:text-5xl xl:text-[3.5rem] font-medium leading-[1.05] tracking-tight text-white mb-6">
                {t("showcase_title_1")}
                <br />
                <span className="font-serif italic font-normal text-brand-beige">
                   {t("showcase_title_2")}
                </span>
                <br />
                {t("showcase_title_3")}
              </h3>
            </div>
          </div>

          {/* Right: 2x2 Tours Grid */}
          <div ref={grid.ref} className={`lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-8 ${grid.className}`}>
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
                <div key={tour.id} className="flex flex-col group">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-gray-100 mb-6">
                    {image ? (
                      <Image
                        src={image.url}
                        alt={(isEs ? image.altEs : image.altEn) || name}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-gray-300 font-light">No image</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl lg:text-2xl font-semibold text-brand-darkRed mb-2 group-hover:text-brand-orange transition-colors">
                    {name}
                  </h3>
                  <p className="text-[15px] text-gray-500 line-clamp-2 leading-relaxed font-light flex-grow mb-6">
                    {desc}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    {tour.tourType === "INFORMATIONAL" ? (
                      <span className="text-[15px] font-medium text-gray-400">
                        {tt("informational")}
                      </span>
                    ) : price ? (
                      <p className="text-lg font-bold text-brand-darkRed">
                        ${price.toFixed(0)}{" "}
                        <span className="text-[15px] font-light text-gray-500">
                          / {tt("per_person")}
                        </span>
                      </p>
                    ) : <span />}

                    <Button 
                      variant="outline"
                      className="rounded-full border-gray-200 hover:border-brand-orange hover:bg-brand-orange hover:text-white px-5 h-10 font-medium transition-all group-hover:shadow-[0_4px_14px_rgba(252,69,31,0.2)]"
                      asChild
                    >
                      <Link href={`/tours/${tour.slug}`}>
                        {tt("book_now")}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
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
