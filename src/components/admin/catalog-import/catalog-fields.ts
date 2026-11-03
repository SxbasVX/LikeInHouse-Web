// Human labels and review-tab placement for candidate fields, shared by the inbox and the review page.

import { issueKind, type IssueKind } from "@/server/catalog-import/severity";

export type ReviewTab = "general" | "prices" | "itinerary" | "services" | "seo" | "advanced";

export const REVIEW_TABS: Array<{ value: ReviewTab; label: string }> = [
  { value: "general", label: "General" },
  { value: "prices", label: "Precios y salidas" },
  { value: "itinerary", label: "Itinerario" },
  { value: "services", label: "Servicios y condiciones" },
  { value: "seo", label: "SEO e imágenes" },
  { value: "advanced", label: "Avanzado" },
];

const LABELS: Record<string, string> = {
  nameEs: "Nombre (ES)", nameEn: "Nombre (EN)", slug: "Slug (URL)", category: "Categorías", destination: "Destino",
  difficulty: "Dificultad", durationDays: "Días", durationNights: "Noches", durationHours: "Horas",
  shortDescEs: "Descripción corta (ES)", shortDescEn: "Descripción corta (EN)", longDescEs: "Descripción completa (ES)", longDescEn: "Descripción completa (EN)",
  metaTitleEs: "Título SEO (ES)", metaTitleEn: "Título SEO (EN)", metaDescEs: "Descripción SEO (ES)", metaDescEn: "Descripción SEO (EN)",
  prices: "Tarifas", priceAdjustment: "Tipo de cambio y margen", schedule: "Salidas y horarios", itinerary: "Itinerario", attractions: "Atractivos", imageSuggestions: "Imágenes sugeridas",
  includesEs: "Incluye (ES)", includesEn: "Incluye (EN)", excludesEs: "No incluye (ES)", excludesEn: "No incluye (EN)",
  conditions: "Condiciones", conditionsEs: "Otras condiciones (ES)", conditionsEn: "Otras condiciones (EN)",
  tour: "Tour existente parecido", schema: "Estructura", processing: "Procesamiento", sourcePages: "Páginas del PDF",
};

const TAB_OF: Record<string, ReviewTab> = {
  prices: "prices", priceAdjustment: "prices", schedule: "prices", itinerary: "itinerary",
  includesEs: "services", includesEn: "services", excludesEs: "services", excludesEn: "services",
  conditions: "services", conditionsEs: "services", conditionsEn: "services",
  metaTitleEs: "seo", metaTitleEn: "seo", metaDescEs: "seo", metaDescEn: "seo", attractions: "seo", imageSuggestions: "seo",
  schema: "advanced", processing: "advanced",
};

const root = (field: string | null | undefined) => (field ?? "").split(".")[0];

export function fieldLabel(field: string | null | undefined): string {
  if (!field) return "General";
  const [head, index, sub, subIndex] = field.split(".");
  const base = LABELS[head] ?? head;
  if (head === "prices" && index) return `Tarifa ${Number(index) + 1}${sub ? ` · ${{ amount: "importe", currency: "moneda", label: "etiqueta", ageMax: "edades", calculation: "cálculo", source: "procedencia" }[sub] ?? sub}` : ""}`;
  if (head === "itinerary" && index) return `Día ${Number(index) + 1}${sub === "items" && subIndex ? ` · actividad ${Number(subIndex) + 1}` : ""}`;
  if (head === "conditions" && index) return `Condición ${Number(index) + 1}`;
  if (head === "schedule" && index) return `${base} · ${index === "days" ? "días" : index === "times" ? "horas" : "fechas"}`;
  return base;
}

export const fieldTab = (field: string | null | undefined): ReviewTab => TAB_OF[root(field)] ?? "general";

export const isClaudeSuggestion = (reason: string) => reason.startsWith("Sugerencia de Claude");

export interface PendingIssue { id: string; type: string; field: string | null; reason: string; valueA: string | null; valueB: string | null; checkedAt: Date | string | null }

/** kind: blocking = fix it in the form; confirm = tick and approve with a note; warning = ticking accepts it. */
export interface PendingGroup { field: string; label: string; tab: ReviewTab; issues: PendingIssue[]; checked: boolean; kind: IssueKind; suggestion: PendingIssue | null }
const KIND_RANK: Record<IssueKind, number> = { warning: 0, confirm: 1, blocking: 2 };

// One checklist row per field: checking it marks every open issue of that field as seen.
export function groupPending(issues: PendingIssue[]): PendingGroup[] {
  const groups = new Map<string, PendingGroup>();
  for (const issue of issues) {
    const field = issue.field ?? "general";
    const group: PendingGroup = groups.get(field) ?? { field, label: fieldLabel(field), tab: fieldTab(field), issues: [], checked: true, kind: "warning", suggestion: null };
    group.issues.push(issue);
    group.checked &&= Boolean(issue.checkedAt);
    const kind = issueKind(issue);
    if (KIND_RANK[kind] > KIND_RANK[group.kind]) group.kind = kind;
    if (isClaudeSuggestion(issue.reason)) group.suggestion = issue;
    groups.set(field, group);
  }
  const order = REVIEW_TABS.map((t) => t.value);
  return [...groups.values()].sort((a, b) => order.indexOf(a.tab) - order.indexOf(b.tab));
}

export type TourBucket = "review" | "ready" | "created" | "skipped";

export const TOUR_BUCKETS: Array<{ value: TourBucket; label: string; statuses: string[] }> = [
  { value: "review", label: "Por revisar", statuses: ["NEEDS_REVIEW", "DUPLICATE", "EXTRACTED"] },
  { value: "ready", label: "Listos para crear", statuses: ["READY", "VALIDATED"] },
  { value: "created", label: "Creados", statuses: ["DRAFT_CREATED"] },
  { value: "skipped", label: "Omitidos", statuses: ["BLOCKED", "FAILED"] },
];

export const bucketOf = (status: string): TourBucket => TOUR_BUCKETS.find((b) => b.statuses.includes(status))?.value ?? "review";

export function candidateSummary(data: unknown) {
  const c = (data ?? {}) as Record<string, unknown>;
  const text = (key: string) => (typeof c[key] === "string" && (c[key] as string).trim() ? (c[key] as string) : null);
  const days = typeof c.durationDays === "number" ? c.durationDays : null;
  const hours = typeof c.durationHours === "number" ? c.durationHours : null;
  const duration = days ? `${days} ${days === 1 ? "día" : "días"}` : hours ? `${hours} h` : null;
  return { name: text("nameEs") ?? text("nameEn") ?? "Tour sin nombre", destination: text("destination"), duration };
}

export function relativeTime(value: Date | string | null | undefined): string {
  if (!value) return "";
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 10) return "justo ahora";
  if (seconds < 60) return `hace ${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "ayer" : `hace ${days} días`;
}
