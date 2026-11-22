import { Baby, Footprints, Users } from "lucide-react";
import { formatTourAges, type TourAgesInput } from "@/lib/tour-ages";
import { familyTourTags, type FamilyTagInput, type FamilyTagTone } from "@/lib/family-tour-tags";

const TONE: Record<FamilyTagTone, { cls: string; icon: typeof Baby }> = {
  kids: { cls: "bg-brand-beige text-brand-darkRed", icon: Baby },
  all: { cls: "bg-brand-teal/10 text-brand-darkTeal", icon: Users },
  pace: { cls: "bg-gray-100 text-gray-700", icon: Footprints },
};

// Datos familiares de un tour en la tarjeta: edades recomendadas y etiquetas (ritmo, ideal para
// niños, para toda la familia). Sólo aparecen en tours familiares y con datos reales.
export function FamilyTourMeta({
  tour,
  locale,
  className = "",
}: {
  tour: TourAgesInput & FamilyTagInput;
  locale: string;
  className?: string;
}) {
  const ages = formatTourAges(tour, locale);
  const tags = familyTourTags(tour, locale);
  if (!ages && tags.length === 0) return null;

  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label={locale === "en" ? "Family details" : "Datos para familias"}>
      {ages && (
        <li className="inline-flex items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-1 text-[11px] font-semibold text-brand-orange">
          <Baby className="h-3 w-3" aria-hidden="true" />
          {ages}
        </li>
      )}
      {tags.map(({ label, tone }) => {
        const { cls, icon: Icon } = TONE[tone];
        return (
          <li key={label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
            <Icon className="h-3 w-3" aria-hidden="true" />
            {label}
          </li>
        );
      })}
    </ul>
  );
}
