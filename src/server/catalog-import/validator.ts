import type { CatalogTourCandidate } from "./schemas";
import { CONVERTIBLE_CURRENCIES } from "./pricing";
import type { OfficialLists } from "./normalize";
import { splitCategories } from "@/lib/tour-categories";

export interface CatalogValidationIssue {
  type: "DATA_REVIEW" | "MISSING_REQUIRED" | "INVALID_VALUE" | "CONTRADICTION";
  field: string; reason: string; sourcePages: number[];
  valueA?: string | null; valueB?: string | null;
}

// Confirmation issues: resolved when the reviewer confirms the field on approval (provenance becomes "manual").
export const CONFIRM_REASONS = {
  proposal: "Propuesta editorial: requiere confirmación humana.",
  foreignPages: "La evidencia refiere páginas ajenas al tour.",
  missingProvenance: "Falta identificar la procedencia de este dato.",
} as const;

// Automatic fixes are reported with these prefixes: a note needs nothing from the reviewer, a "Verifica" asks for one tick.
export const AUTO_NOTE_PREFIX = "Ajuste automático: ";
export const VERIFY_PREFIX = "Verifica: ";

// Reminders that never hold a tour back: the draft is still completed (photos, departures) in Tours before publishing.
export const NOTE_REASONS = {
  missingDayTitle: "Falta título de día ES/EN.",
  itineraryAsText: "Separar el itinerario en actividades con título y descripción ES/EN.",
  scheduleDays: "Faltan días de salida.",
  scheduleDates: "Las fechas específicas requieren configurar capacidad y salidas en el admin; no se inventarán.",
  scheduleNotes: "Traducir las notas de horarios.",
  noImages: "Faltan sugerencias visuales basadas en el documento.",
  noCover: "Seleccionar una sugerencia de portada.",
  priceSource: "Falta procedencia del precio.",
} as const;

// A derived rate may state its discount as an amount, a fraction (0.08) or a percentage (8).
function derivedAmountMatches(base: number, discount: number, amount: number): boolean {
  const close = (value: number) => Math.abs(value - amount) <= 0.011;
  return close(base - discount) || (discount > 0 && discount < 1 && close(base * (1 - discount))) || (discount >= 1 && discount <= 100 && close(base * (1 - discount / 100)));
}

/** `lists` adds the checks against the official cities and categories (a tour outside them can't be created). */
export function validateCatalogTour(c: CatalogTourCandidate, lists?: OfficialLists): CatalogValidationIssue[] {
  const issues: CatalogValidationIssue[] = [];
  const add = (field: string, reason: string, type: CatalogValidationIssue["type"] = "DATA_REVIEW") =>
    issues.push({ type, field, reason, sourcePages: c.sourcePages });
  for (const field of ["nameEs", "nameEn", "slug", "category", "destination", "difficulty", "durationDays", "durationNights", "shortDescEs", "shortDescEn", "longDescEs", "longDescEn", "metaTitleEs", "metaTitleEn", "metaDescEs", "metaDescEn"] as const) {
    if (c[field] === null || c[field] === "") add(field, "Dato obligatorio ausente. Completar desde el documento o confirmar editorialmente.", "MISSING_REQUIRED");
  }
  if (lists && c.destination && !lists.destinations.includes(c.destination)) add("destination", `«${c.destination}» no está en la lista de ciudades. Elige una ciudad de la lista o añádela.`, "INVALID_VALUE");
  if (lists && c.category) {
    const outside = splitCategories(c.category).filter((category) => !lists.categories.includes(category));
    if (outside.length) add("category", `Categoría fuera de la lista oficial: ${outside.map((x) => `«${x}»`).join(", ")}. Elige de la lista.`, "INVALID_VALUE");
  }
  for (const fix of c.autoFixes ?? []) add(fix.field, `${fix.verify ? VERIFY_PREFIX : AUTO_NOTE_PREFIX}${fix.reason}`);
  if (c.durationDays === 0 && !c.durationHours) add("durationHours", "Una experiencia de horas necesita una duración documentada.");
  if (c.durationNights !== null && c.durationDays !== null && c.durationNights > c.durationDays) add("durationNights", "Las noches superan los días.", "CONTRADICTION");
  for (const field of ["shortDescEs", "shortDescEn"] as const) if ((c[field]?.length ?? 0) > 160) add(field, "Máximo 160 caracteres.", "INVALID_VALUE");
  for (const [field, proof] of Object.entries(c.provenance ?? {})) {
    if (proof.requiresReview || proof.source === "inferred" || proof.source === "suggested") add(field, CONFIRM_REASONS.proposal);
    // Traceability warning only: the reviewer checks the evidence and accepts it.
    if (proof.sourcePages.some((page) => !c.sourcePages.includes(page))) add(field, CONFIRM_REASONS.foreignPages);
  }
  for (const field of ["category", "difficulty", "durationDays", "durationNights"] as const) {
    if (c[field] !== null && !c.provenance?.[field]) add(field, CONFIRM_REASONS.missingProvenance);
  }
  for (const issue of c.sourceIssues ?? []) issues.push({ ...issue, type: "CONTRADICTION" });
  if (!c.prices.length) add("prices", "No se encontraron tarifas.");
  if (c.prices.length && !c.priceAdjustment) add("priceAdjustment", "Falta el tipo de cambio SUNAT y el margen para publicar en USD. Usa «Actualizar tipo de cambio».", "MISSING_REQUIRED");
  if (c.priceAdjustment?.rateSource === "fallback") add("priceAdjustment", "SUNAT no respondió: se usó un tipo de cambio de emergencia. Actualízalo antes de crear el tour.");
  c.prices.forEach((p, index) => {
    const key = `prices.${index}`;
    if (p.amount === null) add(`${key}.amount`, "Importe ausente.", "MISSING_REQUIRED");
    if (!CONVERTIBLE_CURRENCIES.includes(p.currency as "USD")) add(`${key}.currency`, "Moneda ausente o no soportada: solo se convierten soles (PEN) y dólares (USD).", "INVALID_VALUE");
    if (!p.labelEs || !p.labelEn) add(`${key}.label`, "La tarifa necesita etiqueta ES/EN.");
    if (p.ageMin !== null && p.ageMax !== null && p.ageMin > p.ageMax) add(`${key}.ageMax`, "Rango de edades invertido.", "INVALID_VALUE");
    if (p.minPassengers != null && p.maxPassengers != null && p.minPassengers > p.maxPassengers) add(key, "Rango de pasajeros invertido.", "INVALID_VALUE");
    if (p.priceType !== "per_person" || p.minPassengers != null || p.maxPassengers != null || p.serviceMode) add(key, "Tarifa por grupo, pasajeros o modalidad, o sin unidad definida: el modelo de venta actual no puede representarla con seguridad.");
    if (p.source === "derived") {
      const calc = p.calculation;
      if (!calc || calc.discount > calc.baseAmount || p.amount === null || !derivedAmountMatches(calc.baseAmount, calc.discount, p.amount)) add(`${key}.calculation`, "El cálculo derivado no coincide con el importe.", "INVALID_VALUE");
      if (calc && !c.prices.some((other) => other.source !== "derived" && other.amount === calc.baseAmount && other.currency === p.currency)) add(`${key}.calculation`, "La tarifa base del cálculo no aparece documentada.");
    }
    if (!p.source) add(`${key}.source`, NOTE_REASONS.priceSource);
  });
  for (const [es, en] of [["includesEs", "includesEn"], ["excludesEs", "excludesEn"], ["conditionsEs", "conditionsEn"]] as const) {
    if (c[es].length !== c[en].length) add(en, "Las listas ES/EN deben corresponder elemento por elemento.");
  }
  const dayNumbers = new Set<number>();
  if (!c.itinerary.length) add("itinerary", "Falta el itinerario estructurado.");
  c.itinerary.forEach((day, index) => {
    const key = `itinerary.${index}`;
    if (dayNumbers.has(day.dayNumber)) add(key, "Día repetido.", "INVALID_VALUE");
    dayNumbers.add(day.dayNumber);
    if (c.durationDays !== null && day.dayNumber > Math.max(1, c.durationDays)) add(key, "Día fuera de la duración indicada.", "INVALID_VALUE");
    if (!day.titleEs || !day.titleEn) add(key, NOTE_REASONS.missingDayTitle);
    if (!day.items?.length) add(key, NOTE_REASONS.itineraryAsText);
    day.items?.forEach((item, itemIndex) => {
      if (!item.titleEs || !item.titleEn || !item.descriptionEs || !item.descriptionEn) add(`${key}.items.${itemIndex}`, "Actividad incompleta en ES/EN.");
      if (item.time && !validTime(item.time)) add(`${key}.items.${itemIndex}.time`, "Usar hora HH:mm o rango HH:mm - HH:mm documentado.", "INVALID_VALUE");
    });
  });
  c.conditions?.forEach((condition, i) => {
    if (!condition.titleEs || !condition.titleEn || !condition.descriptionEs || !condition.descriptionEn) add(`conditions.${i}`, "Condición incompleta en ES/EN.");
  });
  if (c.schedule) {
    if (c.schedule.frequency === "selected_days" && !c.schedule.days.length) add("schedule.days", NOTE_REASONS.scheduleDays);
    if (c.schedule.times.some((time) => !validTime(time))) add("schedule.times", "Horario inválido.", "INVALID_VALUE");
    if (c.schedule.dates.length) add("schedule.dates", NOTE_REASONS.scheduleDates);
    if (Boolean(c.schedule.notesEs) !== Boolean(c.schedule.notesEn)) add("schedule", NOTE_REASONS.scheduleNotes);
  }
  if (!c.imageSuggestions?.length) add("imageSuggestions", NOTE_REASONS.noImages);
  if (c.imageSuggestions?.length && !c.imageSuggestions.some((s) => s.recommendedForCover)) add("imageSuggestions", NOTE_REASONS.noCover);
  return issues;
}

export function validTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d(?:\s*-\s*(?:[01]\d|2[0-3]):[0-5]\d)?$/.test(value);
}
