import { db } from "./db";

/**
 * Devuelve el porcentaje del descuento global activo (0 si no hay).
 * Hay como máximo 1 GlobalDiscount activo por construcción (activate desactiva
 * el resto). Para fallos transitorios devuelve 0 sin lanzar.
 */
export async function getActiveGlobalDiscountPercent(): Promise<number> {
  try {
    const active = await db.globalDiscount.findFirst({
      where: { isActive: true },
      select: { percent: true },
    });
    if (!active) return 0;
    const pct = Number(active.percent);
    if (!isFinite(pct) || pct <= 0) return 0;
    return Math.min(pct, 100);
  } catch (err) {
    console.error("[GlobalDiscount] Lookup failed:", err);
    return 0;
  }
}
