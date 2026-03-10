"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";
import Image from "next/image";

const HERO_BG = "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1920&q=80";

const FLOATING_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=400&q=80",
    alt: "Machu Picchu sunrise",
    title: "Sacred Valley",
    subtitle: "Explore ancient Inca trails and breathtaking mountain views.",
  },
  {
    src: "https://images.unsplash.com/photo-1531065208531-4036c0dba3ca?w=400&q=80",
    alt: "Rainbow Mountain",
    title: "Rainbow Mountain",
    subtitle: "Trek to one of Peru's most colorful natural wonders.",
  },
  {
    src: "https://images.unsplash.com/photo-1571536802086-159b3a365cf6?w=400&q=80",
    alt: "Lake Titicaca",
    title: "Lake Titicaca",
    subtitle: "Discover floating islands and indigenous cultures.",
  },
  {
    src: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400&q=80",
    alt: "Cusco streets",
    title: "Cusco Colonial",
    subtitle: "Walk through centuries of history in every cobblestone.",
  },
];

export function HeroSection() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/tours?search=${encodeURIComponent(trimmed)}`);
  }

  return (
    <section className="relative -mt-[100px] min-h-screen overflow-hidden bg-[#1c1a17]">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={HERO_BG}
          alt="Peru landscape"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-20 pb-40 sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="animate-slide-down mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 backdrop-blur-sm border border-white/20">
          <span className="text-sm font-medium text-white">{t("hero_badge")}</span>
        </div>

        {/* Title */}
        <h1 className="animate-slide-up font-heading text-center text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl">
          {t("hero_title")}
        </h1>

        {/* Subtitle */}
        <p
          className="animate-slide-up mx-auto mt-5 max-w-2xl text-center text-base text-white/80 sm:text-lg lg:text-xl"
          style={{ animationDelay: "100ms" }}
        >
          {t("hero_subtitle")}
        </p>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="animate-slide-up mx-auto mt-8 flex w-full max-w-xl items-center gap-2 rounded-full bg-white/95 p-1.5 shadow-2xl backdrop-blur-sm"
          style={{ animationDelay: "150ms" }}
        >
          <Search className="ml-4 h-5 w-5 shrink-0 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            className="flex-1 bg-transparent px-2 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          <Button type="submit" size="lg" className="rounded-full bg-brand-orange hover:bg-brand-orange/90 px-6 text-white shadow-lg">
            {tc("search")}
          </Button>
        </form>

        {/* CTA Buttons */}
        <div
          className="animate-slide-up mt-6 flex flex-wrap justify-center gap-3"
          style={{ animationDelay: "250ms" }}
        >
          <Button
            size="lg"
            className="rounded-full bg-white text-gray-900 hover:bg-white/90 shadow-lg px-8 font-semibold"
            asChild
          >
            <Link href="/tours">
              {t("hero_cta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 font-semibold"
            asChild
          >
            <Link href="/contacto">{t("cta_button")}</Link>
          </Button>
        </div>

        {/* Social Proof */}
        <div
          className="animate-fade-in mt-10 flex items-center gap-3"
          style={{ animationDelay: "400ms" }}
        >
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-9 w-9 rounded-full border-2 border-white bg-gradient-to-br from-brand-teal to-brand-orange"
              />
            ))}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white">500+</p>
            <p className="text-xs text-white/70">{t("hero_travelers")}</p>
          </div>
        </div>
      </div>

      {/* Floating Image Cards */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-8 scrollbar-hide sm:gap-4">
            {FLOATING_IMAGES.map((img, i) => (
              <div
                key={i}
                className="animate-slide-up group relative min-w-[200px] flex-1 overflow-hidden rounded-2xl shadow-2xl sm:min-w-[220px] sm:rounded-3xl"
                style={{ animationDelay: `${300 + i * 100}ms` }}
              >
                <div className="relative aspect-[3/4] sm:aspect-[3/4]">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 200px, 280px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                    <h3 className="text-sm font-bold text-white sm:text-base">{img.title}</h3>
                    <p className="mt-0.5 text-xs text-white/70 line-clamp-2 hidden sm:block">{img.subtitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
