"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  tour: { nameEs: string; destination: string };
  client: { firstName: string; lastName: string };
}

interface BookingCalendarProps {
  reservations: CalendarReservation[];
  month: Date;
  onMonthChange: (date: Date) => void;
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  PENDING: { label: "Pendiente", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  CONFIRMED: { label: "Confirmada", color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  PAID: { label: "Pagada", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  COMPLETED: { label: "Completada", color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
};

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

export function BookingCalendar({ reservations, month, onMonthChange }: BookingCalendarProps) {
  const [selected, setSelected] = useState<CalendarReservation | null>(null);

  const year = month.getFullYear();
  const m = month.getMonth();
  const days = useMemo(() => getMonthDays(year, m), [year, m]);

  // Group reservations by date (use createdAt)
  const byDate = useMemo(() => {
    const map: Record<string, CalendarReservation[]> = {};
    for (const r of reservations) {
      const d = new Date(r.createdAt);
      const key = dateKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return map;
  }, [reservations]);

  const today = dateKey(new Date());

  const prevMonth = () => onMonthChange(new Date(year, m - 1, 1));
  const nextMonth = () => onMonthChange(new Date(year, m + 1, 1));

  const monthLabel = month.toLocaleDateString("es-PE", { month: "long", year: "numeric" });

  return (
    <>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

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
                  const cfg = statusConfig[r.status] || statusConfig.PENDING;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className={`w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium truncate border ${cfg.color} hover:opacity-80 transition-opacity`}
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

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de Reserva</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{selected.referenceCode}</span>
                <Badge className={statusConfig[selected.status]?.color || ""}>
                  {statusConfig[selected.status]?.label || selected.status}
                </Badge>
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
                  <p className="font-semibold">{selected.currency} ${selected.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Origen</p>
                  <p>{selected.origin}</p>
                </div>
                {selected.departure && (
                  <div>
                    <p className="text-muted-foreground text-xs">Fecha Salida</p>
                    <p>{new Date(selected.departure.departureDate).toLocaleDateString("es-PE", { timeZone: "UTC" })}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">Creada</p>
                  <p>{new Date(selected.createdAt).toLocaleDateString("es-PE", { timeZone: "UTC" })}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
