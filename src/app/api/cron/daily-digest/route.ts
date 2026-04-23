import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/server/lib/db";
import { sendWhatsAppAlert } from "@/server/lib/whatsapp";
import { createAuditLog } from "@/server/lib/audit";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Perú: UTC-5 sin DST. Este cron se ejecuta 13:00 UTC = 08:00 Lima.
const TZ_OFFSET_MINUTES = -5 * 60;

/** Devuelve un Date que representa "ahora en Lima" trasladado a UTC. */
function nowInLima(): Date {
  const now = new Date();
  return new Date(now.getTime() + TZ_OFFSET_MINUTES * 60 * 1000);
}

function startOfDayLima(d: Date): Date {
  const lima = new Date(d.getTime());
  lima.setUTCHours(0, 0, 0, 0);
  // convertir el 00:00 Lima a instante UTC real
  return new Date(lima.getTime() - TZ_OFFSET_MINUTES * 60 * 1000);
}

function addDays(d: Date, days: number): Date {
  const n = new Date(d.getTime());
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

function endOfMonthLima(d: Date): Date {
  const lima = new Date(d.getTime());
  // primer día del mes siguiente en Lima, luego -1ms
  const firstNext = new Date(Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return new Date(firstNext.getTime() - TZ_OFFSET_MINUTES * 60 * 1000 - 1);
}

function formatDayLabel(date: Date, todayLima: Date): string {
  const days = Math.floor(
    (startOfDayLima(new Date(date.getTime() + TZ_OFFSET_MINUTES * 60 * 1000)).getTime() -
      startOfDayLima(todayLima).getTime()) /
      (24 * 60 * 60 * 1000)
  );
  if (days === 0) return "🔴 HOY";
  if (days === 1) return "🟡 MAÑANA";
  return `⚪ En ${days} días`;
}

function formatDateShort(date: Date): string {
  const lima = new Date(date.getTime() + TZ_OFFSET_MINUTES * 60 * 1000);
  const day = lima.getUTCDate();
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${day} ${months[lima.getUTCMonth()]}`;
}

function formatTimeShort(date: Date): string {
  const lima = new Date(date.getTime() + TZ_OFFSET_MINUTES * 60 * 1000);
  const h = String(lima.getUTCHours()).padStart(2, "0");
  const m = String(lima.getUTCMinutes()).padStart(2, "0");
  if (h === "00" && m === "00") return "";
  return ` · ${h}:${m}`;
}

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    const authHeader = request.headers.get("authorization") || "";
    const expected = `Bearer ${cronSecret}`;
    const a = Buffer.from(authHeader);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayLima = nowInLima();
    const rangeStart = startOfDayLima(todayLima);
    const rangeWeekEnd = addDays(rangeStart, 8); // hasta inicio del día 8 = 7 días completos
    const monthEnd = endOfMonthLima(todayLima);

    // Reservas confirmadas con salida dentro de los próximos 7 días
    const upcomingWeek = await db.reservation.findMany({
      where: {
        status: { in: ["CONFIRMED", "PAID"] },
        departure: {
          departureDate: { gte: rangeStart, lt: rangeWeekEnd },
        },
      },
      include: {
        tour: { select: { nameEs: true } },
        client: { select: { firstName: true, lastName: true, phone: true } },
        departure: { select: { departureDate: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    upcomingWeek.sort(
      (a, b) =>
        (a.departure?.departureDate.getTime() ?? 0) -
        (b.departure?.departureDate.getTime() ?? 0)
    );

    if (upcomingWeek.length === 0) {
      // Silencio: sin reservas próximas no enviamos nada
      return NextResponse.json({ sent: false, reason: "no-upcoming" });
    }

    // Reservas del resto del mes (después de la ventana de 7 días, hasta fin de mes Lima)
    const restOfMonth = await db.reservation.findMany({
      where: {
        status: { in: ["CONFIRMED", "PAID"] },
        departure: {
          departureDate: { gte: rangeWeekEnd, lte: monthEnd },
        },
      },
      include: {
        tour: { select: { nameEs: true } },
        departure: { select: { departureDate: true } },
      },
    });

    // Totales del mes (próximos 7 + resto)
    const allMonth = [...upcomingWeek, ...restOfMonth];
    const totalPassengers = allMonth.reduce((acc, r) => acc + r.adults + r.children, 0);
    const totalByCurrency: Record<string, number> = {};
    for (const r of allMonth) {
      const key = r.currency;
      totalByCurrency[key] = (totalByCurrency[key] ?? 0) + Number(r.totalAmount);
    }

    // === Formateo del mensaje ===
    const lines: string[] = [];
    lines.push("📅 *Reservas de los próximos 7 días*");
    lines.push("");

    for (const r of upcomingWeek) {
      const date = r.departure?.departureDate;
      if (!date) continue;
      const label = formatDayLabel(date, todayLima);
      const time = formatTimeShort(date);
      const clientName = `${r.client.firstName} ${r.client.lastName}`.trim();
      const pass = r.adults + r.children;
      lines.push(`${label} (${formatDateShort(date)}) — ${r.tour.nameEs}${time}`);
      lines.push(`  Ref: ${r.referenceCode}`);
      lines.push(`  Cliente: ${clientName}${r.client.phone ? ` · ${r.client.phone}` : ""}`);
      lines.push(`  Pasajeros: ${pass} · ${r.currency} ${Number(r.totalAmount).toFixed(2)}`);
      lines.push("");
    }

    if (restOfMonth.length > 0) {
      lines.push("━━━━━━━━━━━━━━━━");
      lines.push("📋 *Resto del mes*");
      // Agrupar por día
      const byDate = new Map<string, typeof restOfMonth>();
      for (const r of restOfMonth) {
        const d = r.departure?.departureDate;
        if (!d) continue;
        const key = formatDateShort(d);
        const arr = byDate.get(key) ?? [];
        arr.push(r);
        byDate.set(key, arr);
      }
      for (const [key, arr] of byDate) {
        const tourNames = arr.map((r) => r.tour.nameEs).join(", ");
        lines.push(`  • ${key}: ${arr.length} reserva${arr.length > 1 ? "s" : ""} (${tourNames})`);
      }
      lines.push("");
    }

    const totalsLine = Object.entries(totalByCurrency)
      .map(([cur, amt]) => `${cur} ${amt.toFixed(2)}`)
      .join(" · ");
    lines.push(
      `*Total mes:* ${allMonth.length} reservas · ${totalPassengers} pasajeros${totalsLine ? ` · ${totalsLine}` : ""}`
    );

    const message = lines.join("\n");
    const sent = await sendWhatsAppAlert(message);

    createAuditLog({
      userId: "system-cron",
      action: "CRON_DAILY_DIGEST",
      entity: "Reservation",
      entityId: "digest",
      changes: {
        weekCount: upcomingWeek.length,
        monthCount: allMonth.length,
        sent,
      },
    });

    return NextResponse.json({ sent, weekCount: upcomingWeek.length, monthCount: allMonth.length });
  } catch (error) {
    console.error("Error in daily-digest cron:", error);
    createAuditLog({
      userId: "system-cron",
      action: "CRON_DAILY_DIGEST",
      entity: "System",
      entityId: "cron-daily-digest",
      changes: { error: String(error), success: false },
    });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
