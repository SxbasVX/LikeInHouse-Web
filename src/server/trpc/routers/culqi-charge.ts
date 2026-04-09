import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "../trpc";

// ─── Tipo de cambio BCRP (fuente oficial que usa SUNAT) ──────────────────────
const SPANISH_MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"];

function bcrpDate(d: Date) {
  return `${String(d.getDate()).padStart(2,"0")}${SPANISH_MONTHS[d.getMonth()]}${d.getFullYear()}`;
}

async function fetchTipoCambioSunat(): Promise<number> {
  const FALLBACK = parseFloat(process.env.USD_TO_PEN_RATE_FALLBACK || "3.75");
  try {
    const today = new Date();
    // Pedimos los últimos 5 días para asegurar tener un valor (fines de semana no hay publicación)
    const from = new Date(today);
    from.setDate(from.getDate() - 5);
    const url = `https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PD04637PD/json/${bcrpDate(from)}/${bcrpDate(today)}`;

    const res = await fetch(url, {
      next: { revalidate: 14400 }, // caché Next.js: 4 horas
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return FALLBACK;

    const data = await res.json();
    // La API devuelve períodos en orden, tomamos el último (más reciente)
    const periods: { values: string[] }[] = data?.periods ?? [];
    if (!periods.length) return FALLBACK;

    const last = periods[periods.length - 1];
    const rate = parseFloat(last.values?.[0] ?? "");
    return isNaN(rate) ? FALLBACK : rate;
  } catch {
    return FALLBACK;
  }
}

export const culqiChargeRouter = router({
  /**
   * Devuelve el tipo de cambio USD→PEN del BCRP (fuente oficial SUNAT).
   * Cacheado 4 horas en el servidor.
   */
  getExchangeRate: publicProcedure.query(async () => {
    const rate = await fetchTipoCambioSunat();
    return { rate, source: "BCRP" };
  }),

  /**
   * Crea un cargo en Culqi con el token generado en el cliente.
   * Recibe el token de Culqi.js, llama a la API de Culqi server-side
   * y guarda el pago en BD.
   */
  createCharge: publicProcedure
    .input(
      z.object({
        reservationId: z.string(),
        token: z.string().startsWith("tkn_"),
        currency: z.enum(["PEN", "USD"]),
        amount: z.number().int().positive(), // en centavos (ej: 15000 = S/150.00)
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { reservationId, token, currency, amount, email } = input;

      // 1. Verificar reserva
      const reservation = await ctx.db.reservation.findUnique({
        where: { id: reservationId },
        select: { id: true, referenceCode: true, status: true, totalAmount: true },
      });
      if (!reservation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva no encontrada" });
      }
      if (reservation.status === "PAID" || reservation.status === "CONFIRMED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta reserva ya fue pagada" });
      }

      const secretKey = process.env.CULQI_SECRET_KEY;
      if (!secretKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Pasarela de pago no configurada" });
      }

      // 2. Crear cargo en Culqi
      const chargeRes = await fetch("https://api.culqi.com/v2/charges", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency_code: currency,
          email,
          source_id: token,
          description: `Reserva ${reservation.referenceCode} - Like In House`,
          capture: true,
          metadata: {
            reservation_id: reservationId,
            reference_code: reservation.referenceCode,
          },
        }),
      });

      const charge = await chargeRes.json();

      if (!chargeRes.ok || charge.object === "error") {
        const msg =
          charge.user_message ||
          charge.merchant_message ||
          "Error al procesar el pago con tarjeta";
        throw new TRPCError({ code: "BAD_REQUEST", message: msg });
      }

      // 3. Guardar pago y confirmar reserva en una transacción
      const amountDecimal = amount / 100; // centavos → unidades

      await ctx.db.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            reservationId,
            amount: amountDecimal,
            currency,
            method: "CULQI_CARD",
            status: "COMPLETED",
            culqiChargeId: charge.id,
            gatewayResponse: charge as any,
            processedAt: new Date(),
          },
        });

        await tx.reservation.update({
          where: { id: reservationId },
          data: { status: "CONFIRMED" },
        });
      });

      return { success: true, chargeId: charge.id as string };
    }),
});
