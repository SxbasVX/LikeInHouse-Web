"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Check } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { TRAVELER_GROUPS, travelersHref, type TravelerGroup } from "@/lib/family-travelers";
import { FamilyIcon, type FamilyIconName } from "@/components/familia/family-icons";
import { cn } from "@/lib/utils";

interface WhoTravelsProps {
  initial?: TravelerGroup[];
  /** "go": elige y pasa al catálogo (hero). "filter": filtra el catálogo al instante. */
  mode: "go" | "filter";
  /** Título del selector (cambia entre el inicio y el catálogo). */
  title?: string;
}

// Ícono y color de cada generación (colores de la marca).
const LOOK: Record<TravelerGroup, { icon: FamilyIconName; color: string }> = {
  bebes: { icon: "stroller", color: "#E0A126" },
  ninos: { icon: "kite", color: "#FC451F" },
  adolescentes: { icon: "mountain", color: "#15A58E" },
  abuelos: { icon: "tea", color: "#441514" },
};

// "¿Quiénes viajan?": tarjetas que se pueden marcar varias a la vez (el círculo de check lo indica).
export function WhoTravels({ initial = [], mode, title }: WhoTravelsProps) {
  const t = useTranslations("familia");
  const router = useRouter();
  const [picked, setPicked] = useState<TravelerGroup[]>(initial);

  const toggle = (key: TravelerGroup) => {
    const next = picked.includes(key) ? picked.filter((k) => k !== key) : [...picked, key];
    setPicked(next);
    if (mode === "filter") router.replace(travelersHref(next), { scroll: false });
  };

  return (
    <fieldset className="w-full rounded-[1.75rem] bg-white p-3 text-left shadow-[0_12px_40px_rgba(0,0,0,0.28)] sm:p-4">
      <legend className="sr-only">{title ?? t("who_title")}</legend>
      <div className="mb-3 flex flex-col gap-0.5 px-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <p aria-hidden="true" className="font-heading text-base font-bold text-brand-darkRed sm:text-lg">
          {title ?? t("who_title")}
        </p>
        <p className="text-xs text-gray-500 sm:text-sm">{t("who_hint")}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {TRAVELER_GROUPS.map((g) => {
          const on = picked.includes(g.key);
          const look = LOOK[g.key];
          return (
            <button
              key={g.key}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(g.key)}
              className={cn(
                "family-pop relative flex min-h-[92px] flex-col items-start justify-between gap-3 rounded-2xl border-2 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 sm:min-h-[104px] sm:p-4",
                on ? "border-brand-orange bg-brand-orange/[0.06]" : "border-gray-100 bg-gray-50/60 hover:border-gray-200 hover:bg-white"
              )}
            >
              {/* Círculo de check: vacío = se puede marcar; lleno = marcado */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                  on ? "border-brand-orange bg-brand-orange text-white" : "border-gray-300 bg-white"
                )}
              >
                {on && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${look.color}1A`, color: look.color }}
              >
                <FamilyIcon name={look.icon} className="family-icon h-[22px] w-[22px]" />
              </span>
              <span className="min-w-0">
                <span className="block font-heading text-sm font-bold leading-tight text-brand-darkRed sm:text-[15px]">{t(`who_${g.key}`)}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-gray-500 sm:text-xs">{t(`who_${g.key}_ages`)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {mode === "go" && (
        <button
          type="button"
          onClick={() => router.push(travelersHref(picked))}
          className="group mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-orange px-6 py-4 text-base font-bold text-white shadow-[0_10px_24px_-10px_rgb(var(--brand-orange-rgb)/0.8)] transition-all hover:bg-brand-darkRed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-darkRed focus-visible:ring-offset-2 sm:text-lg"
        >
          {picked.length ? t("who_go") : t("who_go_all")}
          <ArrowUpRight className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
        </button>
      )}
      {mode === "filter" && (
        <p className="sr-only" aria-live="polite">
          {picked.length ? t("who_filtering") : t("who_not_filtering")}
        </p>
      )}
    </fieldset>
  );
}
