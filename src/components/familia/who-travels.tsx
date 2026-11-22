"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { TRAVELER_GROUPS, travelersHref, type TravelerGroup } from "@/lib/family-travelers";
import { familyBtnOnDark } from "@/components/familia/styles";
import { cn } from "@/lib/utils";

interface WhoTravelsProps {
  initial?: TravelerGroup[];
  /** "go": elige y pasa al catálogo (hero). "filter": filtra el catálogo al instante. */
  mode: "go" | "filter";
  /** Fondo sobre el que se pinta. */
  tone: "dark" | "light";
}

// "¿Quiénes viajan?": la familia elige sus generaciones y ve sólo los tours que les sirven.
export function WhoTravels({ initial = [], mode, tone }: WhoTravelsProps) {
  const t = useTranslations("familia");
  const router = useRouter();
  const [picked, setPicked] = useState<TravelerGroup[]>(initial);
  const dark = tone === "dark";

  const toggle = (key: TravelerGroup) => {
    const next = picked.includes(key) ? picked.filter((k) => k !== key) : [...picked, key];
    setPicked(next);
    if (mode === "filter") router.replace(travelersHref(next), { scroll: false });
  };

  return (
    <fieldset>
      <legend className={cn("text-base font-bold", dark ? "text-white" : "text-fam-tinta")}>{t("who_title")}</legend>
      <p className={cn("mt-1 text-sm", dark ? "text-white/75" : "text-fam-tinta/70")}>{t("who_hint")}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TRAVELER_GROUPS.map((g) => {
          const on = picked.includes(g.key);
          return (
            <button
              key={g.key}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(g.key)}
              className={cn(
                "group relative flex min-h-[64px] flex-col items-start justify-center overflow-hidden rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fam-maiz focus-visible:ring-offset-2",
                dark
                  ? on
                    ? "border-white bg-white text-fam-tinta focus-visible:ring-offset-fam-valle"
                    : "border-white/30 bg-white/5 text-white hover:border-white/70 focus-visible:ring-offset-fam-valle"
                  : on
                    ? "border-fam-tinta bg-fam-tinta text-white"
                    : "border-fam-tinta/20 bg-white text-fam-tinta hover:border-fam-tinta/60"
              )}
            >
              {/* Hilo de la generación */}
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: g.thread }} />
              <span className="flex items-center gap-1.5 text-[15px] font-bold leading-tight">
                {on && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                {t(`who_${g.key}`)}
              </span>
              <span className={cn("mt-0.5 text-xs", on ? "opacity-80" : "opacity-70")}>{t(`who_${g.key}_ages`)}</span>
            </button>
          );
        })}
      </div>
      {mode === "go" && (
        <button
          type="button"
          onClick={() => router.push(travelersHref(picked))}
          className={cn(familyBtnOnDark, "mt-5 w-full sm:w-auto")}
        >
          {picked.length ? t("who_go") : t("who_go_all")}
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
