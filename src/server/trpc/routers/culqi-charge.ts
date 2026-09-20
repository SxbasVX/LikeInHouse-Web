import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { sanitizeName, sanitizePhone, toCountryCode } from "@/server/lib/payer";
import { PAYMENT_CURRENCY } from "@/lib/currency";
import { sendPaymentConfirmationEmail } from "@/server/email/send-payment-confirmation";
import { sendWhatsAppAlert, sendWhatsAppToClient } from "@/server/lib/whatsapp";

/**
 * Cobros con Culqi.
 *
 * TODO cargo se emite en USD, sea cual sea la moneda en la que el pasajero
 * vio el precio. El importe no lo envía el navegador: se recalcula aquí a
 * partir de la reserva.
 *
 * Nota sobre métodos de pago: la Orders API de Culqi (billeteras, banca
 * móvil, agentes, Cuotéalo) y Yape operan únicamente en soles, así que no
 * son compatibles con el cobro en dólares y se retiraron del checkout.
 */
export const culqiChargeRouter = router({

  /**
   * Crea un cargo en Culqi con el token generado en el cliente.
   * Recibe el token de Culqi.js, llama a la API de Culqi server-side
   * y guarda el pago en BD.
   */
  createCharge: publicProcedure
    .input(
      z.object({
        reservationId: z.string(),
        // Culqi acepta como source_id un token de tarjeta (tkn_), uno de Yape
        // (ype_) o una tarjeta guardada (crd_), y exige exactamente 25
        // caracteres. Antes sólo se aceptaba `tkn_`, así que cualquier pago
        // con Yape se rechazaba aquí sin llegar siquiera a Culqi.
        // El spec dice 25 caracteres exactos, pero no lo imponemos aquí:
        // si Culqi cambiara el formato, una validación estricta nuestra
        // bloquearía pagos válidos. Validamos el prefijo y un rango amplio,
        // y dejamos que Culqi sea la autoridad sobre la longitud.
        token: z
          .string()
          .min(20)
          .max(40)
          .regex(/^(tkn|ype|crd)_[A-Za-z0-9_]+$/, "Token de pago inválido"),
        // Ni `currency` ni `amount` se aceptan desde el navegador: el cobro
        // es siempre en USD y el importe sale de la reserva.
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { reservationId, token, email } = input;

      // 1. Verificar reserva
      const reservation = await ctx.db.reservation.findUnique({
        where: { id: reservationId },
        select: {
          id: true,
          referenceCode: true,
          status: true,
          totalAmount: true,
          currency: true,
          paymentCurrency: true,
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

      // El importe y la moneda salen ÍNTEGRAMENTE de la reserva. El navegador
      // no participa: lo que el pasajero vio en su moneda local es una
      // conversión informativa que nunca llega hasta aquí.
      //
      // Las reservas antiguas guardadas en soles no se pueden cobrar por esta
      // vía (cobraríamos el número en la moneda equivocada), así que se
      // rechazan explícitamente en vez de emitir un cargo incorrecto.
      const reservationCurrency = reservation.paymentCurrency || reservation.currency;
      if (reservationCurrency !== PAYMENT_CURRENCY) {
        console.error("[Culqi Charges] Reserva en moneda no cobrable:", {
          referenceCode: reservation.referenceCode,
          reservationCurrency,
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Esta reserva se generó en otra moneda y no puede cobrarse en línea. Escríbenos por WhatsApp y la regularizamos.",
        });
      }
      const expectedAmount = Math.round(Number(reservation.totalAmount) * 100);

      // Límites duros de /v2/charges (OpenAPI oficial de Culqi): si se
      // sobrepasan, Culqi responde parameter_error y el pago no se procesa.
      // Es mejor avisar con un mensaje claro que dejar que falle en la pasarela.
      if (expectedAmount > 999900) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "El monto supera el máximo que admite el pago con tarjeta (USD 9,999). Escríbenos por WhatsApp para coordinar el pago.",
        });
      }
      if (expectedAmount < 100) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El monto es menor al mínimo que admite la pasarela.",
        });
      }

      // El correo de la reserva es la fuente de verdad: enviar a Culqi un
      // email distinto al del cliente registrado eleva el score de riesgo.
      // Culqi limita `email` a 50 caracteres; si el del cliente es más largo
      // usamos el del formulario antes que enviar uno truncado (inválido).
      const reservationEmail = reservation.client.email || email;
      const payerEmail = reservationEmail.length <= 50 ? reservationEmail : email;
      if (payerEmail.length > 50) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El correo es demasiado largo para la pasarela de pago (máx. 50 caracteres).",
        });
      }

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
          currency_code: PAYMENT_CURRENCY,
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

      // Un cargo sólo cuenta como cobrado si Culqi devuelve un objeto `charge`
      // con id y un `outcome.type` de venta exitosa.
      //
      // Comprobarlo importa muchísimo: Culqi responde HTTP 200 a cosas que NO
      // son un cobro. Un 3D Secure pendiente llega como
      // `{"action_code":"REVIEW","user_message":"El usuario necesita
      // autenticarse"}` —sin `object`, sin `id`— y un rechazo antifraude llega
      // como un charge con `outcome.type: "operacion_denegada"`. Antes sólo se
      // miraba `!chargeRes.ok || charge.object === "error"`, así que ambos
      // pasaban por buenos: la reserva quedaba PAGADA y el `culqiChargeId` se
      // guardaba vacío, sin que hubiera entrado un sol.
      //
      // `charge.paid` NO sirve como señal: viene `false` incluso en ventas
      // autorizadas (se refiere a la liquidación al comercio, no al cobro).
      const isApprovedCharge =
        chargeRes.ok &&
        charge?.object === "charge" &&
        typeof charge.id === "string" &&
        charge.outcome?.type === "venta_exitosa";

      if (!isApprovedCharge) {
        console.error("[Culqi Charges] Request failed:", {
          status: chargeRes.status,
          referenceCode: reservation.referenceCode,
          antifraudKeys: Object.keys(antifraudDetails),
          response: charge,
        });
        // Un `parameter_error` CON `param` es un fallo nuestro de integración:
        // se nombra el campo culpable para poder arreglarlo sin bucear en los
        // logs. Pero Culqi devuelve ese mismo tipo para cosas que no tienen
        // nada que ver con la integración —por ejemplo sus reglas antifraude
        // ("Excede el límite semanal de número de compras por correo")—, y
        // entonces decirle al cliente que hay un "error de configuración" es
        // confundirlo: el problema no es la web, es que la operación no pasa
        // el filtro. Sin `param`, se muestra el mensaje de Culqi tal cual.
        const isIntegrationError = charge.type === "parameter_error" && !!charge.param;

        // 3D Secure sin completar: el banco pide verificar al titular y el
        // cobro no llegó a hacerse. No es un rechazo de la tarjeta, así que
        // merece un mensaje que invite a reintentar.
        const needs3DS = charge?.action_code === "REVIEW";

        const msg = isIntegrationError
          ? `Error de configuración de la pasarela (campo: ${charge.param}): ${
              charge.merchant_message || charge.user_message || "parámetro inválido"
            }`
          : needs3DS
            ? "Tu banco pide una verificación adicional (3D Secure) que no se completó, así que el cobro no se realizó. Vuelve a intentarlo, prueba con otra tarjeta o paga con PayPal."
            : charge.outcome?.user_message ||
              charge.user_message ||
              charge.outcome?.merchant_message ||
              charge.merchant_message ||
              "Tu banco no autorizó el pago. Prueba con otra tarjeta o paga con PayPal.";
        throw new TRPCError({ code: "BAD_REQUEST", message: msg });
      }

      // 3. Guardar pago y confirmar reserva en una transacción
      const amountDecimal = expectedAmount / 100; // centavos → unidades

      await ctx.db.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            reservationId,
            amount: amountDecimal,
            currency: PAYMENT_CURRENCY,
            amountUsd: amountDecimal,
            method: "CULQI_CARD",
            status: "COMPLETED",
            culqiChargeId: charge.id,
            gatewayResponse: charge as any,
            processedAt: new Date(),
          },
        });

        // El cargo cubre el total de la reserva, así que queda PAGADA. Antes
        // se dejaba en CONFIRMED: el panel mostraba como "pendiente de pago"
        // una reserva ya cobrada, y no coincidía con PayPal ni con el webhook,
        // que sí ponen PAID.
        await tx.reservation.update({
          where: { id: reservationId },
          data: { status: "PAID" },
        });
      });

      // Avisos posteriores al cobro (fire-and-forget, nunca tumban el pago).
      //
      // Esto vivía SÓLO en el webhook de Culqi. Si el webhook no llegaba —por
      // no estar configurado en el panel de Culqi, o por fallar la firma— el
      // viajero pagaba y se quedaba con el correo de "reserva pendiente" que
      // se envía al crearla, sin confirmación ninguna. Aquí sabemos de
      // primera mano que el cargo se hizo, así que no dependemos de nadie.
      sendPaymentConfirmationEmail(reservation.referenceCode, amountDecimal, PAYMENT_CURRENCY);

      sendWhatsAppAlert(
        `🏦 *Pago Recibido vía Culqi (Tarjeta)*\nRef: ${reservation.referenceCode}\nMonto: ${PAYMENT_CURRENCY} ${amountDecimal}`
      ).catch(console.error);

      if (reservation.client.phone) {
        sendWhatsAppToClient(
          reservation.client.phone,
          `¡Hola ${reservation.client.firstName}! Confirmamos la recepción de tu pago por ${PAYMENT_CURRENCY} ${amountDecimal}.\n\nReserva: ${reservation.referenceCode}\n\n¡Gracias por tu compra en Like In House!`
        ).catch(console.error);
      }

      return { success: true, chargeId: charge.id as string };
    }),

});
