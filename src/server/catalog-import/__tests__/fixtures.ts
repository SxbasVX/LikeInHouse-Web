import type { CatalogTourCandidate } from "../schemas";

export function readyCandidate(): CatalogTourCandidate {
  const provenance = Object.fromEntries(["category", "difficulty", "durationDays", "durationNights"].map((key) => [key, { source: "document" as const, requiresReview: false, sourcePages: [2], evidence: "Dato presente en la ficha de prueba." }]));
  return {
    schemaVersion: 2, sourceDocument: "catalogo.pdf", sourcePages: [2, 3], slug: "cusco-tour",
    category: "Cultura", destination: "Cusco", difficulty: "EASY", durationDays: 2, durationNights: 1, durationHours: null,
    nameEs: "Tour Cusco", nameEn: "Cusco Tour", shortDescEs: "Recorrido cultural en Cusco.", shortDescEn: "Cultural journey in Cusco.",
    longDescEs: "Recorrido cultural con las actividades indicadas en el documento.", longDescEn: "A cultural journey featuring the activities described in the document.",
    metaTitleEs: "Recorrido cultural en Cusco", metaTitleEn: "Cusco cultural tour", metaDescEs: "Descubre el recorrido cultural de Cusco.", metaDescEn: "Discover the Cusco cultural route.",
    prices: [{ labelEs: "Adulto", labelEn: "Adult", ageMin: null, ageMax: null, amount: 100, currency: "USD", priceType: "per_person", source: "document" }],
    itinerary: [{ dayNumber: 1, titleEs: "Recorrido cultural", titleEn: "Cultural route", descriptionEs: null, descriptionEn: null, items: [
      { time: "08:00", titleEs: "Recojo", titleEn: "Pickup", descriptionEs: "Recojo en el punto indicado.", descriptionEn: "Pickup at the stated location." },
      { time: null, titleEs: "Recorrido", titleEn: "Tour", descriptionEs: "Visitamos el atractivo documentado.", descriptionEn: "We visit the documented attraction." },
    ] }],
    includesEs: ["Transporte."], includesEn: ["Transportation."], excludesEs: ["Almuerzo."], excludesEn: ["Lunch."],
    conditionsEs: [], conditionsEn: [], conditions: [{ type: "GENERAL", titleEs: "Documentación", titleEn: "Documentation", descriptionEs: "Llevar documento de identidad.", descriptionEn: "Bring an identity document." }],
    imageSuggestions: [{ order: 1, subject: "Cusco", recommendedForCover: true, reason: "Destino indicado en el documento." }],
    provenance, sourceIssues: [], attractions: ["Cusco"], schedule: null,
  };
}
