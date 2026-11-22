import { describe, expect, it } from "vitest";
import { parseTravelers, travelersHref, travelersToFilter } from "../family-travelers";

describe("parseTravelers", () => {
  it("lee la lista, ignora valores desconocidos y repetidos y ordena", () => {
    expect(parseTravelers("abuelos,ninos,ninos,piratas")).toEqual(["ninos", "abuelos"]);
    expect(parseTravelers(" Bebes ")).toEqual(["bebes"]);
  });
  it("sin valor no hay selección", () => {
    expect(parseTravelers(null)).toEqual([]);
    expect(parseTravelers("")).toEqual([]);
  });
});

describe("travelersToFilter", () => {
  it("usa la edad del menor del grupo", () => {
    expect(travelersToFilter(["ninos", "adolescentes"])).toEqual({ youngestAge: 3 });
    expect(travelersToFilter(["bebes", "adolescentes"])).toEqual({ youngestAge: 0 });
  });
  it("con abuelos pide tours fáciles, sin exigir edad", () => {
    expect(travelersToFilter(["abuelos"])).toEqual({ seniors: true });
    expect(travelersToFilter(["adolescentes", "abuelos"])).toEqual({ youngestAge: 12, seniors: true });
  });
  it("sin selección no filtra", () => {
    expect(travelersToFilter([])).toEqual({});
  });
});

describe("travelersHref", () => {
  it("arma la URL del catálogo", () => {
    expect(travelersHref(["abuelos", "ninos"])).toBe("/tours?viajan=ninos,abuelos");
    expect(travelersHref([])).toBe("/tours");
  });
});
