import { describe, it, expect } from "vitest";
import { formatMoney, formatDate, formatDateTime, formatTimestampDate } from "@/lib/format";
import { formatTrpcError, parseTrpcError } from "@/lib/trpc-error";
import { STATUS, getStatusStyle, statusLabel, statusOptions } from "@/lib/status";
import { getBreadcrumbs, isNavActive } from "@/components/admin/nav-config";

const plain = (s: string) => s.replace(/ | /g, " ");

describe("formatMoney", () => {
  it("formatea USD y PEN con Intl es-PE", () => {
    expect(plain(formatMoney(1234.5, "USD"))).toMatch(/1,234\.50/);
    // El símbolo depende de la versión de ICU ("USD" en Node, "US$" en algunos navegadores).
    expect(plain(formatMoney(1234.5, "USD"))).toMatch(/USD|\$/);
    expect(plain(formatMoney(120, "PEN"))).toMatch(/^S\/ ?120\.00$/);
  });

  it("acepta strings/Decimal y valores vacíos", () => {
    expect(plain(formatMoney("99.9", "USD"))).toMatch(/99\.90/);
    expect(plain(formatMoney(null, "USD"))).toMatch(/0\.00/);
  });

  it("permite ocultar decimales sin cambiar el monto", () => {
    expect(plain(formatMoney(1234.4, "USD", { maximumFractionDigits: 0 }))).toMatch(/1,234$/);
  });

  it("no revienta con un código de moneda inválido", () => {
    expect(formatMoney(5, "XX")).toBe("XX 5.00");
  });
});

describe("fechas", () => {
  it("las fechas de viaje (medianoche UTC) no se corren al día anterior", () => {
    expect(formatDate("2026-03-01T00:00:00.000Z")).toBe("1/3/2026");
  });

  it("las marcas de tiempo se muestran en hora de Lima", () => {
    // 02:00 UTC del 2 de marzo = 21:00 del 1 de marzo en Lima (UTC-5)
    expect(formatTimestampDate("2026-03-02T02:00:00.000Z")).toBe("1/3/2026");
    expect(plain(formatDateTime("2026-03-02T02:00:00.000Z"))).toMatch(/^1\/03\/26,? (21:00|9:00 p\. ?m\.)$/);
  });

  it("devuelve el fallback si falta la fecha o es inválida", () => {
    expect(formatDate(null, {}, "Sin fecha")).toBe("Sin fecha");
    expect(formatDate("no-es-fecha", {}, "—")).toBe("—");
  });
});

describe("formatTrpcError", () => {
  it("convierte issues de Zod en texto legible", () => {
    const message = JSON.stringify([
      { code: "too_small", path: ["nameEs"], message: "Nombre requerido" },
      { code: "invalid_type", path: ["pricing", "tiers", 0, "priceUsd"], message: "Expected number, received NaN" },
    ]);
    const parsed = parseTrpcError({ message });
    expect(parsed.issues).toEqual([
      { path: "nameEs", message: "Nombre requerido" },
      { path: "pricing > tiers > 0 > priceUsd", message: "Falta completar un número válido" },
    ]);
    expect(formatTrpcError({ message })).toBe(
      "nameEs: Nombre requerido · pricing > tiers > 0 > priceUsd: Falta completar un número válido",
    );
  });

  it("deja pasar mensajes normales y usa un texto por defecto si no hay mensaje", () => {
    expect(formatTrpcError(new Error("El slug ya existe"))).toBe("El slug ya existe");
    expect(formatTrpcError({})).toMatch(/error inesperado/);
    expect(formatTrpcError({ message: "[1,2]" })).toMatch(/error inesperado/);
  });
});

describe("status", () => {
  it("cada estado de un dominio tiene un color distinto", () => {
    for (const [domain, map] of Object.entries(STATUS)) {
      const classes = Object.values(map).map((s) => s.className);
      expect(new Set(classes).size, domain).toBe(classes.length);
    }
  });

  it("Confirmada y Pagada ya no comparten color", () => {
    expect(STATUS.reservation.CONFIRMED.className).not.toBe(STATUS.reservation.PAID.className);
  });

  it("estado desconocido cae a un estilo neutro con el valor crudo", () => {
    expect(getStatusStyle("payment", "WEIRD").label).toBe("WEIRD");
    expect(statusLabel("quotation", "SENT")).toBe("Enviada");
    expect(statusOptions("tour").map((o) => o.value)).toEqual(["DRAFT", "PUBLISHED", "ARCHIVED"]);
  });
});

describe("navegación admin", () => {
  it("activo sólo con ruta exacta o sub-ruta", () => {
    expect(isNavActive("/admin/tours", "/admin/tours")).toBe(true);
    expect(isNavActive("/admin/tours/abc/editar", "/admin/tours")).toBe(true);
    expect(isNavActive("/admin/toursx", "/admin/tours")).toBe(false);
    expect(isNavActive("/admin/tours", "/admin")).toBe(false);
  });

  it("arma breadcrumbs con enlaces a los segmentos padre", () => {
    expect(getBreadcrumbs("/admin")).toEqual([{ label: "Dashboard" }]);
    expect(getBreadcrumbs("/admin/promociones")).toEqual([
      { label: "Dashboard", href: "/admin" },
      { label: "Promociones" },
    ]);
    expect(getBreadcrumbs("/admin/tours/abc123/editar")).toEqual([
      { label: "Dashboard", href: "/admin" },
      { label: "Tours", href: "/admin/tours" },
      { label: "Editar tour" },
    ]);
    expect(getBreadcrumbs("/admin/documentos/nuevo").at(-1)).toEqual({ label: "Nuevo documento" });
    expect(getBreadcrumbs("/admin/documentos/x/editar").at(-1)).toEqual({ label: "Editar documento" });
    expect(getBreadcrumbs("/admin/reclamaciones/x").at(-1)).toEqual({ label: "Detalle" });
  });
});
