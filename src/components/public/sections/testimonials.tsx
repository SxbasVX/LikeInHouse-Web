"use client";

import { useTranslations, useLocale } from "next-intl";
import { Star, Quote } from "lucide-react";
import { useScrollAnimation, useStaggerAnimation } from "@/hooks/use-scroll-animation";

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
  const header = useScrollAnimation({ threshold: 0.2 });
  const cards = useStaggerAnimation({ threshold: 0.1 });

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={header.ref} className={`${header.isVisible ? "scroll-visible" : "scroll-hidden"} text-center mb-14`}>
          <h2 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
            {t("testimonials")}
          </h2>
        </div>

        <div ref={cards.ref} className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 ${cards.className}`}>
          {testimonials.slice(0, 3).map((test) => (
            <div
              key={test.id}
              className="group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 sm:p-8"
            >
              <Quote className="absolute right-6 top-6 h-8 w-8 text-brand-orange/10" />

              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    aria-label={i < test.rating ? "filled star" : "empty star"}
                    className={`h-4 w-4 ${
                      i < test.rating
                        ? "fill-brand-orange text-brand-orange"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Text */}
              <p className="mb-6 text-sm leading-relaxed text-gray-600">
                &ldquo;{isEs ? test.textEs : (test.textEn || test.textEs)}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-teal to-brand-orange text-sm font-bold text-white">
                  {test.clientName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{test.clientName}</p>
                  <p className="text-xs text-gray-400">
                    {test.country || ""}
                    {test.tourName && `${test.country ? " · " : ""}${test.tourName}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
