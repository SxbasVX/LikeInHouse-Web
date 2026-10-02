import type { CatalogTourCandidate } from "./schemas";

export interface CatalogValidationIssue {
  type: "DATA_REVIEW" | "MISSING_REQUIRED" | "INVALID_VALUE" | "CONTRADICTION";
  field: string; reason: string; sourcePages: number[];
  valueA?: string | null; valueB?: string | null;
}

export function validateCatalogTour(c: CatalogTourCandidate): CatalogValidationIssue[] {
  const issues: CatalogValidationIssue[] = [];
  const add = (field: string, reason: string, type: CatalogValidationIssue["type"] = "DATA_REVIEW") =>
    issues.push({ type, field, reason, sourcePages: c.sourcePages });
  for (const field of ["nameEs", "nameEn", "slug", "category", "destination", "difficulty", "durationDays", "durationNights", "shortDescEs", "shortDescEn", "longDescEs", "longDescEn", "metaTitleEs", "metaTitleEn", "metaDescEs", "metaDescEn"] as const) {
    if (c[field] === null || c[field] === "") add(field, "Dato obligatorio ausente. Completar desde el documento o confirmar editorialmente.", "MISSING_REQUIRED");
  }
  if (c.durationDays === 0 && !c.durationHours) add("durationHours", "Una experiencia de horas necesita una duración documentada.");
  if (c.durationNights !== null && c.durationDays !== null && c.durationNights > c.durationDays) add("durationNights", "Las noches superan los días.", "CONTRADICTION");
  for (const field of ["shortDescEs", "shortDescEn"] as const) if ((c[field]?.length ?? 0) > 160) add(field, "Máximo 160 caracteres.", "INVALID_VALUE");
  for (const [field, proof] of Object.entries(c.provenance ?? {})) {
    if (proof.requiresReview || proof.source === "inferred" || proof.source === "suggested") add(field, "Propuesta editorial: requiere confirmación humana.");
    if (proof.sourcePages.some((page) => !c.sourcePages.includes(page))) add(field, "La evidencia refiere páginas ajenas al tour.", "INVALID_VALUE");
  }
  for (const field of ["category", "difficulty", "durationDays", "durationNights"] as const) {
    if (c[field] !== null && !c.provenance?.[field]) add(field, "Falta identificar la procedencia de este dato.");
  }
  for (const issue of c.sourceIssues ?? []) issues.push({ ...issue, type: "CONTRADICTION" });
  if (!c.prices.length) add("prices", "No se encontraron tarifas.");
  c.prices.forEach((p, index) => {
    const key = `prices.${index}`;
    if (p.amount === null) add(`${key}.amount`, "Importe ausente.", "MISSING_REQUIRED");
    if (p.currency !== "USD") add(`${key}.currency`, "Moneda ausente o incompatible con las tarifas USD del admin. No se convertirá automáticamente.", "INVALID_VALUE");
    if (!p.labelEs || !p.labelEn) add(`${key}.label`, "La tarifa necesita etiqueta ES/EN.");
    if (p.ageMin !== null && p.ageMax !== null && p.ageMin > p.ageMax) add(`${key}.ageMax`, "Rango de edades invertido.", "INVALID_VALUE");
    if (p.minPassengers != null && p.maxPassengers != null && p.minPassengers > p.maxPassengers) add(key, "Rango de pasajeros invertido.", "INVALID_VALUE");
    if (p.priceType !== "per_person" || p.minPassengers != null || p.maxPassengers != null || p.serviceMode) add(key, "Tarifa por grupo, pasajeros o modalidad, o sin unidad definida: el modelo de venta actual no puede representarla con seguridad.");
    if (p.source === "derived") {
      const calc = p.calculation;
      if (!calc || calc.discount > calc.baseAmount || p.amount === null || Math.abs((calc.baseAmount - calc.discount) - p.amount) > 0.005) add(`${key}.calculation`, "El cálculo derivado no coincide con el importe.", "INVALID_VALUE");
      if (calc && !c.prices.some((other) => other.source !== "derived" && other.amount === calc.baseAmount && other.currency === p.currency)) add(`${key}.calculation`, "La tarifa base del cálculo no aparece documentada.");
    }
    if (!p.source) add(`${key}.source`, "Falta procedencia del precio.");
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
    if (!day.titleEs || !day.titleEn) add(key, "Falta título de día ES/EN.");
    if (!day.items?.length) add(key, "Separar el itinerario en actividades con título y descripción ES/EN.");
    day.items?.forEach((item, itemIndex) => {
      if (!item.titleEs || !item.titleEn || !item.descriptionEs || !item.descriptionEn) add(`${key}.items.${itemIndex}`, "Actividad incompleta en ES/EN.");
      if (item.time && !validTime(item.time)) add(`${key}.items.${itemIndex}.time`, "Usar hora HH:mm o rango HH:mm - HH:mm documentado.", "INVALID_VALUE");
    });
  });
  c.conditions?.forEach((condition, i) => {
    if (!condition.titleEs || !condition.titleEn || !condition.descriptionEs || !condition.descriptionEn) add(`conditions.${i}`, "Condición incompleta en ES/EN.");
  });
  if (c.schedule) {
    if (c.schedule.frequency === "selected_days" && !c.schedule.days.length) add("schedule.days", "Faltan días de salida.");
    if (c.schedule.times.some((time) => !validTime(time))) add("schedule.times", "Horario inválido.", "INVALID_VALUE");
    if (c.schedule.dates.length) add("schedule.dates", "Las fechas específicas requieren configurar capacidad y salidas en el admin; no se inventarán.");
    if (Boolean(c.schedule.notesEs) !== Boolean(c.schedule.notesEn)) add("schedule", "Traducir las notas de horarios.");
  }
  if (!c.imageSuggestions?.length) add("imageSuggestions", "Faltan sugerencias visuales basadas en el documento.");
  if (c.imageSuggestions?.length && !c.imageSuggestions.some((s) => s.recommendedForCover)) add("imageSuggestions", "Seleccionar una sugerencia de portada.");
  return issues;
}

export function validTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d(?:\s*-\s*(?:[01]\d|2[0-3]):[0-5]\d)?$/.test(value);
}
