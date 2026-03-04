"use client";

import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, Clock, ArrowLeft, Calendar, Users,
  Check, X, Star,
} from "lucide-react";

const difficultyLabels: Record<string, Record<string, string>> = {
  EASY: { es: "Facil", en: "Easy" },
  MODERATE: { es: "Moderado", en: "Moderate" },
  CHALLENGING: { es: "Desafiante", en: "Challenging" },
};

export default function TourDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const t = useTranslations("tours");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isEs = locale === "es";

  const { data: tour, isLoading } = trpc.public.tourBySlug.useQuery({ slug });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-8 h-96 w-full rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">{t("not_found")}</h1>
        <p className="mt-2 text-muted-foreground">{t("not_found_desc")}</p>
        <Button variant="outline" className="mt-6" asChild>
          <Link href="/tours">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tc("back")}
          </Link>
        </Button>
      </div>
    );
  }

  const name = isEs ? tour.nameEs : tour.nameEn;
  const shortDesc = isEs ? tour.shortDescEs : tour.shortDescEn;
  const longDesc = isEs ? tour.longDescEs : tour.longDescEn;
  const includes = tour.includes.filter((i) => i.type === "INCLUDE");
  const excludes = tour.includes.filter((i) => i.type === "EXCLUDE");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back */}
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/tours">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tc("back")}
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold sm:text-4xl">{name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {tour.destination}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {tour.durationDays} {t("days")} / {tour.durationNights} {t("nights")}
          </span>
          <Badge variant="secondary">
            {difficultyLabels[tour.difficulty]?.[locale] || tour.difficulty}
          </Badge>
          <Badge variant="outline">{tour.category}</Badge>
        </div>
      </div>

      {/* Image Gallery */}
      {tour.images.length > 0 && (
        <div className="mb-8 grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {tour.images.map((img, i) => (
            <div
              key={img.id}
              className={`overflow-hidden rounded-lg ${i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}
            >
              <img
                src={img.url}
                alt={(isEs ? img.altEs : img.altEn) || name}
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Description */}
          <div>
            <p className="text-lg text-muted-foreground">{shortDesc}</p>
            <Separator className="my-4" />
            <div className="prose prose-sm max-w-none">
              <p>{longDesc}</p>
            </div>
          </div>

          {/* Itinerary */}
          {tour.itinerary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("itinerary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tour.itinerary.map((day) => (
                  <div key={day.id} className="border-l-2 border-primary/30 pl-4">
                    <h4 className="font-semibold">
                      {t("day")} {day.dayNumber}: {isEs ? day.titleEs : day.titleEn}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isEs ? day.descriptionEs : day.descriptionEn}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Includes / Excludes */}
          <div className="grid gap-6 sm:grid-cols-2">
            {includes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">{t("includes")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {includes.map((inc) => (
                      <li key={inc.id} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        {isEs ? inc.textEs : inc.textEn}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {excludes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-700">{t("excludes")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {excludes.map((exc) => (
                      <li key={exc.id} className="flex items-start gap-2 text-sm">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        {isEs ? exc.textEs : exc.textEn}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar: Pricing + Departures */}
        <div className="space-y-6">
          {/* Pricing Card */}
          {tour.pricing && (
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>{t("price_pen")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm">{tc("book")} - Adulto</span>
                  <span className="text-2xl font-bold text-primary">
                    S/ {Number(tour.pricing.basePricePenAdult).toFixed(0)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-sm text-muted-foreground">
                  <span>Nino</span>
                  <span>S/ {Number(tour.pricing.basePricePenChild).toFixed(0)}</span>
                </div>
                <Separator />
                <div className="flex items-baseline justify-between text-sm text-muted-foreground">
                  <span>Adult (USD)</span>
                  <span>$ {Number(tour.pricing.basePriceUsdAdult).toFixed(0)}</span>
                </div>
                <div className="flex items-baseline justify-between text-sm text-muted-foreground">
                  <span>Child (USD)</span>
                  <span>$ {Number(tour.pricing.basePriceUsdChild).toFixed(0)}</span>
                </div>

                {tour.pricing.groupDiscountPercent && tour.pricing.groupMinPersons && (
                  <>
                    <Separator />
                    <p className="text-xs text-muted-foreground">
                      {t("group_discount")}: {Number(tour.pricing.groupDiscountPercent)}% ({tour.pricing.groupMinPersons}+ {t("persons_or_more")})
                    </p>
                  </>
                )}

                <Button className="w-full mt-4" size="lg" asChild>
                  <Link href="/contacto">{t("book_now")}</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Departure Dates */}
          {tour.departures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("departure_dates")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tour.departures.map((dep) => {
                  const spotsLeft = dep.maxCapacity - dep.bookedCount;
                  return (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {new Date(dep.departureDate).toLocaleDateString(
                            isEs ? "es-PE" : "en-US",
                            { day: "numeric", month: "long", year: "numeric" }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Users className="h-3 w-3" />
                        <span className={spotsLeft <= 3 ? "text-red-600 font-medium" : "text-muted-foreground"}>
                          {spotsLeft} {t("spots_left")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
