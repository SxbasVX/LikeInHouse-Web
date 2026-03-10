"use client";

import { useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const GALLERY_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&q=80",
    titleEs: "Cusco Mágico",
    titleEn: "Magical Cusco",
    descEs: "Descubre la magia de la antigua capital del imperio Inca.",
    descEn: "Discover the magic of the ancient Inca empire capital.",
  },
  {
    src: "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=600&q=80",
    titleEs: "Valle Sagrado",
    titleEn: "Sacred Valley",
    descEs: "Recorre paisajes andinos con historia milenaria.",
    descEn: "Explore Andean landscapes with millennia of history.",
  },
  {
    src: "https://images.unsplash.com/photo-1531065208531-4036c0dba3ca?w=600&q=80",
    titleEs: "Montaña de Colores",
    titleEn: "Rainbow Mountain",
    descEs: "Una maravilla natural a más de 5,000 metros de altitud.",
    descEn: "A natural wonder at over 5,000 meters altitude.",
  },
  {
    src: "https://images.unsplash.com/photo-1571536802086-159b3a365cf6?w=600&q=80",
    titleEs: "Lago Titicaca",
    titleEn: "Lake Titicaca",
    descEs: "Islas flotantes y culturas ancestrales únicas en el mundo.",
    descEn: "Floating islands and unique ancestral cultures.",
  },
  {
    src: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600&q=80",
    titleEs: "Calles de Cusco",
    titleEn: "Cusco Streets",
    descEs: "Camina por siglos de historia en cada calle empedrada.",
    descEn: "Walk through centuries of history on every cobblestone.",
  },
  {
    src: "https://images.unsplash.com/photo-1548820845-85c0f07e9ad2?w=600&q=80",
    titleEs: "Selva Amazónica",
    titleEn: "Amazon Rainforest",
    descEs: "Aventura en la selva más biodiversa del planeta.",
    descEn: "Adventure in the most biodiverse jungle on the planet.",
  },
];

export function GalleryCarousel() {
  const t = useTranslations("home");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const updateProgress = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    setProgress(el.scrollLeft / maxScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.6;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    setTimeout(updateProgress, 400);
  };

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="animate-slide-up text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 mb-6">
            <span className="text-sm font-medium text-gray-700">{t("gallery_badge")}</span>
            <Compass className="h-4 w-4 text-brand-orange" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
            {t("gallery_title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 sm:text-lg">
            {t("gallery_subtitle")}
          </p>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          onScroll={updateProgress}
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-4 sm:gap-5"
        >
          {GALLERY_IMAGES.map((img, i) => (
            <div
              key={i}
              className="group relative min-w-[260px] flex-shrink-0 overflow-hidden rounded-2xl sm:min-w-[300px] lg:min-w-[320px]"
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={img.src}
                  alt={img.titleEs}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 260px, 320px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <h3 className="text-base font-bold text-white">{img.titleEs}</h3>
                  <p className="mt-1 text-xs text-white/80 line-clamp-2">{img.descEs}</p>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-white">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-gray-200"
            onClick={() => scroll("left")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Progress Bar */}
          <div className="h-1 w-40 overflow-hidden rounded-full bg-gray-200 sm:w-60">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-300"
              style={{ width: `${Math.max(20, progress * 100)}%` }}
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-gray-200"
            onClick={() => scroll("right")}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
