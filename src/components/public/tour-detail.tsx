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
    } catch { /* cancelled */ }
  };

  const handleWhatsApp = () => {
    if (typeof window !== "undefined") {
      const n = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "51984123456";
      window.open(`https://wa.me/${n}?text=${encodeURIComponent(`Hola, me interesa el tour: ${tour.nameEs}`)}`, "_blank");
    }
  };

  const handleCart = () => {
    if (inCart) {
      removeItem(tour.id);
      toast({ title: tCart("removed_from_cart") });
    } else {
      const priceVal = tour.pricing ? Number(tour.pricing.basePriceUsdAdult) : null;
      addItem({
        id: tour.id, slug: tour.slug, nameEs: tour.nameEs, nameEn: tour.nameEn,
        destination: tour.destination, durationDays: tour.durationDays,
        durationNights: tour.durationNights, imageUrl: tour.images[0]?.url || null,
        priceUsd: priceVal && isFinite(priceVal) ? priceVal : null,
        tourType: tour.tourType || "BOOKABLE",
      });
      toast({ title: tCart("added_to_cart") });
    }
  };

  return (
    <div>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div className="relative -mt-20 h-[62vh] min-h-[480px] w-full overflow-hidden">

        {/* Imagen */}
        {tour.images.length > 0 ? (
          <img
            src={tour.images[currentImage]?.url}
            alt={(isEs ? tour.images[currentImage]?.altEs : tour.images[currentImage]?.altEn) || name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gray-200" />
        )}

        {/* Overlay: solo oscurecer base y zona del texto — la imagen respira */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />

        {/* Flechas de galería */}
        {tour.images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImage((p) => (p === 0 ? tour.images.length - 1 : p - 1))}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/35 p-2.5 text-white backdrop-blur-sm hover:bg-black/55 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentImage((p) => (p === tour.images.length - 1 ? 0 : p + 1))}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/35 p-2.5 text-white backdrop-blur-sm hover:bg-black/55 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Contenido sobre el hero */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">

            {/* Breadcrumb */}
            <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-white/65">
              <Link href="/" className="hover:text-white transition-colors">{t("breadcrumb_home")}</Link>
              <span>/</span>
              <Link href="/tours" className="hover:text-white transition-colors">{tc("tours")}</Link>
              <span>/</span>
              <Link href={`/tours?destination=${encodeURIComponent(tour.destination)}`} className="hover:text-white transition-colors">{tour.destination}</Link>
              <span>/</span>
              <span className="text-white/90">{name}</span>
            </nav>

            <div className="flex flex-wrap items-end justify-between gap-6">
              {/* Izquierda: badges + título */}
              <div>
                {/* Badges */}
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {tour.category}
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm flex items-center gap-1">
                    <Mountain className="h-3 w-3" />
                    {t(`difficulty_${tour.difficulty.toLowerCase()}`)}
                  </span>
                  {tour.isFeatured && (
                    <span className="rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-white flex items-center gap-1">
                      <Star className="h-3 w-3" /> Destacado
                    </span>
                  )}
                </div>

                {/* Título principal — jerarquía máxima */}
                <h1 className="font-heading text-3xl font-bold leading-tight text-white drop-shadow-md sm:text-4xl lg:text-5xl">
                  {name}
                </h1>
                <p className="mt-2 max-w-xl text-sm text-white/75 leading-relaxed">
                  {shortDesc}
                </p>
              </div>

              {/* Derecha: precio hero (solo desktop) */}
              {tour.tourType !== "INFORMATIONAL" && price && (
                <div className="hidden lg:block shrink-0 rounded-2xl bg-black/50 px-6 py-4 backdrop-blur-md text-right">
                  <p className="text-xs uppercase tracking-widest text-white/50 mb-0.5">{t("from_price")}</p>
                  <p className="font-heading text-4xl font-bold text-white leading-none">
                    {currency} {price.toFixed(0)}
                  </p>
                  <p className="text-xs text-white/45 mt-0.5">/ {t("per_person")}</p>
                </div>
              )}
            </div>

            {/* Dots galería */}
            {tour.images.length > 1 && (
              <div className="mt-5 flex gap-1.5">
                {tour.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`h-1.5 rounded-full transition-all ${i === currentImage ? "w-7 bg-brand-orange" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BARRA DE STATS ──────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-2 divide-x divide-gray-100 sm:grid-cols-4">
            {[
              { icon: <Clock className="h-5 w-5 text-brand-orange" />, label: t("duration_label"), value: `${tour.durationDays}d / ${tour.durationNights}n` },
              { icon: <Mountain className="h-5 w-5 text-brand-orange" />, label: t("difficulty_label"), value: t(`difficulty_${tour.difficulty.toLowerCase()}`) },
              { icon: <MapPin className="h-5 w-5 text-brand-orange" />, label: t("destination"), value: tour.destination },
              { icon: <Users className="h-5 w-5 text-brand-orange" />, label: t("tour_type"), value: tour.tourType === "INFORMATIONAL" ? t("informational") : t("bookable") },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-4 sm:px-6">
                {item.icon}
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ─────────────────────────────────── */}
      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-3">

            {/* ── COLUMNA IZQUIERDA: Tabs + Contenido ─────────── */}
            <div className="lg:col-span-2">

              {/* Tabs */}
              <div className="mb-8 flex gap-0 border-b border-gray-200 bg-transparent">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? "text-gray-900"
                        : "text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-brand-orange" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab: Resumen */}
              {activeTab === "overview" && (
                <div className="animate-fade-in rounded-2xl bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("description")}</h2>
                  <p className="text-gray-600 leading-relaxed text-[15px] whitespace-pre-line">{desc}</p>
                </div>
              )}

              {/* Tab: Itinerario */}
              {activeTab === "itinerary" && tour.itinerary.length > 0 && (
                <div className="animate-fade-in space-y-2">
                  {tour.itinerary.map((day) => {
                    const isOpen = expandedDays.has(day.dayNumber);
                    return (
                      <div key={day.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                        <div
                          onClick={() => toggleDay(day.dayNumber)}
                          className="flex w-full cursor-pointer items-center justify-between p-5 text-left"
                          role="button" tabIndex={0}
                          onKeyDown={(e) => { if (e.key === "Enter") toggleDay(day.dayNumber); }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-orange text-xs font-bold text-white">
                              {day.dayNumber}
                            </span>
                            <span className="font-semibold text-gray-800">
                              {t("day")} {day.dayNumber}: {isEs ? day.titleEs : (day.titleEn || day.titleEs)}
                            </span>
                          </div>
                          <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                        {isOpen && (
                          <div className="border-t border-gray-100 px-5 pb-5 pt-3">
                            <p className="pl-11 text-sm text-gray-500 leading-relaxed">
                              {isEs ? day.descriptionEs : (day.descriptionEn || day.descriptionEs)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab: Incluye */}
              {activeTab === "includes" && (
                <div className="animate-fade-in grid gap-4 sm:grid-cols-2">
                  {included.length > 0 && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-teal">
                        <Check className="h-4 w-4" /> {t("includes")}
                      </h3>
                      <ul className="space-y-2.5">
                        {included.map((item) => (
                          <li key={item.id} className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" />
                            {isEs ? item.textEs : (item.textEn || item.textEs)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {excluded.length > 0 && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-400">
                        <X className="h-4 w-4" /> {t("excludes")}
                      </h3>
                      <ul className="space-y-2.5">
                        {excluded.map((item) => (
                          <li key={item.id} className="flex items-start gap-2 text-sm text-gray-500">
                            <X className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                            {isEs ? item.textEs : (item.textEn || item.textEs)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Galería */}
              {activeTab === "gallery" && tour.images.length > 1 && (
                <div className="animate-fade-in grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {tour.images.map((img, i) => (
                    <div
                      key={img.id}
                      onClick={() => {
                        setCurrentImage(i);
                        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl ${i === currentImage ? "ring-2 ring-brand-orange ring-offset-2" : ""}`}
                      role="button" tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter") setCurrentImage(i); }}
                    >
                      <img
                        src={img.url}
                        alt={(isEs ? img.altEs : img.altEn) || name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── SIDEBAR ─────────────────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">

                {/* Card de reserva */}
                <div className="overflow-hidden rounded-3xl bg-white shadow-md border border-gray-100">

                  {/* Precio — acento naranja vibrante */}
                  <div className="px-6 py-5 border-b border-gray-100">
                    {tour.tourType !== "INFORMATIONAL" && price ? (
                      <>
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">{t("from_price")}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-gray-400 leading-none">{currency}</span>
                          <span className="font-heading text-5xl font-bold text-brand-orange leading-none">{price.toFixed(0)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">/ {t("per_person")}</p>
                        {childPrice && childPrice > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">{t("child_price")}: {currency} {childPrice.toFixed(0)}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-medium text-gray-600">{t("contact_for_info")}</p>
                    )}
                  </div>

                  {/* Detalles */}
                  <div className="px-6 py-4 space-y-0 divide-y divide-gray-50">
                    {[
                      { icon: <Clock className="h-4 w-4" />, label: t("duration_label"), value: `${tour.durationDays}d / ${tour.durationNights}n` },
                      { icon: <Mountain className="h-4 w-4" />, label: t("difficulty_label"), value: t(`difficulty_${tour.difficulty.toLowerCase()}`) },
                      { icon: <MapPin className="h-4 w-4" />, label: t("destination"), value: tour.destination },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between py-3 text-sm">
                        <span className="flex items-center gap-2 text-gray-400">{row.icon}{row.label}</span>
                        <span className="font-semibold text-gray-800">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTAs */}
                  <div className="px-6 pb-6 pt-2 space-y-3">
                    {/* Botón principal — naranja vibrante */}
                    {tour.tourType === "INFORMATIONAL" ? (
                      <Link
                        href="/contacto"
                        className="flex items-center justify-between w-full rounded-full bg-brand-darkRed hover:bg-brand-orange text-white pl-5 pr-1.5 py-1.5 text-sm font-bold transition-all group shadow-sm"
                      >
                        {t("contact_us")}
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 group-hover:bg-white group-hover:text-brand-darkRed transition-colors">
                          <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                        </span>
                      </Link>
                    ) : (
                      <Link
                        href={`/tours/${tour.slug}/reservar`}
                        className="flex items-center justify-between w-full rounded-full bg-brand-darkRed hover:bg-brand-orange text-white pl-5 pr-1.5 py-1.5 text-sm font-bold transition-all group shadow-sm"
                      >
                        {t("book_now")}
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 group-hover:bg-white group-hover:text-brand-darkRed transition-colors">
                          <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                        </span>
                      </Link>
                    )}

                    {/* Agregar al carrito */}
                    <button
                      onClick={handleCart}
                      className={`w-full flex items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-medium transition-all ${
                        inCart
                          ? "border-brand-teal/40 bg-brand-teal/8 text-brand-darkTeal"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {inCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                      {inCart ? tCart("in_cart") : tCart("add_to_cart")}
                    </button>

                    {/* WhatsApp + Compartir */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleWhatsApp}
                        className="flex-1 rounded-full border border-gray-200 py-2 text-xs font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all"
                      >
                        {t("whatsapp")}
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex items-center justify-center rounded-full border border-gray-200 px-3 py-2 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-all"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Próximas salidas */}
                {tour.tourType !== "INFORMATIONAL" && tour.departures.length > 0 && (
                  <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
                      <Calendar className="h-4 w-4 text-brand-orange" />
                      {t("departures")}
                    </h3>
                    <div className="space-y-1.5">
                      {tour.departures.slice(0, 5).map((dep) => {
                        const available = dep.maxCapacity - dep.bookedCount;
                        return (
                          <div key={dep.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-sm">
                            <span className="flex items-center gap-2 text-gray-600">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              {new Date(dep.departureDate).toLocaleDateString(
                                isEs ? "es-PE" : "en-US",
                                { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }
                              )}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              available <= 3 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                            }`}>
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
