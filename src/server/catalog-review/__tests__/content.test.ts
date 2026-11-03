import { describe, expect, it } from "vitest";
import { buildProposedContent, changedGroups, extractTimes, keepsTimes, sameGroup, withGroup, type TourContent, type TourProposal } from "../content";

const before: TourContent = {
  nameEs: "Tour Uros", nameEn: "Uros tour", shortDescEs: "Visita a Uros.", shortDescEn: "Visit Uros.",
  longDescEs: "Texto largo.", longDescEn: "Long text.", metaTitleEs: null, metaTitleEn: null, metaDescEs: null, metaDescEn: null,
  itinerary: [{ id: "d1", dayNumber: 1, titleEs: "Uros", titleEn: "Uros", descriptionEs: "**7:45 a. m. | Recojo**\n\nRecojo del hotel.\n\n**14:00 | Almuerzo**\n\nAlmuerzo típico.", descriptionEn: "Pickup and lunch." }],
  includes: [{ id: "e1", type: "EXCLUDE", textEs: "propinas", textEn: "tips" }, { id: "i1", type: "INCLUDE", textEs: "transporte", textEn: "transport" }],
  conditions: [{ id: "c1", type: "GENERAL", textEs: "llevar zapatillas", textEn: "wear sneakers" }],
};

const proposal = (overrides: Partial<TourProposal> = {}): TourProposal => ({
  nameEs: "Tour Uros 1D – Islas flotantes del Titicaca", nameEn: "Uros Tour 1D – Floating islands of Titicaca",
  shortDescEs: "Descubre las islas flotantes de los Uros en el lago Titicaca.", shortDescEn: "Discover the Uros floating islands on Lake Titicaca.",
  longDescEs: "Navega hacia los Uros y conoce su cultura.", longDescEn: "Sail to the Uros and meet their culture.",
  metaTitleEs: "Tour Uros desde Puno", metaTitleEn: "Uros tour from Puno", metaDescEs: "Reserva tu visita a los Uros.", metaDescEn: "Book your Uros visit.",
  itinerary: [{ dayNumber: 1, titleEs: "Islas flotantes", titleEn: "Floating islands", items: [
    { time: "07:45", titleEs: "Recojo desde el hotel", titleEn: "Hotel pickup", descriptionEs: "Te recogemos en tu hotel.", descriptionEn: "We pick you up at your hotel." },
    { time: "14:00", titleEs: "Almuerzo típico", titleEn: "Traditional lunch", descriptionEs: "Almuerzo con una familia local.", descriptionEn: "Lunch with a local family." },
  ] }],
  includes: [{ id: "e1", textEs: "Propinas.", textEn: "Tips." }, { id: "i1", textEs: "Transporte turístico.", textEn: "Tourist transport." }],
  conditions: [{ id: "c1", type: "PHYSICAL", textEs: "Lleva zapatillas cómodas.", textEn: "Wear comfortable sneakers." }],
  notes: [],
  ...overrides,
});

describe("catalog review proposals", () => {
  it("normalizes 24-hour and a. m./p. m. times the same way", () => {
    expect(extractTimes("7:45 a. m. y 02:00 p.m. luego 14:00, 12:30 am")).toEqual(["00:30", "07:45", "14:00"]);
  });

  it("accepts a faithful rewrite and renders the uniform itinerary format", () => {
    const { after, rejected } = buildProposedContent(before, proposal());
    expect(rejected).toEqual({});
    expect(after.itinerary[0].descriptionEs).toBe("**07:45 a. m. | Recojo desde el hotel**\n\nTe recogemos en tu hotel.\n\n**02:00 p. m. | Almuerzo típico**\n\nAlmuerzo con una familia local.");
    expect(after.conditions[0].type).toBe("PHYSICAL");
    expect(changedGroups(before, after)).toEqual(["name", "shortDesc", "longDesc", "seo", "itinerary", "includes", "conditions"]);
  });

  it("rejects an itinerary that invents, moves or drops a time", () => {
    const moved = proposal(); moved.itinerary[0].items[1].time = "13:00";
    expect(buildProposedContent(before, moved).rejected.itinerary).toMatch(/horas no coinciden/);
    const added = proposal(); added.itinerary[0].items.push({ time: "18:00", titleEs: "Cena", titleEn: "Dinner", descriptionEs: null, descriptionEn: null });
    expect(buildProposedContent(before, added).rejected.itinerary).toMatch(/horas no coinciden/);
    const { after } = buildProposedContent(before, moved);
    expect(after.itinerary).toEqual(before.itinerary);
  });

  it("rejects a different number of days and lists that add or remove items", () => {
    const extraDay = proposal(); extraDay.itinerary.push({ ...extraDay.itinerary[0], dayNumber: 2 });
    expect(buildProposedContent(before, extraDay).rejected.itinerary).toMatch(/supera los 1 días/);
    const lessIncludes = proposal({ includes: [{ id: "i1", textEs: "Transporte.", textEn: "Transport." }] });
    expect(buildProposedContent(before, lessIncludes).rejected.includes).toBeTruthy();
    const otherCondition = proposal({ conditions: [{ id: "c9", type: "GENERAL", textEs: "Nueva política.", textEn: "New policy." }] });
    expect(buildProposedContent(before, otherCondition).rejected.conditions).toBeTruthy();
  });

  it("keeps current text when a proposal is too long", () => {
    const { after, rejected } = buildProposedContent(before, proposal({ shortDescEs: "a".repeat(161) }));
    expect(rejected.shortDesc).toBeTruthy();
    expect(after.shortDescEs).toBe(before.shortDescEs);
  });

  it("applies and undoes one group without touching the others", () => {
    const { after } = buildProposedContent(before, proposal());
    const applied = withGroup(before, after, "name");
    expect(applied.nameEs).toBe(after.nameEs);
    expect(sameGroup(applied, before, "shortDesc")).toBe(true);
    expect(withGroup(applied, before, "name")).toEqual(before);
  });

  it("moves an itinerary written inside the description into new itinerary days, applied together", () => {
    const inDescription: TourContent = { ...before, itinerary: [], longDescEs: "4:20 AM Recojo en Lima. Primera parada en Paracas. 4:30 pm retorno a Lima." };
    const moved = proposal({ longDescEs: "Vive un día lleno de mar y aventura en Paracas.", itinerary: [{ dayNumber: 1, titleEs: "Paracas", titleEn: "Paracas", items: [
      { time: "04:20", titleEs: "Recojo en Lima", titleEn: "Pickup in Lima", descriptionEs: "Te recogemos en tu hotel.", descriptionEn: "Hotel pickup." },
      { time: null, labelEs: "Mañana", labelEn: "Morning", titleEs: "Parada en Paracas", titleEn: "Stop in Paracas", descriptionEs: null, descriptionEn: null },
      { time: "16:30", titleEs: "Retorno a Lima", titleEn: "Return to Lima", descriptionEs: null, descriptionEn: null },
    ] }] });
    const result = buildProposedContent(inDescription, moved, 1);
    expect(result.rejected.itinerary).toBeUndefined();
    expect(result.linked).toEqual(["longDesc", "itinerary"]);
    expect(result.after.itinerary).toEqual([expect.objectContaining({ id: "new-day-1", dayNumber: 1, descriptionEs: expect.stringContaining("**04:20 a. m. | Recojo en Lima**") })]);
    expect(keepsTimes(inDescription, result.after, ["longDesc"])).toBe(false);
    expect(keepsTimes(inDescription, result.after, ["longDesc", "itinerary"])).toBe(true);
  });

  it("never lets a description drop times that don't reach the itinerary", () => {
    const inDescription: TourContent = { ...before, itinerary: [], longDescEs: "4:20 AM recojo y 4:30 pm retorno." };
    const lost = proposal({ longDescEs: "Vive Paracas.", itinerary: [{ dayNumber: 1, titleEs: "Paracas", titleEn: "Paracas", items: [{ time: "04:20", titleEs: "Recojo", titleEn: "Pickup", descriptionEs: null, descriptionEn: null }] }] });
    const result = buildProposedContent(inDescription, lost, 1);
    expect(result.rejected.itinerary).toMatch(/horas no coinciden/);
    expect(result.rejected.longDesc).toBeTruthy();
    expect(result.after.longDescEs).toBe(inDescription.longDescEs);
  });

  it("moves an Incluye list written in the description, but never accepts services that aren't there", () => {
    const withList: TourContent = { ...before, longDescEs: "Gran tour. Incluye: transporte turístico desde Lima, desayuno buffet. No incluye: entradas al museo." };
    const moved = proposal({ longDescEs: "Gran tour por la costa.", includes: [
      { id: "e1", textEs: "Propinas.", textEn: "Tips." }, { id: "i1", textEs: "Transporte turístico.", textEn: "Tourist transport." },
      { id: null, type: "INCLUDE", textEs: "Desayuno buffet.", textEn: "Buffet breakfast." },
      { id: null, type: "EXCLUDE", textEs: "Entradas al museo.", textEn: "Museum tickets." },
    ] });
    const ok = buildProposedContent(withList, moved);
    expect(ok.rejected.includes).toBeUndefined();
    expect(ok.linked).toEqual(expect.arrayContaining(["longDesc", "includes"]));
    expect(ok.after.includes.map((i) => [i.type, i.textEs])).toEqual([["EXCLUDE", "Propinas."], ["EXCLUDE", "Entradas al museo."], ["INCLUDE", "Transporte turístico."], ["INCLUDE", "Desayuno buffet."]]);

    const invented = proposal({ longDescEs: "Gran tour por la costa.", includes: [...moved.includes, { id: null, type: "INCLUDE", textEs: "Almuerzo marino.", textEn: "Seafood lunch." }] });
    const bad = buildProposedContent(withList, invented);
    expect(bad.rejected.includes).toMatch(/Almuerzo marino/);
    expect(bad.rejected.longDesc).toBeTruthy();
    expect(bad.after.longDescEs).toBe(withList.longDescEs);
  });

  it("links description and a new itinerary even when the description had no times", () => {
    const noTimes: TourContent = { ...before, itinerary: [], longDescEs: "Día 1: visita a Uros. Día 2: Taquile y retorno." };
    const moved = proposal({ longDescEs: "Vive el Titicaca.", itinerary: [
      { dayNumber: 1, titleEs: "Uros", titleEn: "Uros", items: [{ time: null, titleEs: "Visita a Uros", titleEn: "Visit Uros", descriptionEs: null, descriptionEn: null }] },
      { dayNumber: 2, titleEs: "Taquile", titleEn: "Taquile", items: [{ time: null, titleEs: "Taquile y retorno", titleEn: "Taquile and return", descriptionEs: null, descriptionEn: null }] },
    ] });
    expect(buildProposedContent(noTimes, moved, 2).linked).toEqual(["longDesc", "itinerary"]);
    const tooManyDays = buildProposedContent(noTimes, moved, 1);
    expect(tooManyDays.rejected.itinerary).toBeTruthy();
    expect(tooManyDays.rejected.longDesc).toBeTruthy();
    expect(tooManyDays.after.longDescEs).toBe(noTimes.longDescEs);
  });

  it("rejects a reply that repeats an include id instead of crashing", () => {
    const repeated = proposal({ includes: [{ id: "i1", textEs: "Transporte.", textEn: "Transport." }, { id: "i1", textEs: "Transporte.", textEn: "Transport." }] });
    expect(buildProposedContent(before, repeated).rejected.includes).toBeTruthy();
  });
});
