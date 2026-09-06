import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { sanitizeName, sanitizePhone, toCountryCode } from "@/server/lib/payer";

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
        select: {
          id: true,
          referenceCode: true,
          status: true,
          totalAmount: true,
          currency: true,
          client: {
            select: { firstName: true, lastName: true, email: true, phone: true, country: true },
          },
        },
      });
      if (!reservation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva no encontrada" });
      }
      if (reservation.status === "PAID" || reservation.status === "CONFIRMED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta reserva ya fue pagada" });
      }

      // El monto y la moneda los decide el servidor a partir de la reserva:
      // antes se cobraba el valor que enviaba el navegador, así que cualquiera
      // podía pagar 1 céntimo. Un desfase entre lo cobrado y la reserva es
      // además una de las señales que Culqi marca como sospechosa.
      if (currency !== reservation.currency) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La moneda del pago no coincide con la reserva",
        });
      }
      const expectedAmount = Math.round(Number(reservation.totalAmount) * 100);
      if (amount !== expectedAmount) {
        console.error("[Culqi Charges] Amount mismatch:", {
          referenceCode: reservation.referenceCode,
          received: amount,
          expected: expectedAmount,
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El monto del pago no coincide con la reserva",
        });
      }

      // El correo de la reserva es la fuente de verdad: enviar a Culqi un
      // email distinto al del cliente registrado eleva el score de riesgo.
      const payerEmail = reservation.client.email || email;

      const secretKey = process.env.CULQI_SECRET_KEY;
      if (!secretKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Pasarela de pago no configurada" });
      }

      // 2. Crear cargo en Culqi
      //
      // IMPORTANTE: /v2/charges usa `antifraud_details` (snake_case), NO
      // `client_details` — ese último sólo existe en /v2/orders. Enviar la
      // clave equivocada hacía que Culqi descartara por completo los datos
      // del cliente y su motor antifraude marcara el cargo como sospechoso.
      // Sólo se incluyen los campos que realmente tienen valor: un
      // placeholder ("Cliente", "Web") es peor que la ausencia del campo.
      const antifraudDetails: Record<string, string> = {};
      const firstName = sanitizeName(reservation.client.firstName);
      const lastName = sanitizeName(reservation.client.lastName);
      const phone = sanitizePhone(reservation.client.phone);
      if (firstName) antifraudDetails.first_name = firstName;
      if (lastName) antifraudDetails.last_name = lastName;
      if (phone) antifraudDetails.phone_number = phone;
      antifraudDetails.country_code = toCountryCode(reservation.client.country);
      // `address` y `address_city` se omiten a propósito: el checkout no pide
      // dirección y rellenarlos con el país sería dato falso, que es justo lo
      // que el antifraude penaliza.

      const chargeRes = await fetch("https://api.culqi.com/v2/charges", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: expectedAmount,
          currency_code: currency,
          email: payerEmail,
          source_id: token,
          description: `Reserva ${reservation.referenceCode} - Like In House`.slice(0, 80),
          capture: true,
          antifraud_details: antifraudDetails,
          metadata: {
            reservation_id: reservationId,
            reference_code: reservation.referenceCode,
          },
        }),
      });

      const charge = await chargeRes.json();

      if (!chargeRes.ok || charge.object === "error") {
        console.error("[Culqi Charges] Request failed:", {
          status: chargeRes.status,
          referenceCode: reservation.referenceCode,
          antifraudKeys: Object.keys(antifraudDetails),
          response: charge,
        });
        // Un `parameter_error` es un fallo NUESTRO de integración, no un
        // rechazo de la tarjeta: el user_message de Culqi en ese caso es
        // genérico y esconde el campo culpable. Lo exponemos para poder
        // diagnosticarlo sin tener que entrar a los logs de Vercel.
        const isParamError = charge.type === "parameter_error";
        const msg = isParamError
          ? `Error de configuración de la pasarela${charge.param ? ` (campo: ${charge.param})` : ""}: ${
              charge.merchant_message || charge.user_message || "parámetro inválido"
            }`
          : charge.user_message ||
            charge.merchant_message ||
            "Error al procesar el pago con tarjeta";
        throw new TRPCError({ code: "BAD_REQUEST", message: msg });
      }

      // 3. Guardar pago y confirmar reserva en una transacción
      const amountDecimal = expectedAmount / 100; // centavos → unidades

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
          totalAmount: true,
          currency: true,
          client: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
      });
      if (!reservation) throw new TRPCError({ code: "NOT_FOUND", message: "Reserva no encontrada" });
      if (reservation.status === "PAID" || reservation.status === "CONFIRMED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta reserva ya fue pagada" });
      }

      // El monto lo decide el servidor, no el navegador (ver createCharge).
      // Orders API sólo admite PEN, así que la reserva debe estar en PEN.
      if (reservation.currency !== "PEN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Los métodos de billetera y banca móvil sólo están disponibles en soles (PEN)",
        });
      }
      const expectedAmount = Math.round(Number(reservation.totalAmount) * 100);
      if (amount !== expectedAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El monto del pago no coincide con la reserva",
        });
      }
      const payerEmail = reservation.client.email || email;

      const secretKey = process.env.CULQI_SECRET_KEY;
      if (!secretKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Pasarela de pago no configurada" });
      }

      // Culqi exige: expiration_date entre now+10min y now+9d; tomamos +24h
      const expirationDate = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
      // order_number: único por merchant, alfanumérico + guiones. Max 50 chars.
      const orderNumber = `${reservation.referenceCode}-${Date.now()}`.slice(0, 50);

      // Culqi exige client_details completo en /v2/orders (first_name,
      // last_name, email, phone_number). Se envían los datos reales del
      // cliente saneados; si faltan, rechazamos en vez de inventar
      // placeholders — datos falsos hacen que Culqi marque la orden como
      // sospechosa y el cobro nunca se procesa.
      const firstName = sanitizeName(reservation.client.firstName);
      const lastName = sanitizeName(reservation.client.lastName);
      const phoneNumber = sanitizePhone(reservation.client.phone);

      if (!firstName || !lastName || !phoneNumber) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Para pagar con billetera o banca móvil necesitamos tu nombre, apellido y teléfono completos. Escríbenos por WhatsApp para completarlos.",
        });
      }

      const payload = {
        amount: expectedAmount,
        currency_code: "PEN",
        description: `Reserva ${reservation.referenceCode} - Like In House`.slice(0, 80),
        order_number: orderNumber,
        client_details: {
          first_name: firstName,
          last_name: lastName,
          email: payerEmail,
          phone_number: phoneNumber,
        },
        expiration_date: expirationDate,
        confirm: false,
        metadata: {
          reservation_id: reservationId,
          reference_code: reservation.referenceCode,
        },
      };

      const res = await fetch("https://api.culqi.com/v2/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const order = await res.json();
      if (!res.ok || order.object === "error") {
        console.error("[Culqi Orders] Request failed:", {
          status: res.status,
          payload: { ...payload, client_details: { ...payload.client_details, email: "***" } },
          response: order,
        });
        const msg =
          order.user_message ||
          order.merchant_message ||
          (order.errors && order.errors[0]?.message) ||
          "Error al crear la orden de pago";
        throw new TRPCError({ code: "BAD_REQUEST", message: msg });
      }

      return { orderId: order.id as string };
    }),
});
