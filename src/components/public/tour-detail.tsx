"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  MapPin, Clock, Star, Calendar, Check, X, Users,
  ChevronLeft, ChevronRight, ChevronDown, Mountain,
  Share2, ShoppingCart, ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { useToast } from "@/hooks/use-toast";

interface TourImage {
  id: string;
  url: string;
  altEs: string | null;
  altEn: string | null;
}

interface ItineraryDay {
  id: string;
  dayNumber: number;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
}

interface TourInclude {
  id: string;
  type: string;
  textEs: string;
  textEn: string;
}

interface Departure {
  id: string;
  departureDate: string | Date;
  status: string;
  maxCapacity: number;
  bookedCount: number;
}

interface Pricing {
  basePriceUsdAdult: any;
  basePriceUsdChild: any;
}

interface TourData {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  shortDescEs: string;
  shortDescEn: string;
  longDescEs: string;
  longDescEn: string;
  destination: string;
  category: string;
  difficulty: string;
  durationDays: number;
  durationNights: number;
  isFeatured: boolean;
  tourType?: string;
  images: TourImage[];
  itinerary: ItineraryDay[];
  pricing: Pricing | null;
  includes: TourInclude[];
  departures: Departure[];
  seasons: any[];
}

export function TourDetail({ tour }: { tour: TourData }) {
  const t = useTranslations("tours");
  const tc = useTranslations("common");
  const tCart = useTranslations("cart");
  const locale = useLocale();
  const isEs = locale === "es";
  const [currentImage, setCurrentImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "itinerary" | "includes" | "gallery">("overview");
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const { addItem, removeItem, isInCart } = useCartStore();
  const { toast } = useToast();
  const inCart = isInCart(tour.id);

  const name = isEs ? tour.nameEs : tour.nameEn;
  const shortDesc = isEs ? tour.shortDescEs : (tour.shortDescEn || tour.shortDescEs);
  const desc = isEs ? tour.longDescEs : (tour.longDescEn || tour.longDescEs);
  const price = tour.pricing ? Number(tour.pricing.basePriceUsdAdult) : null;
  const childPrice = tour.pricing ? Number(tour.pricing.basePriceUsdChild) : null;
  const currency = "$";

  const included = tour.includes.filter((i) => i.type === "INCLUDED");
  const excluded = tour.includes.filter((i) => i.type === "EXCLUDED");

  const toggleDay = (dayNumber: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNumber)) next.delete(dayNumber);
      else next.add(dayNumber);
      return next;
    });
  };

  const tabs = [
    { key: "overview" as const, label: t("overview") },
    ...(tour.itinerary.length > 0 ? [{ key: "itinerary" as const, label: t("itinerary") }] : []),
    ...(included.length > 0 || excluded.length > 0 ? [{ key: "includes" as const, label: t("includes") }] : []),
    ...(tour.images.length > 1 ? [{ key: "gallery" as const, label: t("gallery") }] : []),
  ];

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // User cancelled share dialog
    }
  };

  const handleAddToCart = () => {
    if (inCart) {
      removeItem(tour.id);
      toast({ title: tCart("removed_from_cart") });
    } else {
      const priceVal = tour.pricing ? Number(tour.pricing.basePriceUsdAdult) : null;
      addItem({
        id: tour.id,
        slug: tour.slug,
        nameEs: tour.nameEs,
        nameEn: tour.nameEn,
        destination: tour.destination,
        durationDays: tour.durationDays,
        durationNights: tour.durationNights,
        imageUrl: tour.images[0]?.url || null,
        priceUsd: priceVal && isFinite(priceVal) ? priceVal : null,
        tourType: tour.tourType || "BOOKABLE",
      });
      toast({ title: tCart("added_to_cart") });
    }
  };

  const handleWhatsApp = () => {
    if (typeof window !== "undefined") {
      const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "51984123456";
      window.open(
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola, me interesa el tour: ${tour.nameEs}`)}`,
        "_blank"
      );
    }
  };

  return (
    <div className="bg-[#0A0D0C]">
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative -mt-20 min-h-[92vh] overflow-hidden flex flex-col">

        {/* Background image */}
        <div className="absolute inset-0 z-0">
          {tour.images.length > 0 ? (
            <img
              src={tour.images[currentImage]?.url}
              alt={(isEs ? tour.images[currentImage]?.altEs : tour.images[currentImage]?.altEn) || name}
              className="h-full w-full object-cover transition-opacity duration-700"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-brand-darkRed/40 to-brand-darkTeal/20" />
          )}
          {/* Cinematic overlay matching landing page */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0D0C]/65 via-black/35 to-[#0A0D0C]/90" />
        </div>

        {/* Gallery prev/next */}
        {tour.images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImage((p) => (p === 0 ? tour.images.length - 1 : p - 1))}
              className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentImage((p) => (p === tour.images.length - 1 ? 0 : p + 1))}
              className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Hero content */}
        <div className="relative z-10 flex flex-1 flex-col justify-end px-4 pb-14 pt-32 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">

            {/* Breadcrumb pill */}
            <nav className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-1.5 backdrop-blur-md text-xs text-white/70">
              <Link href="/" className="hover:text-white transition-colors">{t("breadcrumb_home")}</Link>
              <span className="text-white/30">/</span>
              <Link href="/tours" className="hover:text-white transition-colors">{tc("tours")}</Link>
              <span className="text-white/30">/</span>
              <Link href={`/tours?destination=${encodeURIComponent(tour.destination)}`} className="hover:text-white transition-colors">{tour.destination}</Link>
              <span className="text-white/30">/</span>
              <span className="text-white/90 truncate max-w-[160px]">{name}</span>
            </nav>

            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              {/* Left: title block */}
              <div className="max-w-3xl">
                {/* Badges */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-md">
                    <Mountain className="h-3 w-3" />
                    {t(`difficulty_${tour.difficulty.toLowerCase()}`)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-md">
                    {tour.category}
                  </span>
                  {tour.isFeatured && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-white">
                      <Star className="h-3 w-3" /> Destacado
                    </span>
                  )}
                  {tour.tourType === "INFORMATIONAL" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-teal/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                      {t("informational")}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1
                  className="font-heading text-4xl font-light leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[4.5rem]"
                  style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}
                >
                  {name}
                </h1>

                {/* Subtitle */}
                <p className="mt-4 max-w-xl text-base text-white/70 leading-relaxed">
                  {shortDesc}
                </p>

                {/* Stats strip */}
                <div className="mt-6 flex items-center gap-4 rounded-2xl border border-white/15 bg-black/50 px-5 py-3 backdrop-blur-xl w-fit">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Clock className="h-4 w-4 text-brand-orange shrink-0" />
                    <span>{tour.durationDays}d / {tour.durationNights}n</span>
                  </div>
                  <div className="h-4 w-px bg-white/20" />
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <MapPin className="h-4 w-4 text-brand-orange shrink-0" />
                    <span>{tour.destination}</span>
                  </div>
                  <div className="h-4 w-px bg-white/20" />
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Users className="h-4 w-4 text-brand-orange shrink-0" />
                    <span>{tour.tourType === "INFORMATIONAL" ? t("informational") : t("bookable")}</span>
                  </div>
                </div>
              </div>

              {/* Right: price + CTA */}
              {tour.tourType !== "INFORMATIONAL" && price ? (
                <div className="shrink-0 rounded-3xl border border-white/15 bg-black/55 p-6 backdrop-blur-xl lg:min-w-[220px] lg:text-right">
                  <p className="text-xs uppercase tracking-widest text-white/50 mb-1">{t("from_price")}</p>
                  <p className="font-heading text-5xl font-light text-white leading-none">
                    <span className="text-2xl align-top mt-2 inline-block mr-1">{currency}</span>
                    {price.toFixed(0)}
                  </p>
                  <p className="text-xs text-white/50 mt-1">/ {t("per_person")}</p>
                  {childPrice && childPrice > 0 && (
                    <p className="text-xs text-white/40 mt-0.5">{t("child_price")}: {currency}{childPrice.toFixed(0)}</p>
                  )}
                  <Link
                    href={`/tours/${tour.slug}/reservar`}
                    className="mt-4 inline-flex w-full items-center justify-between rounded-full bg-brand-darkRed hover:bg-brand-orange text-white pl-5 pr-1.5 py-1.5 text-sm font-semibold transition-all group shadow-lg"
                  >
                    {t("book_now")}
                    <div className="flex items-center justify-center bg-white/20 rounded-full h-8 w-8 group-hover:bg-white group-hover:text-brand-darkRed transition-colors duration-300">
                      <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                    </div>
                  </Link>
                </div>
              ) : tour.tourType === "INFORMATIONAL" ? (
                <div className="shrink-0 rounded-3xl border border-white/15 bg-black/55 p-6 backdrop-blur-xl">
                  <p className="text-sm text-white/60 mb-4">{t("contact_for_info")}</p>
                  <Link
                    href="/contacto"
                    className="inline-flex w-full items-center justify-between rounded-full bg-brand-darkRed hover:bg-brand-orange text-white pl-5 pr-1.5 py-1.5 text-sm font-semibold transition-all group shadow-lg"
                  >
                    {t("contact_us")}
                    <div className="flex items-center justify-center bg-white/20 rounded-full h-8 w-8 group-hover:bg-white group-hover:text-brand-darkRed transition-colors duration-300">
                      <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                    </div>
                  </Link>
                </div>
              ) : null}
            </div>

            {/* Gallery dots */}
            {tour.images.length > 1 && (
              <div className="mt-8 flex gap-1.5">
                {tour.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`h-1.5 rounded-full transition-all ${i === currentImage ? "w-8 bg-brand-orange" : "w-1.5 bg-white/30 hover:bg-white/60"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="bg-[#F7F4EF] min-h-screen">
        <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-3">

            {/* ── LEFT: Tabs + Content ─────────────────────────── */}
            <div className="lg:col-span-2 space-y-8">

              {/* Tab Navigation */}
              <div className="flex gap-0 border-b border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative px-5 py-3.5 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? "text-brand-darkRed"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab: Overview */}
              {activeTab === "overview" && (
                <div className="animate-fade-in">
                  <h2 className="font-heading text-2xl font-light text-brand-darkRed mb-4">{t("description")}</h2>
                  <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">
                    {desc}
                  </p>
                </div>
              )}

              {/* Tab: Itinerary */}
              {activeTab === "itinerary" && tour.itinerary.length > 0 && (
                <div className="animate-fade-in space-y-3">
                  <h2 className="font-heading text-2xl font-light text-brand-darkRed mb-6">{t("itinerary")}</h2>
                  {tour.itinerary.map((day) => {
                    const isOpen = expandedDays.has(day.dayNumber);
                    return (
                      <div
                        key={day.id}
                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-sm"
                      >
                        <div
                          onClick={() => toggleDay(day.dayNumber)}
                          className="flex w-full items-center justify-between p-5 text-left cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === "Enter") toggleDay(day.dayNumber); }}
                        >
                          <div className="flex items-center gap-4">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange text-xs font-bold text-white shadow-sm">
                              {day.dayNumber}
                            </span>
                            <span className="font-medium text-gray-800">
                              {t("day")} {day.dayNumber}:{" "}
                              <span className="font-semibold">{isEs ? day.titleEs : (day.titleEn || day.titleEs)}</span>
                            </span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </div>
                        {isOpen && (
                          <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                            <p className="text-sm text-gray-500 leading-relaxed pl-[52px]">
                              {isEs ? day.descriptionEs : (day.descriptionEn || day.descriptionEs)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab: Includes/Excludes */}
              {activeTab === "includes" && (
                <div className="animate-fade-in">
                  <h2 className="font-heading text-2xl font-light text-brand-darkRed mb-6">{t("includes")}</h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {included.length > 0 && (
                      <div className="rounded-2xl border border-brand-teal/20 bg-white p-6">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-brand-darkTeal text-sm uppercase tracking-wider">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal/10">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          {t("includes")}
                        </h3>
                        <ul className="space-y-2.5">
                          {included.map((item) => (
                            <li key={item.id} className="flex items-start gap-2.5 text-sm text-gray-600">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" />
                              <span>{isEs ? item.textEs : (item.textEn || item.textEs)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {excluded.length > 0 && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-6">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-500 text-sm uppercase tracking-wider">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                            <X className="h-3.5 w-3.5" />
                          </span>
                          {t("excludes")}
                        </h3>
                        <ul className="space-y-2.5">
                          {excluded.map((item) => (
                            <li key={item.id} className="flex items-start gap-2.5 text-sm text-gray-500">
                              <X className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                              <span>{isEs ? item.textEs : (item.textEn || item.textEs)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Gallery */}
              {activeTab === "gallery" && tour.images.length > 1 && (
                <div className="animate-fade-in">
                  <h2 className="font-heading text-2xl font-light text-brand-darkRed mb-6">{t("gallery")}</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {tour.images.map((img, i) => (
                      <div
                        key={img.id}
                        onClick={() => {
                          setCurrentImage(i);
                          if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`group relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer ${i === currentImage ? "ring-2 ring-brand-orange" : ""}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter") setCurrentImage(i); }}
                      >
                        <img
                          src={img.url}
                          alt={(isEs ? img.altEs : img.altEn) || name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15 rounded-2xl" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Sidebar ────────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">

                {/* Reservation card */}
                <div className="overflow-hidden rounded-3xl bg-white shadow-xl border border-gray-100">

                  {/* Card header */}
                  <div className="bg-brand-darkRed px-6 py-5">
                    <p className="text-xs uppercase tracking-widest text-white/60 mb-0.5">
                      {tour.tourType === "INFORMATIONAL" ? (isEs ? "Tour informativo" : "Informational tour") : t("book_now")}
                    </p>
                    {tour.tourType !== "INFORMATIONAL" && price ? (
                      <div className="flex items-baseline gap-1">
                        <span className="font-heading text-4xl font-light text-white">{currency} {price.toFixed(0)}</span>
                        <span className="text-sm text-white/50">/ {t("per_person")}</span>
                      </div>
                    ) : (
                      <p className="text-white/80 text-sm">{t("contact_for_info")}</p>
                    )}
                    {childPrice && childPrice > 0 && (
                      <p className="text-xs text-white/40 mt-1">{t("child_price")}: {currency} {childPrice.toFixed(0)}</p>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-6 space-y-5">
                    {/* Details */}
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                        <span className="text-gray-400 flex items-center gap-2"><Clock className="h-4 w-4" /> {t("duration_label")}</span>
                        <span className="font-medium text-gray-800">{tour.durationDays}d / {tour.durationNights}n</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                        <span className="text-gray-400 flex items-center gap-2"><Mountain className="h-4 w-4" /> {t("difficulty_label")}</span>
                        <span className="font-medium text-gray-800">{t(`difficulty_${tour.difficulty.toLowerCase()}`)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-gray-400 flex items-center gap-2"><MapPin className="h-4 w-4" /> {t("destination")}</span>
                        <span className="font-medium text-gray-800">{tour.destination}</span>
                      </div>
                    </div>

                    {/* Primary CTA */}
                    {tour.tourType === "INFORMATIONAL" ? (
                      <Link
                        href="/contacto"
                        className="inline-flex w-full items-center justify-between rounded-full bg-brand-darkRed hover:bg-brand-orange text-white pl-5 pr-1.5 py-1.5 text-sm font-semibold transition-all group shadow-sm"
                      >
                        {t("contact_us")}
                        <div className="flex items-center justify-center bg-white/20 rounded-full h-8 w-8 group-hover:bg-white group-hover:text-brand-darkRed transition-colors duration-300">
                          <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                        </div>
                      </Link>
                    ) : (
                      <Link
                        href={`/tours/${tour.slug}/reservar`}
                        className="inline-flex w-full items-center justify-between rounded-full bg-brand-darkRed hover:bg-brand-orange text-white pl-5 pr-1.5 py-1.5 text-sm font-semibold transition-all group shadow-sm"
                      >
                        {t("book_now")}
                        <div className="flex items-center justify-center bg-white/20 rounded-full h-8 w-8 group-hover:bg-white group-hover:text-brand-darkRed transition-colors duration-300">
                          <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                        </div>
                      </Link>
                    )}

                    {/* Secondary: Cart */}
                    <button
                      onClick={handleAddToCart}
                      className={`w-full flex items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-medium transition-all ${
                        inCart
                          ? "border-brand-teal/30 bg-brand-teal/8 text-brand-darkTeal"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                      }`}
                    >
                      {inCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                      {inCart ? tCart("in_cart") : tCart("add_to_cart")}
                    </button>

                    {/* Tertiary: WhatsApp + Share */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleWhatsApp}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-gray-200 py-2 text-xs font-medium text-gray-500 hover:border-gray-300 hover:text-gray-800 transition-all"
                      >
                        {t("whatsapp")}
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-1.5 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 hover:border-gray-300 hover:text-gray-800 transition-all"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upcoming Departures */}
                {tour.tourType !== "INFORMATIONAL" && tour.departures.length > 0 && (
                  <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-800 text-sm">
                      <Calendar className="h-4 w-4 text-brand-orange" />
                      {t("departures")}
                    </h3>
                    <div className="space-y-2">
                      {tour.departures.slice(0, 5).map((dep) => {
                        const available = dep.maxCapacity - dep.bookedCount;
                        return (
                          <div
                            key={dep.id}
                            className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-sm"
                          >
                            <span className="flex items-center gap-2 text-gray-600">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              {new Date(dep.departureDate).toLocaleDateString(
                                isEs ? "es-PE" : "en-US",
                                { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }
                              )}
                            </span>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                available <= 3
                                  ? "bg-red-100 text-red-600"
                                  : "bg-brand-teal/10 text-brand-darkTeal"
                              }`}
                            >
                              {available} {t("spots")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
