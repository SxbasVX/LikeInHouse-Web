"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FamilyGalleryItem } from "@/lib/family-site";

// Inclinación de cada polaroid, para que parezca un álbum armado a mano.
const TILT = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-1", "-rotate-2", "rotate-2", "-rotate-1"];

interface FamilyCarouselProps {
  items: FamilyGalleryItem[];
  label: string;
  prevLabel: string;
  nextLabel: string;
  /** Texto alternativo de cada foto (se calcula en el servidor). */
  alts: string[];
}

// Carrusel "Estas familias también lo vivieron": se desliza con el dedo, flechas o teclado.
export function FamilyCarousel({ items, label, prevLabel, nextLabel, alts }: FamilyCarouselProps) {
  const track = useRef<HTMLUListElement>(null);

  const move = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="relative" role="region" aria-roledescription="carrusel" aria-label={label}>
      <ul
        ref={track}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
        }}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-10 pt-6 [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange sm:px-6 lg:px-12 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <li
            key={item.url}
            className={`w-[78%] shrink-0 snap-center sm:w-[44%] lg:w-[30%] xl:w-[26%]`}
            aria-roledescription="foto"
            aria-label={`${i + 1} / ${items.length}`}
          >
            <figure
              className={`bg-white p-3 pb-4 shadow-[0_14px_34px_-14px_rgba(68,21,20,0.35)] transition-transform duration-300 ease-out hover:rotate-0 hover:-translate-y-1 motion-reduce:transform-none ${TILT[i % TILT.length]}`}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                <Image
                  src={item.url}
                  alt={alts[i] ?? item.caption}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 26vw, (min-width: 1024px) 30vw, (min-width: 640px) 44vw, 78vw"
                />
              </div>
              <figcaption className="min-h-[2.5rem] px-1 pt-3 text-center font-serif text-lg italic text-brand-darkRed">
                {item.caption}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <div className="mx-auto flex max-w-[1400px] justify-center gap-3 px-4 sm:justify-end sm:px-6 lg:px-12">
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label={prevLabel}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-brand-darkRed transition-all hover:-translate-y-0.5 hover:border-brand-orange hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange motion-reduce:transform-none"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => move(1)}
          aria-label={nextLabel}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange text-white transition-all hover:-translate-y-0.5 hover:bg-brand-darkRed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 motion-reduce:transform-none"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
