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

export default function CalendarioPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [tourFilter, setTourFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Calculate date range for the current month view
  const { startDate, endDate } = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [month]);

  const { data: reservations, isLoading } = trpc.reservation.listForCalendar.useQuery({
    startDate,
    endDate,
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
    const revenue = reservations
      .filter((r) => r.status !== "CANCELLED")
      .reduce((sum, r) => sum + r.totalAmount, 0);
    return { total, pending, paid, revenue };
  }, [reservations]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-darkRed">Calendario</h1>
        <p className="font-serif italic text-brand-teal">Vista mensual de reservas</p>
      </div>

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
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-xs font-serif italic text-brand-teal">Pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
              <p className="text-xs font-serif italic text-brand-teal">Pagadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">USD ${stats.revenue.toFixed(0)}</p>
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
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="CONFIRMED">Confirmada</SelectItem>
            <SelectItem value="PAID">Pagada</SelectItem>
            <SelectItem value="COMPLETED">Completada</SelectItem>
            <SelectItem value="CANCELLED">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas</CardTitle>
          <CardDescription>Click en una reserva para ver el detalle</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-[500px] w-full" />
            </div>
          ) : (
            <BookingCalendar
              reservations={(reservations || []).map((r) => ({
                ...r,
                createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date(r.createdAt).toISOString(),
                departure: r.departure
                  ? { departureDate: typeof r.departure.departureDate === "string" ? r.departure.departureDate : new Date(r.departure.departureDate).toISOString() }
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
