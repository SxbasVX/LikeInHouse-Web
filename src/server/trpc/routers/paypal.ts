import { z } from "zod";
import { router, rateLimitedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { RATE_LIMITS } from "@/server/lib/rate-limit";
import { createAuditLog } from "@/server/lib/audit";
import { sendBookingEmail } from "@/server/email/send-booking";
import { sanitizeName, sanitizePhone, toCountryCode } from "@/server/lib/payer";

const paypalLimited = rateLimitedProcedure(RATE_LIMITS.paypal);

const PAYPAL_API = process.env.PAYPAL_MODE === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

async function generateAccessToken() {
    const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "PayPal credentials not configured",
        });
    }

    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: "POST",
        body: "grant_type=client_credentials",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("PayPal Auth Error:", errText);
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to authenticate with PayPal",
        });
    }

    const data = await response.json();
    return data.access_token as string;
}

export const paypalRouter = router({
    createOrder: paypalLimited
        .input(z.object({
            reservationId: z.string(),
            referenceCode: z.string().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            const reservation = await ctx.db.reservation.findUnique({
                where: { id: input.reservationId },
                include: {
                    client: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            country: true,
                        },
                    },
                    tour: { select: { nameEs: true } },
                },
            });

            if (!reservation) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found" });
            }

            // Verify ownership: caller must know the referenceCode
            if (reservation.referenceCode !== input.referenceCode) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Invalid reference code" });
            }

            if (reservation.status === "PAID" || reservation.status === "CONFIRMED") {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Reservation is already paid" });
            }

            // Validate currency is USD (PayPal only supports USD in this integration)
            if (reservation.currency !== "USD") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Only USD reservations can be paid via PayPal",
                });
            }

            const paypalCurrency = "USD";
            const amount = Number(reservation.totalAmount);
            const valueStr = amount.toFixed(2);

            const accessToken = await generateAccessToken();

            // Datos del pagador. Sin ellos PayPal recibía la orden anónima,
            // mostraba los nombres de campo en blanco en el checkout y su
            // motor de riesgo marcaba la compra como sospechosa.
            const givenName = sanitizeName(reservation.client?.firstName);
            const surname = sanitizeName(reservation.client?.lastName);
            const payerEmail = reservation.client?.email || undefined;
            const payerPhone = sanitizePhone(reservation.client?.phone);
            const countryCode = toCountryCode(reservation.client?.country);

            const payer: Record<string, unknown> = {};
            if (givenName && surname) {
                payer.name = { given_name: givenName, surname };
            }
            if (payerEmail) payer.email_address = payerEmail;
            if (payerPhone) {
                // PayPal exige national_number de 1 a 14 dígitos; sanitizePhone
                // puede devolver hasta 15 y un dígito de más provoca un 400.
                payer.phone = {
                    phone_type: "MOBILE",
                    phone_number: { national_number: payerPhone.slice(-14) },
                };
            }
            payer.address = { country_code: countryCode };

            const serviceName = reservation.tour?.nameEs || "Servicio turístico";

            const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                    // Idempotencia: dos clics en "Pagar" reutilizan la orden.
                    // Se incluye el monto para no reutilizar una orden vieja
                    // si el total de la reserva cambió.
                    "PayPal-Request-Id": `order-${reservation.referenceCode}-${valueStr}`,
                },
                body: JSON.stringify({
                    intent: "CAPTURE",
                    payer,
                    purchase_units: [
                        {
                            reference_id: reservation.referenceCode,
                            custom_id: reservation.referenceCode,
                            invoice_id: reservation.referenceCode,
                            description: `${serviceName} - Reserva ${reservation.referenceCode}`.slice(0, 127),
                            soft_descriptor: "LIKEINHOUSE",
                            amount: {
                                currency_code: paypalCurrency,
                                value: valueStr,
                                // Obligatorio en cuanto se envía `items`:
                                // PayPal rechaza la orden con 400 si falta el
                                // breakdown, y item_total debe cuadrar con la
                                // suma de los items y con amount.value.
                                breakdown: {
                                    item_total: {
                                        currency_code: paypalCurrency,
                                        value: valueStr,
                                    },
                                },
                            },
                            items: [
                                {
                                    name: serviceName.slice(0, 127),
                                    description: `Reserva ${reservation.referenceCode}`.slice(0, 127),
                                    quantity: "1",
                                    // DIGITAL_GOODS evita que PayPal exija
                                    // dirección de envío para un servicio.
                                    category: "DIGITAL_GOODS",
                                    unit_amount: {
                                        currency_code: paypalCurrency,
                                        value: valueStr,
                                    },
                                },
                            ],
                        },
                    ],
                    application_context: {
                        brand_name: "Like In House",
                        locale: "es-PE",
                        // Un tour no se envía: pedir dirección de envío
                        // rompía el flujo y elevaba el score de riesgo.
                        shipping_preference: "NO_SHIPPING",
                        user_action: "PAY_NOW",
                    },
                }),
            });

            if (!response.ok) {
                const errDetails = await response.text();
                console.error("PayPal Create Order Error:", errDetails);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create PayPal order. Please try again.",
                });
            }

            const orderData = await response.json();
            return { id: orderData.id as string };
        }),

    captureOrder: paypalLimited
        .input(z.object({
            orderId: z.string().min(1).max(50).regex(/^[A-Za-z0-9]+$/, "Invalid PayPal order ID"),
            reservationId: z.string(),
            referenceCode: z.string().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            // Verify reservation exists and is still pending
            const reservation = await ctx.db.reservation.findUnique({
                where: { id: input.reservationId },
            });

            if (!reservation) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found" });
            }

            // Verify ownership: caller must know the referenceCode
            if (reservation.referenceCode !== input.referenceCode) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Invalid reference code" });
            }

            if (reservation.status === "PAID" || reservation.status === "CONFIRMED") {
                // Already paid - idempotent response
                return { success: true, referenceCode: reservation.referenceCode };
            }

            // Idempotency: check if a payment with this PayPal order ID already exists
            const existingPayment = await ctx.db.payment.findFirst({
                where: { paypalOrderId: input.orderId },
            });
            if (existingPayment) {
                return { success: true, referenceCode: reservation.referenceCode };
            }

            const accessToken = await generateAccessToken();

            const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${input.orderId}/capture`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                const errDetails = await response.text();
                console.error("PayPal Capture Order Error:", errDetails);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to capture PayPal payment. Please contact support.",
                });
            }

            const captureData = await response.json();
            const status = captureData.status;

            if (status === "COMPLETED") {
                const captureInfo = captureData.purchase_units?.[0]?.payments?.captures?.[0];

                if (!captureInfo) {
                    console.error("PayPal capture info missing from response");
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Payment captured but details are missing. Contact support.",
                    });
                }

                // Validate captured amount matches expected amount
                const capturedAmount = Number(captureInfo.amount?.value);
                const expectedAmount = Number(reservation.totalAmount);

                if (isNaN(capturedAmount) || capturedAmount <= 0) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Invalid capture amount from PayPal.",
                    });
                }

                // Tolerancia estricta: monto capturado debe ser >= esperado - 1 centavo
                if (capturedAmount <= expectedAmount - 0.01) {
                    console.error(`PayPal amount mismatch: captured=${capturedAmount}, expected=${expectedAmount}`);
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Captured amount does not match expected amount.",
                    });
                }

                // Verify reference_id matches the reservation
                const referenceId = captureData.purchase_units?.[0]?.reference_id;
                if (referenceId && referenceId !== reservation.referenceCode) {
                    console.error(`PayPal reference mismatch: ${referenceId} vs ${reservation.referenceCode}`);
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Payment reference does not match reservation.",
                    });
                }

                try {
                    await ctx.db.$transaction(async (tx) => {
                        await tx.reservation.update({
                            where: { id: input.reservationId },
                            data: { status: "PAID" },
                        });
                        await tx.payment.create({
                            data: {
                                reservationId: input.reservationId,
                                amount: capturedAmount,
                                currency: captureInfo.amount.currency_code || "USD",
                                method: "PAYPAL",
                                status: "COMPLETED",
                                paypalOrderId: input.orderId,
                                gatewayResponse: captureData,
                                processedAt: new Date(),
                            },
                        });

                        // H2: Sync PaymentLink.amountPaid if reservation originated from a payment link
                        if (reservation.paymentLinkId) {
                            const link = await tx.paymentLink.findUnique({
                                where: { id: reservation.paymentLinkId },
                            });
                            if (link) {
                                const newAmountPaid = Number(link.amountPaid) + capturedAmount;
                                const totalAmount = Number(link.totalAmount);
                                const newStatus = newAmountPaid >= totalAmount ? "PAID" : "PARTIALLY_PAID";

                                await tx.paymentLink.update({
                                    where: { id: link.id },
                                    data: { amountPaid: newAmountPaid, status: newStatus },
                                });

                                // If fully paid and linked to quotation, mark as converted
                                if (newStatus === "PAID" && link.quotationId) {
                                    await tx.quotation.update({
                                        where: { id: link.quotationId },
                                        data: { status: "CONVERTED" },
                                    });
                                }
                            }
                        }
                    });
                } catch (dbErr: any) {
                    // Unique constraint violation: another request already recorded this payment
                    if (dbErr?.code === "P2002") {
                        return { success: true, referenceCode: reservation.referenceCode };
                    }
                    throw dbErr;
                }

                // Audit log for payment capture (fire-and-forget)
                createAuditLog({
                    userId: "system-paypal",
                    action: "PAYMENT_CAPTURED",
                    entity: "Payment",
                    entityId: input.reservationId,
                    changes: {
                        paypalOrderId: input.orderId,
                        amount: capturedAmount,
                        currency: captureInfo.amount.currency_code || "USD",
                        referenceCode: reservation.referenceCode,
                    },
                });

                // Email confirmación de pago al cliente (fire-and-forget)
                (async () => {
                    try {
                        const res = await ctx.db.reservation.findUnique({
                            where: { id: input.reservationId },
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

                        // PaymentLink no tiene relacion Prisma; query aparte
                        const link = res.paymentLinkId
                            ? await ctx.db.paymentLink.findUnique({
                                  where: { id: res.paymentLinkId },
                                  select: { titleEs: true, descriptionEs: true, includesEs: true, totalAmount: true, amountPaid: true },
                              })
                            : null;

                        const isPaymentLink = !!link;
                        const totalAmount = link ? Number(link.totalAmount) : Number(res.totalAmount);
                        const amountPaid = link ? Number(link.amountPaid) : capturedAmount;

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
                            serviceIncludes: link
                                ? link.includesEs
                                : (res.tour?.includes.map((i) => i.textEs) || []),
                            clientName: `${res.client.firstName} ${res.client.lastName}`,
                            clientEmail: res.client.email,
                            clientPhone: res.client.phone || null,
                            amountPaid,
                            totalAmount,
                            currency: res.currency,
                            dateStr: res.departure?.departureDate
                                ? res.departure.departureDate.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })
                                : "",
                            adults: res.adults,
                            children: res.children,
                            isPaid: amountPaid >= totalAmount - 0.01,
                            isEs: true,
                        });
                    } catch (err) {
                        console.error("[Email] PayPal capture booking email failed:", err);
                    }
                })();

                return { success: true, referenceCode: reservation.referenceCode };
            }

            return { success: false, status };
        }),
});
