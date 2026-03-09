import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/lib/db";
import { sendWhatsAppAlert, sendWhatsAppToClient } from "@/server/lib/whatsapp";
import { createAuditLog } from "@/server/lib/audit";

// Generador de Token de Servidor (Duplicado limpio del tRPC)
async function getPayPalAccessToken() {
    const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE } = process.env;
    const PAYPAL_API = PAYPAL_MODE === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: "POST",
        body: "grant_type=client_credentials",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
    const data = await response.json();
    return { token: data.access_token, api: PAYPAL_API };
}

// Verify PayPal webhook signature
async function verifyWebhookSignature(req: NextRequest, body: any, accessToken: string, api: string): Promise<boolean> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
        console.error("[PayPal Webhook] PAYPAL_WEBHOOK_ID not set - cannot verify");
        return false;
    }

    const verifyPayload = {
        auth_algo: req.headers.get("paypal-auth-algo"),
        cert_url: req.headers.get("paypal-cert-url"),
        transmission_id: req.headers.get("paypal-transmission-id"),
        transmission_sig: req.headers.get("paypal-transmission-sig"),
        transmission_time: req.headers.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: body,
    };

    // All headers must be present and non-empty
    if (!verifyPayload.auth_algo?.trim() || !verifyPayload.cert_url?.trim() ||
        !verifyPayload.transmission_id?.trim() || !verifyPayload.transmission_sig?.trim() ||
        !verifyPayload.transmission_time?.trim()) {
        return false;
    }

    const verifyResponse = await fetch(`${api}/v1/notifications/verify-webhook-signature`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(verifyPayload),
    });

    if (!verifyResponse.ok) return false;
    const result = await verifyResponse.json();
    return result.verification_status === "SUCCESS";
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // PayPal emite este evento cuando el cliente aprueba el pago pero aún
        // no ha sido capturado. El tRPC suele capturarlo, pero si la web se cerró:
        if (body.event_type !== "CHECKOUT.ORDER.APPROVED") {
            return NextResponse.json({ received: true });
        }

        const orderId = body.resource?.id;
        const referenceCode = body.resource?.purchase_units?.[0]?.reference_id;

        if (!orderId || !referenceCode) {
            return NextResponse.json({ error: "Faltan identificadores" }, { status: 400 });
        }

        // === VERIFY WEBHOOK SIGNATURE ===
        const { token, api } = await getPayPalAccessToken();

        if (!process.env.PAYPAL_WEBHOOK_ID) {
            console.error("[PayPal Webhook] PAYPAL_WEBHOOK_ID not configured - rejecting webhook");
            if (process.env.NODE_ENV === "production") {
                return NextResponse.json({ error: "Webhook verification not configured" }, { status: 500 });
            }
            // In development, warn but continue
            console.warn("[PayPal Webhook] Skipping signature verification in development");
        }

        const isValid = await verifyWebhookSignature(req, body, token, api);
        if (!isValid) {
            console.error("[PayPal Webhook] Invalid signature, rejecting");
            createAuditLog({
                userId: "SYSTEM",
                action: "WEBHOOK_REJECTED",
                entity: "PayPalWebhook",
                entityId: orderId,
                changes: { reason: "Invalid signature", referenceCode },
            });
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
        }

        // === FALLBACK DE CAPTURA ===
        const captureResponse = await fetch(`${api}/v2/checkout/orders/${orderId}/capture`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (captureResponse.ok) {
            const captureData = await captureResponse.json();
            const capturedAmount = Number(captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || 0);

            await db.$transaction(async (tx) => {
                // Idempotencia DENTRO de la transacción para evitar race conditions
                const existingPayment = await tx.payment.findFirst({
                    where: { paypalOrderId: orderId },
                });
                if (existingPayment) return;

                const reservation = await tx.reservation.findUnique({
                    where: { referenceCode },
                    include: { tour: true, client: true, departure: true },
                });

                if (!reservation || reservation.status === "PAID") return;

                const expectedAmount = Number(reservation.totalAmount);

                // Tolerancia de 1 centavo (no más)
                if (capturedAmount < expectedAmount - 0.01) return;

                // A4: Validate departure capacity before marking as PAID
                if (reservation.departureId && reservation.departure) {
                    const departure = await tx.tourDeparture.findUnique({
                        where: { id: reservation.departureId },
                    });
                    if (departure) {
                        const totalPassengers = reservation.adults + reservation.children;
                        const available = departure.maxCapacity - departure.bookedCount;
                        if (totalPassengers > available) {
                            console.error(`[PayPal Webhook] Overbooking prevented for ${referenceCode}: needs ${totalPassengers}, available ${available}`);
                            createAuditLog({
                                userId: "SYSTEM",
                                action: "OVERBOOKING_PREVENTED",
                                entity: "Reservation",
                                entityId: reservation.id,
                                changes: { referenceCode, needed: totalPassengers, available },
                            });
                            return;
                        }
                    }
                }

                await tx.reservation.update({
                    where: { id: reservation.id },
                    data: { status: "PAID" },
                });

                await tx.payment.create({
                    data: {
                        reservationId: reservation.id,
                        amount: capturedAmount,
                        currency: "USD",
                        method: "PAYPAL",
                        status: "COMPLETED",
                        paypalOrderId: orderId,
                        gatewayResponse: captureData as any,
                        processedAt: new Date(),
                    },
                });

                // B10: Log webhook payment to audit
                createAuditLog({
                    userId: "SYSTEM",
                    action: "WEBHOOK_PAYMENT",
                    entity: "Payment",
                    entityId: reservation.id,
                    changes: { referenceCode, amount: capturedAmount, orderId },
                });

                // Alertas fuera del flujo crítico (fire-and-forget)
                sendWhatsAppAlert(
                    `🏦 *Pago Recuperado (PayPal Webhook)*\nRef: ${referenceCode}\nMonto: $${capturedAmount} USD\nEl cliente cerró la ventana prematuramente, pero el Servidor lo salvó.`
                ).catch(console.error);

                const clientPhone = reservation.client?.phone;
                if (clientPhone) {
                    sendWhatsAppToClient(
                        clientPhone,
                        `¡Hola ${reservation.client?.firstName}! Confirmamos la recepción de tu pago por $${capturedAmount} USD a través de PayPal.\n\nReserva: ${referenceCode}\nTour: ${reservation.tour?.nameEs}\n\n¡Gracias por elegir Like In House!`
                    ).catch(console.error);
                }
            }, { isolationLevel: "Serializable" });
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[PayPal Webhook Error]", error instanceof Error ? error.message : "Unknown error");
        createAuditLog({
            userId: "SYSTEM",
            action: "WEBHOOK_ERROR",
            entity: "PayPalWebhook",
            entityId: "unknown",
            changes: { error: error instanceof Error ? error.message : String(error) },
        });
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
