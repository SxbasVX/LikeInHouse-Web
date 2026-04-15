"use client";

import { useLocale } from "next-intl";
import { trpc } from "@/lib/trpc";
import Image from "next/image";
import { X, ArrowUpRight } from "lucide-react";
import { useState } from "react";

export function PromoBannersSection() {
  const locale = useLocale();
  const isEs = locale === "es";
  const { data: banners = [] } = trpc.public.activeBanners.useQuery();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = banners.filter((b) => !dismissed.has(b.id));
  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3 max-w-sm w-full sm:max-w-md pointer-events-none">
      {visible.slice(0, 2).map((banner) => {
        const title    = isEs ? banner.titleEs    : (banner.titleEn    || banner.titleEs);
        const subtitle = isEs ? banner.subtitleEs : (banner.subtitleEn || banner.subtitleEs);
        const linkText = isEs ? (banner.linkTextEs || "Ver más") : (banner.linkTextEn || "Learn more");

        return (
          <div
            key={banner.id}
            className="pointer-events-auto relative overflow-hidden rounded-2xl shadow-2xl animate-slide-up"
            style={{ minHeight: "110px" }}
          >
            {/* Imagen de fondo */}
            {banner.imageUrl && (
              <Image
                src={banner.imageUrl}
                alt={title}
                fill
                className="object-cover"
                sizes="480px"
              />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />

            {/* Botón cerrar */}
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, banner.id]))}
              className="absolute top-2.5 right-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Contenido */}
            <div className="relative z-10 p-4 pr-10 flex items-center justify-between gap-3 h-full min-h-[110px]">
              <div className="flex-1 min-w-0">
                {title && (
                  <p className="text-white font-bold text-base leading-snug line-clamp-2">
                    {title}
                  </p>
                )}
                {subtitle && (
                  <p className="text-white/75 text-xs mt-1 line-clamp-1">{subtitle}</p>
                )}
                {banner.linkUrl && (
                  <a
                    href={banner.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-brand-orange hover:text-white transition-colors"
                  >
                    {linkText}
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
