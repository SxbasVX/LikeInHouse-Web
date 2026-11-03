import type { CatalogTourCandidate } from "./schemas";

// Uses the existing Markdown paragraph renderer; only newly created drafts pass here.
// Each activity becomes "**07:45 a. m. | Recojo desde el hotel**" followed by its description paragraph.
export function renderItineraryDay(day: CatalogTourCandidate["itinerary"][number], locale: "Es" | "En"): string {
  if (!day.items?.length) return day[`description${locale}`] ?? "";
  return day.items.map((item) => {
    const moment = item.time ? formatItineraryTime(item.time, locale) : item[`label${locale}`];
    const heading = [moment, item[`title${locale}`]].filter(Boolean).join(" | ");
    const description = plain(item[`description${locale}`] ?? "");
    return description ? `**${plain(heading)}**\n\n${description}` : `**${plain(heading)}**`;
  }).join("\n\n");
}

// "07:45" -> "07:45 a. m." (ES) / "07:45 a.m." (EN); ranges "14:00 - 16:00" are formatted on both ends.
export function formatItineraryTime(value: string, locale: "Es" | "En"): string {
  return value.replace(/\b([01]\d|2[0-3]):([0-5]\d)\b/g, (_, h: string, m: string) => {
    const hour = Number(h), twelve = hour % 12 || 12;
    const suffix = locale === "Es" ? (hour < 12 ? "a. m." : "p. m.") : (hour < 12 ? "a.m." : "p.m.");
    return `${String(twelve).padStart(2, "0")}:${m} ${suffix}`;
  });
}

function plain(value: string): string {
  return value.replace(/\*\*/g, "").trim();
}

export function conditionRows(candidate: CatalogTourCandidate) {
  const rows = candidate.conditions?.length
    ? candidate.conditions.map((c, sortOrder) => ({
        type: c.type, textEs: [c.titleEs, c.descriptionEs].filter(Boolean).join(": "),
        textEn: [c.titleEn, c.descriptionEn].filter(Boolean).join(": "), sortOrder,
      }))
    : candidate.conditionsEs.map((textEs, sortOrder) => ({
        type: "GENERAL" as const, textEs, textEn: candidate.conditionsEn[sortOrder], sortOrder,
      }));
  const schedule = candidate.schedule;
  if (schedule) {
    const namesEs = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const namesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const frequencyEs = { daily: "Todos los días", selected_days: schedule.days.map((d) => namesEs[d]).join(", "), on_request: "Previa solicitud", unknown: "" };
    const frequencyEn = { daily: "Daily", selected_days: schedule.days.map((d) => namesEn[d]).join(", "), on_request: "On request", unknown: "" };
    const textEs = [frequencyEs[schedule.frequency], ...schedule.times, schedule.notesEs].filter(Boolean).join(" · ");
    const textEn = [frequencyEn[schedule.frequency], ...schedule.times, schedule.notesEn].filter(Boolean).join(" · ");
    if (textEs) rows.push({ type: "GENERAL", textEs: `Salidas: ${textEs}`, textEn: `Departures: ${textEn}`, sortOrder: rows.length });
  }
  return rows;
}
