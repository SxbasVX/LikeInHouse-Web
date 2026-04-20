import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "../trpc";

// ─── Tipo de cambio oficial SUNAT (vía apis.net.pe) ──────────────────────────
// Fuente: SUNAT publica el tipo de cambio diariamente. Este endpoint
// lo agrega y expone en JSON. Se usa el tipo "venta" (lo que paga el cliente).
async function fetchTipoCambioSunat(): Promise<number> {
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

  /**
   * Crea una Orden en Culqi (/v2/orders) necesaria para métodos alternativos:
   * Billeteras móviles, Banca móvil, Agentes/Bodegas, Cuotéalo BCP.
   * Tarjeta y Yape NO requieren orden.
   *
   * Solo soporta PEN: Culqi Orders API no admite USD.
   * La orden expira en 24h. El webhook order.status.changed confirmará el pago.
   */
  createOrder: publicProcedure
    .input(
      z.object({
        reservationId: z.string(),
        amount: z.number().int().positive(), // centavos PEN
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { reservationId, amount, email } = input;

      const reservation = await ctx.db.reservation.findUnique({
        where: { id: reservationId },
        select: {
          id: true,
          referenceCode: true,
          status: true,
          client: { select: { firstName: true, lastName: true, phone: true } },
        },
      });
      if (!reservation) throw new TRPCError({ code: "NOT_FOUND", message: "Reserva no encontrada" });
      if (reservation.status === "PAID" || reservation.status === "CONFIRMED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta reserva ya fue pagada" });
      }

      const secretKey = process.env.CULQI_SECRET_KEY;
      if (!secretKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Pasarela de pago no configurada" });
      }

      const expirationDate = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24h
      const orderNumber = `${reservation.referenceCode}-${Date.now()}`;

      const res = await fetch("https://api.culqi.com/v2/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency_code: "PEN",
          description: `Reserva ${reservation.referenceCode} - Like In House`,
          order_number: orderNumber,
          client_details: {
            first_name: reservation.client.firstName,
            last_name: reservation.client.lastName,
            email,
            phone_number: reservation.client.phone || "999999999",
          },
          expiration_date: expirationDate,
          confirm: false,
          metadata: {
            reservation_id: reservationId,
            reference_code: reservation.referenceCode,
          },
        }),
      });

      const order = await res.json();
      if (!res.ok || order.object === "error") {
        const msg =
          order.user_message ||
          order.merchant_message ||
          "Error al crear la orden de pago";
        throw new TRPCError({ code: "BAD_REQUEST", message: msg });
      }

      return { orderId: order.id as string };
    }),
});
