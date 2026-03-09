import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/lib/db";
import { sendWhatsAppAlert, sendWhatsAppToClient } from "@/server/lib/whatsapp";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Culqi dispara 'charge.creation.succeeded' cuando una tarjeta pasa
        if (body.object !== "event" || body.type !== "charge.creation.succeeded") {
            return NextResponse.json({ received: true });
        }

        const data = JSON.parse(body.data);
        const chargeId = data.id;
        const referenceCode = data.metadata?.referenceCode;
        const amount = data.amount / 100; // Culqi manda importes en centimos

        if (!chargeId || !referenceCode) {
            return NextResponse.json({ error: "Faltan identificadores críticos" }, { status: 400 });
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
        console.error("[Culqi Webhook Error]", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
