import { describe, expect, it } from "vitest";
import { formatItineraryTime, renderItineraryDay } from "../editorial";
import { parseItineraryDescription } from "@/lib/utils";
import { readyCandidate } from "./fixtures";

describe("itinerary as shown on the tour page", () => {
  it("shows times as a. m. / p. m., keeping the leading zero, also in ranges", () => {
    expect(formatItineraryTime("07:45", "Es")).toBe("07:45 a. m.");
    expect(formatItineraryTime("14:00", "Es")).toBe("02:00 p. m.");
    expect(formatItineraryTime("12:00", "Es")).toBe("12:00 p. m.");
    expect(formatItineraryTime("00:30", "En")).toBe("12:30 a.m.");
    expect(formatItineraryTime("14:00 - 16:30", "Es")).toBe("02:00 p. m. - 04:30 p. m.");
  });

  it("renders each activity as a heading line followed by its description", () => {
    const day = readyCandidate().itinerary[0];
    day.items = [
      { time: "07:45", titleEs: "Recojo desde el hotel", titleEn: "Hotel pickup", descriptionEs: "Recojo y traslado al puerto de Puno.", descriptionEn: "Pickup and transfer to Puno port." },
      { time: null, labelEs: "Tarde", labelEn: "Afternoon", titleEs: "Caminata y mirador", titleEn: "Hike and viewpoint", descriptionEs: "Subimos al mirador.", descriptionEn: "We hike to the viewpoint." },
      { time: null, titleEs: "Velada cultural opcional", titleEn: "Optional cultural evening", descriptionEs: null, descriptionEn: null },
    ];
    expect(parseItineraryDescription(renderItineraryDay(day, "Es"))).toEqual([
      { type: "heading", text: "07:45 a. m. | Recojo desde el hotel" },
      { type: "paragraph", text: "Recojo y traslado al puerto de Puno." },
      { type: "heading", text: "Tarde | Caminata y mirador" },
      { type: "paragraph", text: "Subimos al mirador." },
      { type: "heading", text: "Velada cultural opcional" },
    ]);
    expect(renderItineraryDay(day, "En")).toContain("**Afternoon | Hike and viewpoint**");
  });
});
