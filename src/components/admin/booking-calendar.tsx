"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate, formatTimestampDate, formatMoney } from "@/lib/format";
import { getStatusStyle, reservationOriginLabel } from "@/lib/status";

interface CalendarReservation {
  id: string;
  referenceCode: string;
  status: string;
  createdAt: string;
  adults: number;
  children: number;
  totalAmount: number;
  currency: string;
  origin: string;
  departure: { departureDate: string } | null;
  // Fecha pedida en tours de calendario abierto (sin salida programada).
  travelDate?: string | null;
  tour: { nameEs: string; destination: string };
  client: { firstName: string; lastName: string };
}

interface BookingCalendarProps {
  reservations: CalendarReservation[];
  month: Date;
  onMonthChange: (date: Date) => void;
}

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday = 0, Sunday = 6
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const days: (Date | null)[] = [];

  // Padding before
  for (let i = 0; i < startOffset; i++) days.push(null);

  // Days of month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Padding after to complete last week
  while (days.length % 7 !== 0) days.push(null);

  return days;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Las fechas de viaje se guardan a medianoche UTC: la clave del día se arma en UTC
// para no desplazarlas al día anterior en zonas horarias negativas (Perú).
function utcDateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

// Fecha que posiciona la reserva en el calendario: salida programada,
// fecha solicitada o, como respaldo, la fecha de creación (hora local).
export function reservationDayKey(r: Pick<CalendarReservation, "createdAt" | "departure" | "travelDate">): string {
  const travel = r.departure?.departureDate ?? r.travelDate;
  if (travel) return utcDateKey(new Date(travel));
  return dateKey(new Date(r.createdAt));
}

export function BookingCalendar({ reservations, month, onMonthChange }: BookingCalendarProps) {
  const [selected, setSelected] = useState<CalendarReservation | null>(null);

  const year = month.getFullYear();
  const m = month.getMonth();
  const days = useMemo(() => getMonthDays(year, m), [year, m]);

  // Agrupar reservas por fecha de viaje (createdAt sólo como respaldo)
  const byDate = useMemo(() => {
    const map: Record<string, CalendarReservation[]> = {};
    for (const r of reservations) {
      const key = reservationDayKey(r);
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return map;
  }, [reservations]);

  const today = dateKey(new Date());

  const prevMonth = () => onMonthChange(new Date(year, m - 1, 1));
  const nextMonth = () => onMonthChange(new Date(year, m + 1, 1));

  const monthLabel = month.toLocaleDateString("es-PE", { month: "long", year: "numeric" });

  // Agenda para pantallas pequeñas: sólo los días del mes con reservas.
  const agendaDays = useMemo(
    () =>
      days
        .filter((d): d is Date => !!d && (byDate[dateKey(d)]?.length ?? 0) > 0)
        .map((d) => ({ day: d, events: byDate[dateKey(d)] })),
    [days, byDate]
  );

  return (
    <>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Mes anterior" title="Mes anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold capitalize" aria-live="polite">{monthLabel}</h2>
        <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Mes siguiente" title="Mes siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Agenda (móvil): la cuadrícula de 7 columnas no se lee en pantallas angostas */}
      <div className="sm:hidden">
        {agendaDays.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No hay reservas este mes.</p>
        ) : (
          <ul className="space-y-4">
            {agendaDays.map(({ day, events }) => {
              const key = dateKey(day);
              return (
                <li key={key}>
                  <h3
                    className={`mb-1.5 text-sm font-semibold capitalize ${key === today ? "text-primary" : "text-gray-700"}`}
                  >
                    {day.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
                    {key === today && <span className="ml-2 text-xs font-medium normal-case">(hoy)</span>}
                  </h3>
                  <ul className="space-y-1.5">
                    {events.map((r) => {
                      const cfg = getStatusStyle("reservation", r.status);
                      return (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => setSelected(r)}
                            className={`flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm ${cfg.className}`}
                          >
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} aria-hidden="true" />
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium">{r.tour.nameEs}</span>
                              <span className="block text-xs opacity-80">
                                {r.client.firstName} {r.client.lastName} · {cfg.label}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="hidden sm:block">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
          {DAYS_ES.map((d) => (
            <div key={d} className="bg-gray-50 py-2 text-center text-xs font-semibold text-gray-500">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-b-lg overflow-hidden">
          {days.map((day, i) => {
            if (!day) {
              return <div key={`empty-${i}`} className="bg-gray-50 min-h-[100px]" />;
            }

            const key = dateKey(day);
            const events = byDate[key] || [];
            const isToday = key === today;

            return (
              <div
                key={key}
                className={`bg-white min-h-[100px] p-1.5 ${isToday ? "ring-2 ring-inset ring-primary/30" : ""}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday ? "bg-primary text-primary-foreground" : "text-gray-700"
                  }`}
                >
                  {day.getDate()}
                </span>

                <div className="mt-1 space-y-0.5">
                  {events.slice(0, 3).map((r) => {
                    const cfg = getStatusStyle("reservation", r.status);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelected(r)}
                        title={`${r.tour.nameEs} — ${r.client.firstName} ${r.client.lastName} (${cfg.label})`}
                        className={`w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium truncate border ${cfg.className} hover:opacity-80 transition-opacity`}
                      >
                        <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1 ${cfg.dot}`} />
                        {r.tour.nameEs.slice(0, 15)}
                      </button>
                    );
                  })}
                  {events.length > 3 && (
                    <span className="text-[10px] text-muted-foreground pl-1">
                      +{events.length - 3} más
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de reserva</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{selected.referenceCode}</span>
                <StatusBadge domain="reservation" status={selected.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Cliente</p>
                  <p className="font-medium">{selected.client.firstName} {selected.client.lastName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Tour</p>
                  <p className="font-medium">{selected.tour.nameEs}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Destino</p>
                  <p>{selected.tour.destination}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Pasajeros</p>
                  <p>{selected.adults + selected.children} ({selected.adults}A + {selected.children}N)</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Monto</p>
                  <p className="font-semibold">{formatMoney(selected.totalAmount, selected.currency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Origen</p>
                  <p>{reservationOriginLabel(selected.origin)}</p>
                </div>
                {(selected.departure || selected.travelDate) && (
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {selected.departure ? "Fecha de salida" : "Fecha solicitada"}
                    </p>
                    <p>
                      {formatDate(selected.departure?.departureDate ?? selected.travelDate)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">Creada</p>
                  <p>{formatTimestampDate(selected.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
