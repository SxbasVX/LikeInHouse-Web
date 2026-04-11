"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  MapPin, Clock, Star, Calendar, Check, X, Users,
  ChevronLeft, ChevronRight, ChevronDown, Mountain,
  Share2, ShoppingCart, ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { useCartStore, useCartHydration } from "@/lib/cart-store";
import { useToast } from "@/hooks/use-toast";
import { formatDuration } from "@/lib/utils";
import { TourConditions } from "@/components/public/tour-conditions";

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

interface PricingTier {
  id: string;
  labelEs: string;
  labelEn: string;
  ageMin: number | null;
  ageMax: number | null;
  priceUsd: any;
  isDefault: boolean;
}

interface Pricing {
  basePriceUsdAdult: any;
  basePriceUsdChild: any;
  tiers?: PricingTier[];
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
  durationHours?: number | null;
  isFeatured: boolean;
  tourType?: string;
  bookingMode?: string;
  images: TourImage[];
  itinerary: ItineraryDay[];
  pricing: Pricing | null;
  includes: TourInclude[];
  conditions?: { id: string; type: string; textEs: string; textEn: string }[];
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const cartHydrated = useCartHydration();
  const { addItem, removeItem, isInCart } = useCartStore();
  const { toast } = useToast();
  const inCart = cartHydrated ? isInCart(tour.id) : false;

  const name = isEs ? tour.nameEs : tour.nameEn;
  const shortDesc = isEs ? tour.shortDescEs : (tour.shortDescEn || tour.shortDescEs);
  const desc = isEs ? tour.longDescEs : (tour.longDescEn || tour.longDescEs);
  // Prefer tiers over legacy fields
  const defaultTier = tour.pricing?.tiers?.find((t) => t.isDefault) || tour.pricing?.tiers?.[0];
  const price = defaultTier ? Number(defaultTier.priceUsd) : (tour.pricing ? Number(tour.pricing.basePriceUsdAdult) : null);
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
      const n = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "51984123456").replace(/\D/g, "");
      const tourName = isEs ? tour.nameEs : tour.nameEn;
      const dateText = selectedDate
        ? ` para el ${new Date(selectedDate).toLocaleDateString(isEs ? "es-PE" : "en-US", { day: "numeric", month: "long", year: "numeric" })}`
        : "";
      const msg = isEs
        ? `Hola, me interesa el tour: ${tourName}${dateText}`
        : `Hi, I'm interested in the tour: ${tourName}${dateText}`;
      window.open(`https://wa.me/${n}?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  const handleCart = () => {
    if (inCart) {
      removeItem(tour.id);
      toast({ title: tCart("removed_from_cart") });
    } else {
      const priceVal = price;
      addItem({
        id: tour.id, slug: tour.slug, nameEs: tour.nameEs, nameEn: tour.nameEn,
        destination: tour.destination, durationDays: tour.durationDays,
        durationNights: tour.durationNights, durationHours: tour.durationHours ?? null,
        imageUrl: tour.images[0]?.url || null,
        priceUsd: priceVal && isFinite(priceVal) ? priceVal : null,
        originalPriceUsd: priceVal && isFinite(priceVal) ? priceVal : null,
        discountPercent: 0,
        promoLabel: null,
        tourType: tour.tourType || "BOOKABLE",
      });
      toast({ title: tCart("added_to_cart") });
    }
  };

  return (
    <>
    <div>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div className="relative -mt-20 h-[62vh] min-h-[480px] w-full overflow-hidden">

        {/* Imagen */}
        {tour.images.length > 0 ? (
          <img
            src={tour.images[currentImage]?.url}
            alt={(isEs ? tour.images[currentImage]?.altEs : tour.images[currentImage]?.altEn) || name}
            className="h-full w-full object-cover cursor-pointer"
            onClick={() => { setLightboxIndex(currentImage); setLightboxOpen(true); }}
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

              {/* Título principal */}
              <h1 className="font-heading text-3xl font-bold leading-tight text-white drop-shadow-md sm:text-4xl lg:text-5xl">
                {name}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/75 leading-relaxed">
                {shortDesc}
              </p>
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
              { icon: <Clock className="h-5 w-5 text-brand-orange" />, label: t("duration_label"), value: formatDuration(tour.durationDays, tour.durationNights, tour.durationHours) },
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
                <div className="animate-fade-in space-y-5">
                  <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("description")}</h2>
                    <p className="text-gray-600 leading-relaxed text-[15px] whitespace-pre-line">{desc}</p>
                  </div>
                  {tour.conditions && tour.conditions.length > 0 && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                      <TourConditions
                        conditions={tour.conditions as any}
                        isEs={isEs}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Itinerario — línea de tiempo */}
              {activeTab === "itinerary" && tour.itinerary.length > 0 && (
                <div className="animate-fade-in">
                  {tour.itinerary.map((day, idx) => {
                    const isOpen = expandedDays.has(day.dayNumber);
                    const isLast = idx === tour.itinerary.length - 1;
                    return (
                      <div key={day.id} className="flex gap-4">
                        {/* Columna izquierda: círculo + línea */}
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => toggleDay(day.dayNumber)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-sm font-bold text-white shadow-md hover:bg-brand-darkRed transition-colors z-10"
                          >
                            {day.dayNumber}
                          </button>
                          {!isLast && (
                            <div className="mt-1 w-px flex-1 bg-gray-200 min-h-[24px]" />
                          )}
                        </div>

                        {/* Columna derecha: contenido */}
                        <div className={`flex-1 pb-6 ${isLast ? "" : ""}`}>
                          <button
                            onClick={() => toggleDay(day.dayNumber)}
                            className="flex w-full items-center justify-between text-left pt-1.5"
                          >
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wider text-brand-orange">
                                {t("day")} {day.dayNumber}
                              </span>
                              <p className="font-semibold text-gray-900 text-base leading-snug mt-0.5">
                                {isEs ? day.titleEs : (day.titleEn || day.titleEs)}
                              </p>
                            </div>
                            <ChevronDown className={`ml-3 h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>

                          {isOpen && (
                            <p className="mt-3 text-sm text-gray-500 leading-relaxed border-l-2 border-brand-orange/30 pl-3">
                              {isEs ? day.descriptionEs : (day.descriptionEn || day.descriptionEs)}
                            </p>
                          )}
                        </div>
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
                        setLightboxIndex(i);
                        setLightboxOpen(true);
                      }}
                      className={`group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl ${i === currentImage ? "ring-2 ring-brand-orange ring-offset-2" : ""}`}
                      role="button" tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter") { setLightboxIndex(i); setLightboxOpen(true); } }}
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
              <div className="sticky top-24 space-y-3">

                {/* ── Card principal de reserva ── */}
                <div className="overflow-hidden rounded-3xl bg-white shadow-md border border-gray-100">

                  {/* Precio + tarifas */}
                  <div className="px-6 pt-6 pb-4">
                    {tour.tourType !== "INFORMATIONAL" && price ? (
                      <>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">{t("from_price")}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-semibold text-gray-400 leading-none">{currency}</span>
                          <span className="font-heading text-5xl font-bold text-brand-orange leading-none">{price.toFixed(0)}</span>
                          <span className="text-sm text-gray-400 ml-1">/ {t("per_person")}</span>
                        </div>
                        {/* Tarifas por categoría */}
                        {tour.pricing?.tiers && tour.pricing.tiers.length > 1 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {tour.pricing.tiers.map((tier) => {
                              const tierPrice = Number(tier.priceUsd);
                              const tierLabel = isEs ? tier.labelEs : tier.labelEn;
                              return (
                                <span
                                  key={tier.id}
                                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                    tier.isDefault
                                      ? "bg-brand-orange/10 text-brand-orange"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {tierLabel} · {currency}{tierPrice.toFixed(0)}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-medium text-gray-600">{t("contact_for_info")}</p>
                    )}
                  </div>

                  {/* Separador */}
                  <div className="mx-6 border-t border-gray-100" />

                  {/* Selector de fecha / salidas — DENTRO de la card, antes del CTA */}
                  {tour.tourType !== "INFORMATIONAL" && (
                    <div className="px-6 py-4">
                      {/* Modo CALENDAR o BOTH: date picker — guarda fecha, NO redirige */}
                      {(tour.bookingMode === "CALENDAR" || tour.bookingMode === "BOTH") && (
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                            <Calendar className="h-3.5 w-3.5 text-brand-teal" />
                            {isEs ? "¿Cuándo quieres ir?" : "When do you want to go?"}
                          </label>
                          <input
                            type="date"
                            min={new Date().toISOString().split("T")[0]}
                            value={selectedDate}
                            className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 font-medium focus:border-brand-teal focus:bg-white focus:outline-none transition-all"
                            onChange={(e) => setSelectedDate(e.target.value)}
                          />
                          {selectedDate ? (
                            <p className="text-[11px] text-brand-teal flex items-center gap-1 font-medium">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-teal" />
                              {isEs ? "Fecha seleccionada — haz clic en Reservar" : "Date selected — click Reserve to continue"}
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-400">
                              {isEs ? "Selecciona una fecha para continuar" : "Pick a date to continue"}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Modo DEPARTURES o BOTH: lista de salidas */}
                      {(tour.bookingMode === "DEPARTURES" || tour.bookingMode === "BOTH") && tour.departures.length > 0 && (
                        <div className={`space-y-2 ${tour.bookingMode === "BOTH" ? "mt-4 pt-4 border-t border-gray-100" : ""}`}>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-brand-orange" />
                            {t("departures")}
                          </p>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {tour.departures.slice(0, 5).map((dep) => {
                              const available = dep.maxCapacity - dep.bookedCount;
                              return (
                                <div key={dep.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-sm">
                                  <span className="text-gray-700 font-medium">
                                    {new Date(dep.departureDate).toLocaleDateString(
                                      isEs ? "es-PE" : "en-US",
                                      { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }
                                    )}
                                  </span>
                                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                    available <= 3 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"
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
                  )}

                  {/* Separador */}
                  <div className="mx-6 border-t border-gray-100" />

                  {/* CTAs */}
                  <div className="px-6 py-5 space-y-2.5">
                    {tour.tourType === "INFORMATIONAL" ? (
                      <Link
                        href="/contacto"
                        className="flex items-center justify-between w-full rounded-2xl bg-brand-darkRed hover:bg-brand-orange text-white pl-5 pr-2 py-3 text-sm font-bold transition-all group shadow-sm"
                      >
                        {t("contact_us")}
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 group-hover:bg-white group-hover:text-brand-darkRed transition-colors">
                          <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                        </span>
                      </Link>
                    ) : (
                      <Link
                        href={`/tours/${tour.slug}/reservar${selectedDate ? `?date=${selectedDate}` : ""}`}
                        className="flex items-center justify-between w-full rounded-2xl bg-brand-darkRed hover:bg-brand-orange text-white pl-5 pr-2 py-3 text-sm font-bold transition-all group shadow-sm"
                      >
                        {t("book_now")}
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 group-hover:bg-white group-hover:text-brand-darkRed transition-colors">
                          <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                        </span>
                      </Link>
                    )}

                    {/* Agregar al carrito */}
                    <button
                      onClick={handleCart}
                      className={`w-full flex items-center justify-center gap-2 rounded-2xl border-2 py-2.5 text-sm font-semibold transition-all ${
                        inCart
                          ? "border-brand-teal/40 bg-brand-teal/8 text-brand-darkTeal"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {inCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                      {inCart ? tCart("in_cart") : tCart("add_to_cart")}
                    </button>
                  </div>
                </div>

                {/* ── Detalles del tour — card secundaria limpia ── */}
                <div className="rounded-3xl bg-white border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {[
                    { icon: <Clock className="h-4 w-4 text-brand-teal" />, label: t("duration_label"), value: formatDuration(tour.durationDays, tour.durationNights, tour.durationHours) },
                    { icon: <Mountain className="h-4 w-4 text-brand-teal" />, label: t("difficulty_label"), value: t(`difficulty_${tour.difficulty.toLowerCase()}`) },
                    { icon: <MapPin className="h-4 w-4 text-brand-teal" />, label: t("destination"), value: tour.destination },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3.5 text-sm">
                      <span className="flex items-center gap-2 text-gray-400">{row.icon}{row.label}</span>
                      <span className="font-semibold text-gray-800">{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* ── Compartir — discreto, al final ── */}
                <div className="flex items-center justify-between px-1">
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium py-2 px-3 rounded-full hover:bg-gray-100"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.118 1.528 5.845L.057 23.617a.75.75 0 0 0 .92.92l5.772-1.471A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.658-.523-5.166-1.43l-.37-.22-3.827.976.991-3.618-.242-.373A9.957 9.957 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    </span>
                    WhatsApp
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium py-2 px-3 rounded-full hover:bg-gray-100"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {isEs ? "Compartir" : "Share"}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ── LIGHTBOX ──────────────────────────────────────────── */}
    {lightboxOpen && tour.images.length > 0 && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
        onClick={() => setLightboxOpen(false)}
      >
        <button
          onClick={() => setLightboxOpen(false)}
          className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <span className="absolute top-5 left-5 text-sm text-white/60">
          {lightboxIndex + 1} / {tour.images.length}
        </span>

        {tour.images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => (p === 0 ? tour.images.length - 1 : p - 1)); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => (p === tour.images.length - 1 ? 0 : p + 1)); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        <img
          src={tour.images[lightboxIndex]?.url}
          alt={(isEs ? tour.images[lightboxIndex]?.altEs : tour.images[lightboxIndex]?.altEn) || name}
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
    </>
  );
}
