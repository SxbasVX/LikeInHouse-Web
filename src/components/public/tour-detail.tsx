"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Clock, Star, Calendar, Check, X, Users,
  ChevronLeft, ChevronRight, ChevronDown, Mountain,
  Share2, Image as ImageIcon,
} from "lucide-react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";

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
  basePricePenAdult: any;
  basePriceUsdAdult: any;
  basePricePenChild: any;
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

const difficultyColors: Record<string, string> = {
  EASY: "bg-green-100 text-green-800",
  MODERATE: "bg-yellow-100 text-yellow-800",
  CHALLENGING: "bg-red-100 text-red-800",
};

export function TourDetail({ tour }: { tour: TourData }) {
  const t = useTranslations("tours");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isEs = locale === "es";
  const [currentImage, setCurrentImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "itinerary" | "includes" | "gallery">("overview");
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));

  const name = isEs ? tour.nameEs : tour.nameEn;
  const shortDesc = isEs ? tour.shortDescEs : (tour.shortDescEn || tour.shortDescEs);
  const desc = isEs ? tour.longDescEs : (tour.longDescEn || tour.longDescEs);
  const price = tour.pricing
    ? Number(isEs ? tour.pricing.basePricePenAdult : tour.pricing.basePriceUsdAdult)
    : null;
  const childPrice = tour.pricing
    ? Number(isEs ? tour.pricing.basePricePenChild : tour.pricing.basePriceUsdChild)
    : null;
  const currency = isEs ? "S/" : "$";

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

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
        {tour.images.length > 0 ? (
          <>
            <img
              src={tour.images[currentImage]?.url}
              alt={(isEs ? tour.images[currentImage]?.altEs : tour.images[currentImage]?.altEn) || name}
              className="h-full w-full object-cover"
            />
            {tour.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage((p) => (p === 0 ? tour.images.length - 1 : p - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentImage((p) => (p === tour.images.length - 1 ? 0 : p + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {tour.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`h-2 rounded-full transition-all ${i === currentImage ? "w-6 bg-white" : "w-2 bg-white/50"
                        }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Hero content overlay */}
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-12">
          <div className="mx-auto max-w-7xl">
            {/* Breadcrumb */}
            <nav className="mb-3 flex items-center gap-2 text-sm text-white/70">
              <Link href="/" className="hover:text-white transition-colors">
                {t("breadcrumb_home")}
              </Link>
              <span>/</span>
              <Link href="/tours" className="hover:text-white transition-colors">
                {tc("tours")}
              </Link>
              <span>/</span>
              <Link href={`/tours?destination=${encodeURIComponent(tour.destination)}`} className="hover:text-white transition-colors">
                {tour.destination}
              </Link>
              <span>/</span>
              <span className="text-white">{name}</span>
            </nav>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge className={`${difficultyColors[tour.difficulty] || ""} border-0`}>
                    {t(`difficulty_${tour.difficulty.toLowerCase()}`)}
                  </Badge>
                  <Badge variant="secondary" className="border-0 bg-white/20 text-white backdrop-blur-sm">
                    {tour.category}
                  </Badge>
                  {tour.isFeatured && (
                    <Badge className="gap-1 border-0 bg-yellow-500 text-white">
                      <Star className="h-3 w-3" /> Destacado
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                  {name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
                  {shortDesc}
                </p>
              </div>

              {/* Price overlay */}
              {tour.tourType !== "INFORMATIONAL" && price ? (
                <div className="rounded-xl bg-white/15 px-5 py-3 backdrop-blur-md">
                  <span className="block text-xs text-white/70">{t("from_price")}</span>
                  <span className="text-3xl font-bold text-white">
                    {currency} {price.toFixed(0)}
                  </span>
                  <span className="block text-xs text-white/70">/ {t("per_person")}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards Bar */}
      <div className="border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-0 divide-x sm:grid-cols-4">
            <InfoCard
              icon={<Clock className="h-5 w-5 text-primary" />}
              label={t("duration_label")}
              value={`${tour.durationDays} ${t("days")} / ${tour.durationNights} ${t("nights")}`}
            />
            <InfoCard
              icon={<Mountain className="h-5 w-5 text-primary" />}
              label={t("difficulty_label")}
              value={t(`difficulty_${tour.difficulty.toLowerCase()}`)}
            />
            <InfoCard
              icon={<MapPin className="h-5 w-5 text-primary" />}
              label={t("destination")}
              value={tour.destination}
            />
            <InfoCard
              icon={<Users className="h-5 w-5 text-primary" />}
              label={t("tour_type")}
              value={tour.tourType === "INFORMATIONAL" ? t("informational") : t("bookable")}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Tabs + Content */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border bg-muted/50 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === "overview" && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-3">{t("description")}</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {desc}
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Itinerary */}
            {activeTab === "itinerary" && tour.itinerary.length > 0 && (
              <div className="animate-fade-in space-y-3">
                {tour.itinerary.map((day) => {
                  const isOpen = expandedDays.has(day.dayNumber);
                  return (
                    <div
                      key={day.id}
                      className="overflow-hidden rounded-lg border transition-shadow hover:shadow-sm"
                    >
                      <div
                        onClick={() => toggleDay(day.dayNumber)}
                        className="flex w-full items-center justify-between p-4 text-left cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') toggleDay(day.dayNumber) }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {day.dayNumber}
                          </span>
                          <span className="font-semibold text-lg">
                            {t("day")} {day.dayNumber}:{" "}
                            {isEs ? day.titleEs : (day.titleEn || day.titleEs)}
                          </span>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""
                            }`}
                        />
                      </div>
                      {isOpen && (
                        <div className="border-t px-4 pb-4 pt-3">
                          <p className="text-sm text-muted-foreground leading-relaxed pl-11">
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
                <div className="grid gap-6 sm:grid-cols-2">
                  {included.length > 0 && (
                    <div className="rounded-lg border p-5">
                      <h3 className="mb-4 flex items-center gap-2 font-semibold text-green-700">
                        <Check className="h-5 w-5" />
                        {t("includes")}
                      </h3>
                      <ul className="space-y-2.5">
                        {included.map((item) => (
                          <li key={item.id} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                            <span>{isEs ? item.textEs : (item.textEn || item.textEs)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {excluded.length > 0 && (
                    <div className="rounded-lg border p-5">
                      <h3 className="mb-4 flex items-center gap-2 font-semibold text-red-600">
                        <X className="h-5 w-5" />
                        {t("excludes")}
                      </h3>
                      <ul className="space-y-2.5">
                        {excluded.map((item) => (
                          <li key={item.id} className="flex items-start gap-2 text-sm">
                            <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
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
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {tour.images.map((img, i) => (
                    <div
                      key={img.id}
                      onClick={() => {
                        setCurrentImage(i);
                        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="group relative aspect-[4/3] overflow-hidden rounded-lg cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') setCurrentImage(i); }}
                    >
                      <img
                        src={img.url}
                        alt={(isEs ? img.altEs : img.altEn) || name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Reservation Card */}
              <Card className="overflow-hidden border-primary/20 shadow-lg">
                <div className="bg-primary p-4">
                  <h3 className="text-lg font-semibold text-primary-foreground">
                    {tour.tourType === "INFORMATIONAL"
                      ? (isEs ? "Tour Informativo" : "Informational Tour")
                      : t("book_now")}
                  </h3>
                </div>
                <CardContent className="p-5">
                  {tour.tourType === "INFORMATIONAL" ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {t("contact_for_info")}
                      </p>
                      <Link
                        href="/contacto"
                        className={buttonVariants({ variant: "default", size: "lg", className: "w-full" })}
                      >
                        {t("contact_us")}
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {price && (
                        <div>
                          <span className="text-sm text-muted-foreground">{t("from_price")}</span>
                          <div className="text-3xl font-bold text-primary">
                            {currency} {price.toFixed(0)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            / {t("per_person")}
                          </span>
                          {childPrice && childPrice > 0 && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {t("child_price")}: {currency} {childPrice.toFixed(0)}
                            </p>
                          )}
                        </div>
                      )}

                      <Separator />

                      <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("duration_label")}</span>
                          <span className="font-medium">
                            {tour.durationDays}{t("days")} / {tour.durationNights}{t("nights")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("difficulty_label")}</span>
                          <span className="font-medium">
                            {t(`difficulty_${tour.difficulty.toLowerCase()}`)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("category")}</span>
                          <span className="font-medium">{tour.category}</span>
                        </div>
                      </div>

                      <Link
                        href={`/tours/${tour.slug}/reservar`}
                        className={buttonVariants({ variant: "default", size: "lg", className: "w-full" })}
                      >
                        {t("book_now")}
                      </Link>
                    </div>
                  )}

                  <Button
                    className="mt-2 w-full gap-2"
                    variant={tour.tourType === "INFORMATIONAL" ? "outline" : "outline"}
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "51984123456";
                        window.open(
                          `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola, me interesa el tour: ${tour.nameEs}`)}`,
                          "_blank"
                        );
                      }
                    }}
                  >
                    {t("whatsapp")}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full gap-2 text-muted-foreground"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                    {t("share")}
                  </Button>
                </CardContent>
              </Card>

              {/* Upcoming Departures */}
              {tour.tourType !== "INFORMATIONAL" && tour.departures.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold">
                      <Calendar className="h-4 w-4 text-primary" />
                      {t("departures")}
                    </h3>
                    <div className="space-y-2">
                      {tour.departures.slice(0, 5).map((dep) => {
                        const available = dep.maxCapacity - dep.bookedCount;
                        return (
                          <div
                            key={dep.id}
                            className="flex items-center justify-between rounded-md border px-3 py-2.5 text-sm"
                          >
                            <span className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(dep.departureDate).toLocaleDateString(
                                isEs ? "es-PE" : "en-US",
                                { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }
                              )}
                            </span>
                            <Badge
                              variant={available <= 3 ? "destructive" : "outline"}
                              className="text-xs"
                            >
                              {available} {t("spots")}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
