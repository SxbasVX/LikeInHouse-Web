import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/server/lib/db";
import { createAuditLog } from "@/server/lib/audit";

// Vercel Serverless Function config
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// This route can be called periodically by a cron job (like Vercel Cron or GitHub Actions)
export async function GET(request: Request) {
    try {
        // Basic security: require an API key to run this job
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret) {
            console.error("CRON_SECRET environment variable is not set");
            return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
        }
        const authHeader = request.headers.get("authorization") || "";
        const expected = `Bearer ${cronSecret}`;
        const a = Buffer.from(authHeader);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        // Get full reservation data including departure info for bookedCount decrement
        const expiredFull = await db.reservation.findMany({
            where: {
                status: "PENDING",
                createdAt: { lt: oneDayAgo },
            },
            select: {
                id: true,
                departureId: true,
                adults: true,
                children: true,
            },
        });

        if (expiredFull.length === 0) {
            return NextResponse.json({
                message: "No expired reservations found",
                deletedCount: 0
            });
        }

        const expiredIds = expiredFull.map((r) => r.id);

        // Use transaction to cancel reservations AND decrement bookedCount atomically
        await db.$transaction(async (tx) => {
            // Cancel the expired reservations - append to existing notes instead of overwriting
            const autoNote = "Reserva cancelada automáticamente por el sistema tras 24 horas sin recibir el pago.";
            for (const res of expiredFull) {
                const existing = await tx.reservation.findUnique({
                    where: { id: res.id },
                    select: { internalNotes: true },
                });
                const newNotes = existing?.internalNotes
                    ? `${existing.internalNotes}\n[AUTO] ${autoNote}`
                    : `[AUTO] ${autoNote}`;
                await tx.reservation.update({
                    where: { id: res.id },
                    data: { status: "CANCELLED", internalNotes: newNotes },
                });
            }

            // Decrement bookedCount for each departure that had reservations
            for (const res of expiredFull) {
                if (res.departureId) {
                    const totalPassengers = res.adults + res.children;
                    await tx.tourDeparture.update({
                        where: { id: res.departureId },
                        data: { bookedCount: { decrement: totalPassengers } },
                    });
                }
            }
        });

        // B9: Expire overdue PaymentLinks
        const now = new Date();
        const expiredLinks = await db.paymentLink.updateMany({
            where: {
                status: { in: ["ACTIVE", "PARTIALLY_PAID"] },
                expiresAt: { lt: now },
            },
            data: { status: "EXPIRED" },
        });

        // Audit successful cron execution
        createAuditLog({
            userId: "system-cron",
            action: "CRON_AUTO_CANCEL",
            entity: "Reservation",
            entityId: "batch",
            changes: {
                cancelledCount: expiredFull.length,
                cancelledIds: expiredIds,
                expiredLinksCount: expiredLinks.count,
                success: true,
            },
        });

        return NextResponse.json({
            message: "Successfully cancelled expired reservations",
            cancelledCount: expiredFull.length,
            expiredLinksCount: expiredLinks.count,
        });
    } catch (error) {
        console.error("Error in auto-cancellation cron:", error);
        // Audit cron failure
        createAuditLog({
            userId: "system-cron",
            action: "CRON_AUTO_CANCEL",
            entity: "System",
            entityId: "cron-auto-cancel",
            changes: { error: String(error), success: false },
        });
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
