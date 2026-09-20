import { describe, it, expect } from "vitest";

/**
 * Clasificación de la respuesta de /v2/charges de Culqi.
 *
 * Culqi responde HTTP 200 a cosas que NO son un cobro, así que mirar sólo el
 * código HTTP marcaba reservas como pagadas sin que entrara dinero. Los
 * payloads de abajo son REALES, copiados de `Payment.gatewayResponse` en la
 * base de datos tras los cobros de prueba.
 *
 * Se replica aquí el predicado de `culqiCharge.createCharge`.
 */
function isApprovedCharge(httpOk: boolean, charge: any): boolean {
  return (
    httpOk &&
    charge?.object === "charge" &&
    typeof charge.id === "string" &&
    charge.outcome?.type === "venta_exitosa"
  );
}

// Venta autorizada de verdad (respuesta real, recortada).
const APROBADO = {
  id: "chr_live_SjFoEx1Mww7jt4yv",
  object: "charge",
  amount: 100,
  paid: false, // ← sí, `false` en una venta exitosa: se refiere a la liquidación
  outcome: {
    code: "AUT0000",
    type: "venta_exitosa",
    user_message: "Su compra ha sido exitosa",
    merchant_message: "La operación de venta ha sido autorizada exitosamente",
  },
};

// 3D Secure pendiente (respuesta real): ni `object` ni `id`. El cobro NO se hizo.
const REVIEW_3DS = {
  action_code: "REVIEW",
  user_message: "El usuario necesita autenticarse",
};

// Rechazo antifraude: sí hay objeto charge, pero denegado.
const DENEGADO = {
  id: "chr_live_HCGpvR1vvqARhbso",
  object: "charge",
  amount: 100,
  outcome: {
    code: "DNGE0003",
    type: "operacion_denegada",
    user_message: "La compra no ha podido ser procesada. Contácte con la entidad emisora de su tarjeta.",
    merchant_message: "Sospecha de fraude",
  },
};

describe("Culqi: qué cuenta como cobro realizado", () => {
  it("acepta una venta autorizada", () => {
    expect(isApprovedCharge(true, APROBADO)).toBe(true);
  });

  it("RECHAZA un 3D Secure pendiente aunque llegue con HTTP 200", () => {
    // El bug: esto marcaba la reserva como pagada y guardaba culqiChargeId vacío.
    expect(isApprovedCharge(true, REVIEW_3DS)).toBe(false);
  });

  it("RECHAZA una operación denegada por antifraude", () => {
    expect(isApprovedCharge(true, DENEGADO)).toBe(false);
  });

  it("no se fía de `paid`, que viene false incluso en ventas exitosas", () => {
    expect(APROBADO.paid).toBe(false);
    expect(isApprovedCharge(true, APROBADO)).toBe(true);
    // Y un denegado no se salva por tener paid true
    expect(isApprovedCharge(true, { ...DENEGADO, paid: true })).toBe(false);
  });

  it("rechaza respuestas de error explícitas", () => {
    expect(isApprovedCharge(false, { object: "error", type: "card_error" })).toBe(false);
    expect(isApprovedCharge(true, { object: "error", type: "parameter_error", param: "amount" })).toBe(false);
  });

  it("rechaza un charge sin id o sin outcome", () => {
    expect(isApprovedCharge(true, { object: "charge", outcome: { type: "venta_exitosa" } })).toBe(false);
    expect(isApprovedCharge(true, { object: "charge", id: "chr_x" })).toBe(false);
  });

  it("rechaza respuestas vacías o inesperadas", () => {
    expect(isApprovedCharge(true, null)).toBe(false);
    expect(isApprovedCharge(true, {})).toBe(false);
    expect(isApprovedCharge(true, "ok")).toBe(false);
  });
});

describe("Culqi: mensaje que ve el cliente", () => {
  function messageFor(charge: any): string {
    const isIntegrationError = charge?.type === "parameter_error" && !!charge?.param;
    const needs3DS = charge?.action_code === "REVIEW";
    if (isIntegrationError) return `Error de configuración de la pasarela (campo: ${charge.param})`;
    if (needs3DS) return "3DS";
    return (
      charge?.outcome?.user_message ||
      charge?.user_message ||
      charge?.outcome?.merchant_message ||
      charge?.merchant_message ||
      "Tu banco no autorizó el pago. Prueba con otra tarjeta o paga con PayPal."
    );
  }

  it("al denegado le muestra el motivo de Culqi, no un error técnico", () => {
    expect(messageFor(DENEGADO)).toContain("entidad emisora");
    expect(messageFor(DENEGADO)).not.toContain("configuración");
  });

  it("distingue el 3D Secure pendiente", () => {
    expect(messageFor(REVIEW_3DS)).toBe("3DS");
  });

  it("sólo habla de configuración cuando Culqi nombra el campo", () => {
    expect(messageFor({ type: "parameter_error", param: "amount" })).toContain("campo: amount");
    // Regla antifraude: mismo tipo, sin campo → mensaje de Culqi tal cual
    expect(messageFor({ type: "parameter_error", user_message: "Excede el límite semanal" }))
      .toBe("Excede el límite semanal");
  });

  it("nunca deja al cliente sin explicación", () => {
    expect(messageFor({}).length).toBeGreaterThan(0);
  });
});
