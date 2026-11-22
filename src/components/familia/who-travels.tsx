"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Check } from "lucide-react";
import { FamilyIcon, type FamilyIconName } from "@/components/familia/family-icons";
import { useRouter } from "@/i18n/routing";
import { TRAVELER_GROUPS, travelersHref, type TravelerGroup } from "@/lib/family-travelers";
import { cn } from "@/lib/utils";

interface WhoTravelsProps {
  initial?: TravelerGroup[];
  /** "go": elige y pasa al catálogo (hero). "filter": filtra el catálogo al instante. */
  mode: "go" | "filter";
  /** Fondo sobre el que va el título: foto oscura (hero) o fondo claro (catálogo). */
  tone: "dark" | "light";
}

// Ícono y color de cada generación (colores de la marca).
const LOOK: Record<TravelerGroup, { icon: FamilyIconName; color: string }> = {
  bebes: { icon: "stroller", color: "#F2B33D" },
  ninos: { icon: "kite", color: "#FC451F" },
  adolescentes: { icon: "mountain", color: "#15A58E" },
  abuelos: { icon: "tea", color: "#441514" },
};

// "¿Quiénes viajan?" con el mismo estilo que el buscador del hero de la web principal.
export function WhoTravels({ initial = [], mode, tone }: WhoTravelsProps) {
  const t = useTranslations("familia");
  const router = useRouter();
  const [picked, setPicked] = useState<TravelerGroup[]>(initial);

  const toggle = (key: TravelerGroup) => {
    const next = picked.includes(key) ? picked.filter((k) => k !== key) : [...picked, key];
    setPicked(next);
    if (mode === "filter") router.replace(travelersHref(next), { scroll: false });
  };

  return (
    <fieldset className="w-full">
      <legend className={cn("mb-3 text-sm font-semibold", tone === "dark" ? "text-white/90" : "text-brand-darkRed")}>
        {t("who_title")}
      </legend>
      <div className="flex flex-col gap-2 rounded-2xl bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.25)] sm:flex-row sm:items-center sm:p-2">
        <div className="grid flex-1 grid-cols-2 gap-1.5 sm:grid-cols-4">
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
                  "family-pop flex min-h-[56px] items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                  on ? "bg-brand-orange text-white" : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                )}
              >
                <span
                  aria-hidden="true"
                  className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: on ? "rgba(255,255,255,0.2)" : `${look.color}1F`, color: on ? "#fff" : look.color }}
                >
                  <FamilyIcon name={look.icon} className="family-icon h-5 w-5" />
                  {on && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-brand-orange shadow">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className="min-w-0 whitespace-nowrap">
                  <span className="block text-sm font-semibold leading-tight">{t(`who_${g.key}`)}</span>
                  <span className={cn("block text-[11px]", on ? "text-white/80" : "text-gray-500")}>{t(`who_${g.key}_ages`)}</span>
                </span>
              </button>
            );
          })}
        </div>
        {mode === "go" && (
          <button
            type="button"
            onClick={() => router.push(travelersHref(picked))}
            className="group flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-orange px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_16px_rgb(var(--brand-orange-rgb)/0.35)] transition-all hover:scale-[1.02] hover:bg-brand-darkRed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-darkRed focus-visible:ring-offset-2 sm:text-base"
          >
            {picked.length ? t("who_go") : t("who_go_all")}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none sm:h-5 sm:w-5" aria-hidden="true" />
          </button>
        )}
      </div>
      {mode === "filter" && (
        <p className="sr-only" aria-live="polite">
          {picked.length ? t("who_filtering") : t("who_not_filtering")}
        </p>
      )}
    </fieldset>
  );
}
