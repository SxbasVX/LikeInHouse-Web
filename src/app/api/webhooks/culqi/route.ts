import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/server/lib/db";
import { createAuditLog } from "@/server/lib/audit";
import { sendWhatsAppAlert, sendWhatsAppToClient } from "@/server/lib/whatsapp";

// Vercel serverless: extend timeout for webhook processing (default 30s on Hobby)
export const maxDuration = 60;

/**
 * Verify Culqi webhook HMAC signature.
 * Culqi signs webhooks with the merchant's secret key.
 */
function verifyCulqiSignature(rawBody: string, signatureHeader: string | null): boolean {
    const secretKey = process.env.CULQI_SECRET_KEY;
    if (!secretKey || !signatureHeader) return false;

    try {
        const expectedSig = createHmac("sha256", secretKey).update(rawBody).digest("hex");
        const sigBuffer = Buffer.from(signatureHeader);
        const expectedBuffer = Buffer.from(expectedSig);
        if (sigBuffer.length !== expectedBuffer.length) return false;
        return timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();

        // HMAC signature verification - ALWAYS required
        const signature = req.headers.get("x-culqi-signature");
        if (!process.env.CULQI_SECRET_KEY) {
            console.error("[Culqi Webhook] CULQI_SECRET_KEY not configured - rejecting");
            return NextResponse.json({ error: "Webhook verification not configured" }, { status: 500 });
        }
        if (!verifyCulqiSignature(rawBody, signature)) {
            console.error("[Culqi Webhook] Invalid signature - rejecting");
            createAuditLog({
                userId: "SYSTEM",
                action: "WEBHOOK_REJECTED",
                entity: "CulqiWebhook",
                entityId: "unknown",
                changes: { reason: "Invalid HMAC signature" },
            });
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
        }

        let body: any;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        if (body.object !== "event") {
            return NextResponse.json({ received: true });
        }

        let data: any;
        try {
            data = typeof body.data === "string" ? JSON.parse(body.data) : body.data;
        } catch {
            console.error("[Culqi Webhook] Invalid body.data JSON");
            return NextResponse.json({ error: "Invalid payload data" }, { status: 400 });
        }

        // order.status.changed → métodos alternativos (billetera, cuotealo, bancaMovil, agente)
        if (body.type === "order.status.changed") {
            return await handleOrderEvent(data);
        }

        // charge.creation.succeeded → tarjeta
        if (body.type !== "charge.creation.succeeded") {
            return NextResponse.json({ received: true });
        }

        const chargeId = data.id;
        const referenceCode = data.metadata?.referenceCode;

        if (!chargeId || !referenceCode) {
            return NextResponse.json({ error: "Faltan identificadores críticos" }, { status: 400 });
        }

        // Sanitize chargeId before using in URL
        if (!/^[a-zA-Z0-9_-]+$/.test(chargeId)) {
            return NextResponse.json({ error: "Invalid charge ID format" }, { status: 400 });
        }

        // SECURITY PATCH: Server-to-Server validation
        const verifyRes = await fetch(`https://api.culqi.com/v2/charges/${chargeId}`, {
            headers: {
                "Authorization": `Bearer ${process.env.CULQI_SECRET_KEY}`,
                "Content-Type": "application/json"
            }
        });

        if (!verifyRes.ok) {
            return NextResponse.json({ error: "Invalid Charge ID" }, { status: 400 });
        }

        const verifiedCharge = await verifyRes.json();
        if (verifiedCharge.object !== "charge") {
            return NextResponse.json({ error: "Invalid charge object" }, { status: 400 });
        }

        // Validar monto verificado por Culqi server-to-server (no confiar en data del webhook)
        const verifiedAmount = verifiedCharge.amount / 100; // Culqi en centimos

        // Transacción Serializable para evitar race conditions con webhooks duplicados
        await db.$transaction(async (tx) => {
            // Idempotencia DENTRO de la transacción
            const existingPayment = await tx.payment.findFirst({
                where: { culqiChargeId: chargeId },
            });
            if (existingPayment) return;

            const reservation = await tx.reservation.findUnique({
                where: { referenceCode },
                include: { tour: true, client: true },
            });

            if (!reservation || reservation.status === "PAID") return;

            const expectedAmount = Number(reservation.totalAmount);

            // Validar monto verificado por Culqi contra monto esperado en DB (tolerancia 1 centavo)
            if (verifiedAmount < expectedAmount - 0.01) {
                console.error(`[Culqi] Amount mismatch: verified=${verifiedAmount}, expected=${expectedAmount}, ref=${referenceCode}`);
                return;
            }

            await tx.reservation.update({
                where: { id: reservation.id },
                data: { status: "PAID" },
            });

            await tx.payment.create({
                data: {
                    reservationId: reservation.id,
                    amount: verifiedAmount,
                    currency: "USD",
                    method: "CULQI_CARD",
                    status: "COMPLETED",
                    culqiChargeId: chargeId,
                    gatewayResponse: verifiedCharge as any,
                    processedAt: new Date(),
                },
            });

            sendWhatsAppAlert(
                `🏦 *Pago Recibido vía Culqi (Tarjeta)*\nRef: ${referenceCode}\nMonto: USD ${verifiedAmount}`
            ).catch(console.error);

            const clientPhone = reservation.client?.phone;
            if (clientPhone) {
                sendWhatsAppToClient(
                    clientPhone,
                    `¡Hola ${reservation.client?.firstName}! Confirmamos la recepción exitosa de tu pago por USD ${verifiedAmount} a través de nuestro portal.\n\nReserva: ${referenceCode}\nTour: ${reservation.tour?.nameEs}\n\n¡Gracias por tu compra en Like In House!`
                ).catch(console.error);
            }
        }, { isolationLevel: "Serializable" });

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[Culqi Webhook Error]", error instanceof Error ? error.message : "Unknown error");
        createAuditLog({
            userId: "SYSTEM",
            action: "WEBHOOK_ERROR",
            entity: "CulqiWebhook",
            entityId: "unknown",
            changes: { error: error instanceof Error ? error.message : String(error) },
        });
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

/**
 * Maneja eventos de Orden Culqi (métodos alternativos: billetera, cuotealo, bancaMovil, agente).
 * Solo procesa si la orden está en estado "paid"; verifica server-to-server contra Culqi.
 */
async function handleOrderEvent(data: any): Promise<NextResponse> {
    const orderId = data.id;
    if (!orderId || !/^[a-zA-Z0-9_-]+$/.test(orderId)) {
        return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const verifyRes = await fetch(`https://api.culqi.com/v2/orders/${orderId}`, {
        headers: {
            Authorization: `Bearer ${process.env.CULQI_SECRET_KEY}`,
            "Content-Type": "application/json",
        },
    });
    if (!verifyRes.ok) {
        return NextResponse.json({ error: "Invalid Order ID" }, { status: 400 });
    }

    const order = await verifyRes.json();
    if (order.object !== "order") {
        return NextResponse.json({ error: "Invalid order object" }, { status: 400 });
    }

    // Solo procesar cuando la orden fue efectivamente pagada
    if (order.state !== "paid") {
        return NextResponse.json({ received: true, state: order.state });
    }

    const referenceCode = order.metadata?.reference_code;
    if (!referenceCode) {
        return NextResponse.json({ error: "Missing reference_code in order metadata" }, { status: 400 });
    }

    const verifiedAmount = order.amount / 100;

    await db.$transaction(async (tx) => {
        const existingPayment = await tx.payment.findFirst({
            where: { culqiChargeId: orderId },
        });
        if (existingPayment) return;

        const reservation = await tx.reservation.findUnique({
            where: { referenceCode },
            include: { tour: true, client: true },
        });
        if (!reservation || reservation.status === "PAID") return;

        const expectedAmount = Number(reservation.totalAmount);
        if (verifiedAmount < expectedAmount - 0.01) {
            console.error(`[Culqi Order] Amount mismatch: verified=${verifiedAmount}, expected=${expectedAmount}, ref=${referenceCode}`);
            return;
        }

        await tx.reservation.update({
            where: { id: reservation.id },
            data: { status: "PAID" },
        });

        await tx.payment.create({
            data: {
                reservationId: reservation.id,
                amount: verifiedAmount,
                currency: "PEN",
                method: "CULQI_CARD",
                status: "COMPLETED",
                culqiChargeId: orderId,
                gatewayResponse: order as any,
                processedAt: new Date(),
            },
        });

        sendWhatsAppAlert(
            `🏦 *Pago Recibido vía Culqi (Orden)*\nRef: ${referenceCode}\nMonto: PEN ${verifiedAmount}\nOrden: ${orderId}`
        ).catch(console.error);

        const clientPhone = reservation.client?.phone;
        if (clientPhone) {
            sendWhatsAppToClient(
                clientPhone,
                `¡Hola ${reservation.client?.firstName}! Confirmamos la recepción exitosa de tu pago por PEN ${verifiedAmount}.\n\nReserva: ${referenceCode}\nTour: ${reservation.tour?.nameEs}\n\n¡Gracias por tu compra en Like In House!`
            ).catch(console.error);
        }
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ received: true });
}
