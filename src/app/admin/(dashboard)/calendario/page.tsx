"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { BookingCalendar } from "@/components/admin/booking-calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { ErrorState } from "@/components/admin/list-states";
import { formatMoney } from "@/lib/format";
import { STATUS, statusOptions } from "@/lib/status";

function formatTotals(totals: Record<string, number>): string {
  const entries = Object.entries(totals);
  if (entries.length === 0) return formatMoney(0, "USD");
  return entries.map(([currency, amount]) => formatMoney(amount, currency)).join(" · ");
}

export default function CalendarioPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [tourFilter, setTourFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Rango del mes visible. Las fechas de viaje se guardan a medianoche UTC, así que
  // se filtran con límites UTC; createdAt (respaldo) usa los límites locales.
  const { startDate, endDate, travelStartDate, travelEndDate } = useMemo(() => {
    const y = month.getFullYear();
    const m = month.getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      travelStartDate: new Date(Date.UTC(y, m, 1)).toISOString(),
      travelEndDate: new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999)).toISOString(),
    };
  }, [month]);

  const { data: reservations, isLoading, error, refetch, isRefetching } = trpc.reservation.listForCalendar.useQuery({
    startDate,
    endDate,
    travelStartDate,
    travelEndDate,
    tourId: tourFilter !== "all" ? tourFilter : undefined,
    status: statusFilter !== "all" ? (statusFilter as "PENDING" | "CONFIRMED" | "PAID" | "COMPLETED" | "CANCELLED") : undefined,
  });

  const { data: toursData } = trpc.tour.list.useQuery({
    page: 1,
    limit: 50,
    status: "PUBLISHED",
  });

  // Stats for the month
  const stats = useMemo(() => {
    if (!reservations) return null;
    const total = reservations.length;
    const pending = reservations.filter((r) => r.status === "PENDING").length;
    const paid = reservations.filter((r) => r.status === "PAID").length;
    // Totales por moneda: no se suman soles con dólares.
    const revenue: Record<string, number> = {};
    for (const r of reservations) {
      if (r.status === "CANCELLED") continue;
      revenue[r.currency] = (revenue[r.currency] ?? 0) + r.totalAmount;
    }
    return { total, pending, paid, revenue };
  }, [reservations]);

  return (
    <div className="space-y-6">
      <PageHeader title="Calendario" subtitle="Vista mensual de reservas" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs font-serif italic text-brand-teal">Reservas del mes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
              <p className="text-xs font-serif italic text-brand-teal">Pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-brand-darkTeal">{stats.paid}</p>
              <p className="text-xs font-serif italic text-brand-teal">Pagadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{formatTotals(stats.revenue)}</p>
              <p className="text-xs font-serif italic text-brand-teal">Revenue estimado</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={tourFilter} onValueChange={setTourFilter}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Todos los tours" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tours</SelectItem>
            {toursData?.tours.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.nameEs}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {statusOptions("reservation").map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas</CardTitle>
          <CardDescription>Haz clic en una reserva para ver el detalle</CardDescription>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
            {Object.values(STATUS.reservation).map((s) => (
              <span key={s.label} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
                {s.label}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-[500px] w-full" />
            </div>
          ) : error ? (
            <ErrorState title="No se pudieron cargar las reservas del mes" error={error} onRetry={() => refetch()} isRetrying={isRefetching} />
          ) : (
            <BookingCalendar
              reservations={(reservations || []).map((r) => ({
                ...r,
                createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date(r.createdAt).toISOString(),
                departure: r.departure
                  ? { departureDate: typeof r.departure.departureDate === "string" ? r.departure.departureDate : new Date(r.departure.departureDate).toISOString() }
                  : null,
                travelDate: r.travelDate
                  ? (typeof r.travelDate === "string" ? r.travelDate : new Date(r.travelDate).toISOString())
                  : null,
              }))}
              month={month}
              onMonthChange={setMonth}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
