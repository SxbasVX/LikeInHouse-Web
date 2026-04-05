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

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
  title?: string;
  subtitle?: string;
}

// Colores de avatar estilo Google
const GOOGLE_AVATAR_COLORS = [
  "#1A73E8", // azul
  "#EA4335", // rojo
  "#34A853", // verde
  "#FBBC05", // amarillo
  "#A142F4", // morado
  "#E8710A", // naranja
  "#0D652D", // verde oscuro
  "#185ABC", // azul oscuro
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GOOGLE_AVATAR_COLORS[Math.abs(hash) % GOOGLE_AVATAR_COLORS.length];
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function TestimonialsSection({ testimonials, title, subtitle }: TestimonialsSectionProps) {
  const t = useTranslations("home");
  const locale = useLocale();
  const isEs = locale === "es";
  const header = useScrollAnimation({ threshold: 0.2 });
  const cards = useStaggerAnimation({ threshold: 0.1 });
  const badge = useScrollAnimation({ threshold: 0.3 });

  // Calcular rating promedio
  const avgRating = testimonials.length > 0
    ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
    : 4.5;

  return (
    <section className="bg-[#faf8f5] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={header.ref} className={`${header.isVisible ? "scroll-visible" : "scroll-hidden"} text-center mb-14`}>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-orange mb-3">
            Google Reviews
          </span>
          <h2 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl leading-tight">
            {isEs ? "Lo que dicen" : "What our"}
            <br />
            <span className="font-serif italic font-normal text-brand-darkRed">
              {isEs ? "nuestros viajeros." : "travelers say."}
            </span>
          </h2>

          {/* Google Reviews badge */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-white px-5 py-2.5 shadow-sm border border-gray-100">
            <GoogleIcon className="h-5 w-5" />
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-gray-900">{avgRating.toFixed(1)}</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < Math.round(avgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-sm text-gray-500">
              42 {isEs ? "opiniones" : "reviews"}
            </span>
          </div>
        </div>

        {/* Cards */}
        <div ref={cards.ref} className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 ${cards.className}`}>
          {testimonials.slice(0, 6).map((test) => (
            <div
              key={test.id}
              className="group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 sm:p-8"
            >
              {/* Google icon */}
              <div className="absolute right-6 top-6">
                <GoogleIcon className="h-5 w-5 opacity-40 group-hover:opacity-70 transition-opacity" />
              </div>

              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    aria-label={i < test.rating ? "filled star" : "empty star"}
                    className={`h-4 w-4 ${
                      i < test.rating
                        ? "fill-amber-400 text-amber-400"
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
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: getAvatarColor(test.clientName) }}
                >
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

        {/* CTA de Google Reviews */}
        <div ref={badge.ref} className={`${badge.isVisible ? "scroll-visible" : "scroll-hidden"} mt-12 text-center`}>
          <a
            href="https://www.google.com/search?q=Like+In+House+Cusco+Peru"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-600 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
          >
            <GoogleIcon className="h-4 w-4" />
            {isEs ? "Ver todas las reseñas en Google" : "See all reviews on Google"}
          </a>
        </div>
      </div>
    </section>
  );
}
