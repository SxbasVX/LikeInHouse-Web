"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

interface Testimonial {
  id: string;
  clientName: string;
  country: string | null;
  tourName: string | null;
  rating: number;
  textEs: string;
  textEn: string | null;
}

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const isEs = locale === "es";

  return (
    <section className="bg-gray-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="animate-slide-up text-center mb-12">
          <h2 className="text-3xl font-bold">{t("testimonials")}</h2>
        </div>

        <div className="stagger-children grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 3).map((test) => (
            <Card key={test.id} className="relative transition-shadow hover:shadow-lg">
              <CardContent className="pt-6">
                <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/10" />
                <div className="mb-3 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      aria-label={i < test.rating ? "filled star" : "empty star"}
                      className={`h-4 w-4 transition-colors ${
                        i < test.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{isEs ? test.textEs : (test.textEn || test.textEs)}&rdquo;
                </p>
                <div>
                  <p className="font-medium text-sm">{test.clientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {test.country || ""}
                    {test.tourName && `${test.country ? " | " : ""}${test.tourName}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
