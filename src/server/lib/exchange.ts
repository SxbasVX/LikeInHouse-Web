import "server-only";

/**
 * Tipo de cambio oficial SUNAT (vía apis.net.pe).
 *
 * Fuente única del TC USD→PEN del servidor. El navegador NUNCA decide el tipo
 * de cambio con el que se guarda o se cobra una reserva: el valor que se le
 * muestra al usuario es informativo y el servidor recalcula con este.
 *
 * Se usa el tipo "venta" (lo que paga el cliente).
 */
export async function getUsdToPenRate(): Promise<number> {
  const FALLBACK = parseFloat(process.env.USD_TO_PEN_RATE_FALLBACK || "3.75");
  try {
    const res = await fetch("https://api.apis.net.pe/v1/tipo-cambio-sunat", {
      next: { revalidate: 14400 }, // caché Next.js: 4 horas
      headers: { Accept: "application/json", Referer: "https://likeinhouse.com" },
    });
    if (!res.ok) return FALLBACK;
    // { origen: "SUNAT", compra: 3.389, venta: 3.399, moneda: "USD", fecha: "2026-04-09" }
    const data = await res.json();
    const rate = parseFloat(data?.venta ?? "");
    return isNaN(rate) || rate <= 0 ? FALLBACK : rate;
  } catch {
    return FALLBACK;
  }
}
