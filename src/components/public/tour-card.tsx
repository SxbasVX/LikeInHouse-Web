"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Star } from "lucide-react";

interface TourCardProps {
  tour: {
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
    images: { url: string; altEs?: string | null; altEn?: string | null }[];
    pricing: { basePricePenAdult: any; basePriceUsdAdult: any } | null;
  };
}

const difficultyColors: Record<string, string> = {
  EASY: "bg-green-100 text-green-800",
  MODERATE: "bg-yellow-100 text-yellow-800",
  CHALLENGING: "bg-red-100 text-red-800",
};

export function TourCard({ tour }: TourCardProps) {
  const t = useTranslations("tours");
  const locale = useLocale();
  const isEs = locale === "es";

  const name = isEs ? tour.nameEs : tour.nameEn;
  const desc = isEs ? tour.shortDescEs : tour.shortDescEn;
  const image = tour.images[0];
  const price = tour.pricing
    ? Number(isEs ? tour.pricing.basePricePenAdult : tour.pricing.basePriceUsdAdult)
    : null;
  const currency = isEs ? "S/" : "$";

  return (
    <Link href={`/tours/${tour.slug}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {image ? (
            <img
              src={image.url}
              alt={(isEs ? image.altEs : image.altEn) || name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <MapPin className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {tour.isFeatured && (
            <Badge className="absolute left-3 top-3 gap-1 bg-yellow-500">
              <Star className="h-3 w-3" />
              Destacado
            </Badge>
          )}
          <Badge
            variant="secondary"
            className={`absolute right-3 top-3 ${difficultyColors[tour.difficulty] || ""}`}
          >
            {t(`difficulty_${tour.difficulty.toLowerCase()}`)}
          </Badge>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {tour.destination}
            <span className="mx-1">|</span>
            <Clock className="h-3 w-3" />
            {tour.durationDays}{t("days")} / {tour.durationNights}{t("nights")}
          </div>

          <h3 className="mb-1 font-semibold line-clamp-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
            {desc}
          </p>

          {price && (
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-muted-foreground">{t("from_price")}</span>
              <span className="text-lg font-bold text-primary">
                {currency} {price.toFixed(0)}
              </span>
              <span className="text-xs text-muted-foreground">/ {t("per_person")}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
