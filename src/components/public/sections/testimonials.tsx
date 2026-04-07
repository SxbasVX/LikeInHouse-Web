"use client";

import { useTranslations, useLocale } from "next-intl";
import { Star } from "lucide-react";
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

// Colores de avatar estilo Google
const GOOGLE_AVATAR_COLORS = [
  "#1A73E8", "#EA4335", "#34A853", "#FBBC05",
  "#A142F4", "#E8710A", "#0D652D", "#185ABC",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GOOGLE_AVATAR_COLORS[Math.abs(hash) % GOOGLE_AVATAR_COLORS.length];
}

export function TestimonialsSection({ testimonials, title, subtitle }: TestimonialsSectionProps) {
  const t = useTranslations("home");
  const locale = useLocale();
  const isEs = locale === "es";
  const header = useScrollAnimation({ threshold: 0.2 });
  const cards = useStaggerAnimation({ threshold: 0.1 });

  const avgRating = testimonials.length > 0
    ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
    : 4.5;

  return (
    <section className="bg-[#1C0D0C] pt-0 pb-20 lg:pb-28 relative overflow-hidden">
      {/* Onda superior — transición desde blanco */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <svg viewBox="0 0 1440 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
          <path d="M0 0 L1440 0 L1440 40 Q1080 90 720 50 Q360 10 0 70 Z" fill="white" fillOpacity="1" />
        </svg>
      </div>

      {/* Decoración sutil */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 pt-16 lg:pt-20">
        {/* Header */}
        <div ref={header.ref} className={`${header.isVisible ? "scroll-visible" : "scroll-hidden"} flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14`}>
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-4 py-2 mb-5">
              <GoogleIcon className="h-4 w-4" />
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-white/20"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-white">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-white/40">· 42 {isEs ? "reseñas" : "reviews"}</span>
            </div>
            <h2 className="font-heading text-3xl font-light text-white sm:text-4xl lg:text-5xl tracking-tight leading-[1.1]">
              {isEs ? "Viajeros que " : "Travelers who "}
              <span className="font-serif italic text-brand-orange">
                {isEs ? "nos recomiendan" : "recommend us"}
              </span>
            </h2>
          </div>
          <a
            href="https://www.google.com/search?q=Like+In+House+Cusco+Peru"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/60 hover:text-white hover:border-white/30 transition-all"
          >
            <GoogleIcon className="h-4 w-4" />
            {isEs ? "Ver en Google" : "View on Google"}
          </a>
        </div>

        {/* Cards */}
        <div ref={cards.ref} className={`grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 ${cards.className}`}>
          {testimonials.slice(0, 6).map((test) => (
            <div
              key={test.id}
              className="group rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/10 p-6 sm:p-7 transition-all duration-300 hover:bg-white/[0.1] hover:border-white/20"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < test.rating ? "fill-amber-400 text-amber-400" : "text-white/10"
                    }`}
                  />
                ))}
              </div>

              {/* Text */}
              <p className="mb-6 text-sm leading-relaxed text-white/70">
                &ldquo;{isEs ? test.textEs : (test.textEn || test.textEs)}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 border-t border-white/10 pt-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getAvatarColor(test.clientName) }}
                >
                  {test.clientName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">{test.clientName}</p>
                  <p className="text-xs text-white/35">
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
