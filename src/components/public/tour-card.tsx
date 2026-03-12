"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Star, ShoppingCart, Check } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useToast } from "@/hooks/use-toast";

interface TourCardProps {
  tour: {
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
    images: { url: string; altEs?: string | null; altEn?: string | null }[];
    pricing: { basePriceUsdAdult: any } | null;
  };
}

const difficultyColors: Record<string, string> = {
  EASY: "bg-brand-teal/15 text-brand-darkTeal",
  MODERATE: "bg-brand-orange/15 text-brand-orange",
  CHALLENGING: "bg-brand-darkRed/15 text-brand-darkRed",
};

export function TourCard({ tour }: TourCardProps) {
  const t = useTranslations("tours");
  const tc = useTranslations("cart");
  const locale = useLocale();
  const isEs = locale === "es";
  const { addItem, isInCart } = useCartStore();
  const { toast } = useToast();
  const inCart = isInCart(tour.id);

  const name = isEs ? tour.nameEs : tour.nameEn;
  const desc = isEs ? tour.shortDescEs : tour.shortDescEn;
  const image = tour.images[0];
  const price = tour.pricing
    ? (() => {
      const raw = Number(tour.pricing.basePriceUsdAdult);
      return isFinite(raw) ? raw : null;
    })()
    : null;
  const currency = "$";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) return;
    addItem({
      id: tour.id,
      slug: tour.slug,
      nameEs: tour.nameEs,
      nameEn: tour.nameEn,
      destination: tour.destination,
      durationDays: tour.durationDays,
      durationNights: tour.durationNights,
      imageUrl: image?.url || null,
      priceUsd: price,
      tourType: tour.tourType || "BOOKABLE",
    });
    toast({ title: tc("added_to_cart") });
  };

  return (
    <Link href={`/tours/${tour.slug}`}>
      <Card className="group flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {image ? (
            <Image
              src={image.url}
              alt={(isEs ? image.altEs : image.altEn) || name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <MapPin className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {tour.isFeatured && (
            <Badge className="absolute left-3 top-3 gap-1 bg-brand-orange text-white">
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
          {/* Add to Cart button */}
          <button
            onClick={handleAddToCart}
            className={`absolute left-3 bottom-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-all ${
              inCart
                ? "bg-brand-teal/90 text-white"
                : "bg-black/50 text-white hover:bg-brand-orange"
            }`}
          >
            {inCart ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
            {inCart ? tc("in_cart") : tc("add_to_cart")}
          </button>
        </div>

        {/* Content */}
        <CardContent className="flex flex-col flex-1 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {tour.destination}
            <span className="mx-1">|</span>
            <Clock className="h-3 w-3" />
            {tour.durationDays}{t("days")} / {tour.durationNights}{t("nights")}
          </div>

          <h3 className="mb-1 text-base font-bold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
            {desc}
          </p>

          {tour.tourType === "INFORMATIONAL" ? (
            <Badge variant="secondary" className="text-xs">
              {isEs ? "Solo informativo" : "Info only"}
            </Badge>
          ) : price ? (
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-muted-foreground">{t("from_price")}</span>
              <span className="text-lg font-bold text-primary">
                {currency} {price.toFixed(0)}
              </span>
              <span className="text-xs text-muted-foreground">/ {t("per_person")}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
