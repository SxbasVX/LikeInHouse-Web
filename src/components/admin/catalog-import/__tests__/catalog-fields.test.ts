import { describe, expect, it } from "vitest";
import { bucketOf, candidateSummary, fieldLabel, fieldTab, groupPending } from "../catalog-fields";

const issue = (id: string, field: string | null, checked = false, reason = "Revisar.") =>
  ({ id, type: "DATA_REVIEW", field, reason, valueA: null, valueB: null, checkedAt: checked ? new Date() : null });

describe("review checklist", () => {
  it("groups issues by field and only counts a field as seen when all its issues are", () => {
    const groups = groupPending([issue("1", "longDescEs", true), issue("2", "longDescEs"), issue("3", "nameEs", true)]);
    expect(groups.map((g) => [g.field, g.checked])).toEqual([["longDescEs", false], ["nameEs", true]]);
  });
  it("orders groups by review tab and surfaces Claude's suggestion", () => {
    const groups = groupPending([issue("1", "metaTitleEs"), issue("2", "prices.0.amount"), issue("3", "nameEs", false, "Sugerencia de Claude: tono comercial.")]);
    expect(groups.map((g) => g.tab)).toEqual(["general", "prices", "seo"]);
    expect(groups[0].suggestion?.id).toBe("3");
  });
});

describe("field labels", () => {
  it("names nested fields in plain Spanish and routes them to the right tab", () => {
    expect(fieldLabel("prices.1.amount")).toBe("Tarifa 2 · importe");
    expect(fieldLabel("itinerary.0.items.2.time")).toBe("Día 1 · actividad 3");
    expect(fieldTab("itinerary.0.items.2.time")).toBe("itinerary");
    expect(fieldTab("includesEn")).toBe("services");
    expect(fieldTab("unknownField")).toBe("general");
  });
  it("buckets statuses and summarizes candidates without trusting their shape", () => {
    expect(bucketOf("DUPLICATE")).toBe("review");
    expect(bucketOf("BLOCKED")).toBe("skipped");
    expect(candidateSummary({ nameEs: "  ", nameEn: "Lima tour", durationDays: 0, durationHours: 4 })).toEqual({ name: "Lima tour", destination: null, duration: "4 h" });
    expect(candidateSummary(null).name).toBe("Tour sin nombre");
  });
});
