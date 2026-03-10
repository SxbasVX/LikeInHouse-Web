"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { TourCard } from "@/components/public/tour-card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Tour {
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
  images: { url: string; altEs: string | null; altEn: string | null }[];
  pricing: { basePriceUsdAdult: any } | null;
}

export function FeaturedToursSection({ tours }: { tours: Tour[] }) {
  const t = useTranslations("home");
  const tc = useTranslations("common");

  if (tours.length === 0) return null;

  return (
    <section className="py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="animate-slide-up text-center mb-12">
          <h2 className="text-3xl font-bold">{t("featured_tours")}</h2>
          <p className="mt-2 text-muted-foreground">{t("featured_subtitle")}</p>
        </div>

        <div className="stagger-children grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>

        <div className="animate-fade-in mt-10 text-center" style={{ animationDelay: "500ms" }}>
          <Button variant="outline" size="lg" className="transition-transform hover:scale-105" asChild>
            <Link href="/tours">
              {tc("view_more")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
