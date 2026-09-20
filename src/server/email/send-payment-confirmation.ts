import "server-only";
import { db } from "@/server/lib/db";
import { sendBookingEmail } from "./send-booking";

/**
 * Correo de confirmación tras un pago verificado.
 *
 * Es el ÚNICO sitio donde se arma este correo. Antes la lógica estaba
 * triplicada (webhook de Culqi, captura de PayPal) y el cobro con tarjeta de
 * `culqiCharge.createCharge` no la tenía en absoluto: el viajero pagaba y sólo
 * conservaba el correo de "reserva pendiente" que se envía al crearla.
 *
 * Fire-and-forget: nunca lanza, sólo registra el fallo. Un problema de correo
 * no puede tumbar un cobro que ya se hizo.
 */
export async function sendPaymentConfirmationEmail(
  referenceCode: string,
  paidAmount: number,
  currency: string
): Promise<void> {
  try {
    const res = await db.reservation.findUnique({
      where: { referenceCode },
      include: {
        client: { select: { firstName: true, lastName: true, email: true, phone: true } },
        tour: {
          select: {
            nameEs: true,
            shortDescEs: true,
            destination: true,
            durationDays: true,
            durationNights: true,
            durationHours: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            includes: {
              where: { type: "INCLUDE" },
              orderBy: { sortOrder: "asc" },
              select: { textEs: true },
            },
          },
        },
        departure: { select: { departureDate: true } },
      },
    });
    if (!res || !res.client?.email) return;

    // Reservation.paymentLink es sólo FK sin relación Prisma; query aparte.
    const link = res.paymentLinkId
      ? await db.paymentLink.findUnique({
          where: { id: res.paymentLinkId },
          select: { titleEs: true, descriptionEs: true, includesEs: true, totalAmount: true, amountPaid: true },
        })
      : null;

    const isPaymentLink = !!link;
    const totalAmount = link ? Number(link.totalAmount) : Number(res.totalAmount);
    const amountPaid = link ? Number(link.amountPaid) : paidAmount;

    await sendBookingEmail({
      referenceCode: res.referenceCode,
      type: isPaymentLink ? "PAYMENT_LINK" : "RESERVATION",
      serviceName: link ? link.titleEs : (res.tour?.nameEs || "Servicio"),
      serviceDescription: link ? link.descriptionEs : (res.tour?.shortDescEs || null),
      serviceImageUrl: res.tour?.images[0]?.url || null,
      serviceDestination: res.tour?.destination || null,
      serviceDurationLabel: res.tour
        ? res.tour.durationDays && res.tour.durationDays > 0
          ? `${res.tour.durationDays}D / ${res.tour.durationNights ?? Math.max(0, res.tour.durationDays - 1)}N`
          : res.tour.durationHours && res.tour.durationHours > 0
            ? `${res.tour.durationHours}h`
            : null
        : null,
      serviceIncludes: link ? link.includesEs : (res.tour?.includes.map((i) => i.textEs) || []),
      clientName: `${res.client.firstName} ${res.client.lastName}`,
      clientEmail: res.client.email,
      clientPhone: res.client.phone || null,
      amountPaid,
      totalAmount,
      currency,
      // Sin salida programada la fecha vive en `travelDate` (calendario
      // abierto): si no se mira, el correo sale sin fecha.
      dateStr: (() => {
        const d = res.departure?.departureDate ?? res.travelDate;
        return d
          ? d.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
          : "";
      })(),
      adults: res.adults,
      children: res.children,
      isPaid: amountPaid >= totalAmount - 0.01,
      isEs: true,
    });
  } catch (err) {
    console.error("[Email] Confirmación de pago falló:", referenceCode, err);
  }
}
