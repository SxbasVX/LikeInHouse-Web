"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { MapPin, Clock, Star, ShoppingCart, Check, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

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

const difficultyLabel: Record<string, { es: string; en: string; color: string }> = {
  EASY:        { es: "Fácil",      en: "Easy",        color: "bg-brand-teal/20 text-brand-darkTeal" },
  MODERATE:    { es: "Moderado",   en: "Moderate",    color: "bg-brand-orange/15 text-brand-orange" },
  CHALLENGING: { es: "Desafiante", en: "Challenging",  color: "bg-brand-darkRed/15 text-brand-darkRed" },
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
    ? (() => { const raw = Number(tour.pricing.basePriceUsdAdult); return isFinite(raw) ? raw : null; })()
    : null;

  const diff = difficultyLabel[tour.difficulty];

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
    <Link href={`/tours/${tour.slug}`} className="flex flex-col group">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-gray-100 mb-5">
        {image ? (
          <Image
            src={image.url}
            alt={(isEs ? image.altEs : image.altEn) || name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Badges */}
        {tour.isFeatured && (
          <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-brand-orange px-3 py-1 text-[11px] font-semibold text-white shadow">
            <Star className="h-3 w-3" />
            Destacado
          </span>
        )}
        {diff && (
          <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold ${diff.color}`}>
            {isEs ? diff.es : diff.en}
          </span>
        )}

        {/* Cart button */}
        <button
          onClick={handleAddToCart}
          className={`absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium backdrop-blur-md transition-all ${
            inCart
              ? "bg-brand-teal/90 text-white"
              : "bg-black/50 text-white hover:bg-brand-orange"
          }`}
        >
          {inCart ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
          {inCart ? tc("in_cart") : tc("add_to_cart")}
        </button>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-gray-400 font-light mb-2">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {tour.destination}
        </span>
        <span className="h-[3px] w-[3px] rounded-full bg-gray-300" />
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {tour.durationDays}{t("days")} / {tour.durationNights}{t("nights")}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-brand-darkRed mb-2 leading-tight line-clamp-2 group-hover:text-brand-orange transition-colors">
        {name}
      </h3>

      {/* Description */}
      <p className="text-[14px] text-gray-500 font-light leading-relaxed line-clamp-2 flex-grow mb-5">
        {desc}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        {tour.tourType === "INFORMATIONAL" ? (
          <span className="text-sm font-medium text-gray-400">{isEs ? "Solo informativo" : "Info only"}</span>
        ) : price ? (
          <p className="text-lg font-bold text-brand-darkRed">
            ${price.toFixed(0)}{" "}
            <span className="text-[13px] font-light text-gray-500">/ {t("per_person")}</span>
          </p>
        ) : <span />}

        <Button
          variant="outline"
          className="rounded-full border-gray-200 hover:border-brand-orange hover:bg-brand-orange hover:text-white px-5 h-10 font-medium transition-all group-hover:shadow-[0_4px_14px_rgba(252,69,31,0.2)]"
        >
          {t("book_now")}
          <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </Link>
  );
}
