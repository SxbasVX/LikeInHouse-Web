"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { trpc } from "@/lib/trpc";
import { exportToCSV } from "@/lib/export-csv";

const ReportPDFDownload = dynamic(() => import("@/components/pdf/report-pdf-download"), {
  ssr: false,
  loading: () => null,
});

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CalendarCheck,
  Minus,
} from "lucide-react";

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente", CONFIRMED: "Confirmada", PAID: "Pagada",
  COMPLETED: "Completada", CANCELLED: "Cancelada",
};

function ChangeIndicator({ value }: { value: number | null }) {
  if (value === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (value > 0) return <span className="flex items-center text-emerald-600 text-sm font-medium"><TrendingUp className="h-4 w-4 mr-1" />+{value}%</span>;
  if (value < 0) return <span className="flex items-center text-red-600 text-sm font-medium"><TrendingDown className="h-4 w-4 mr-1" />{value}%</span>;
  return <span className="text-sm text-muted-foreground">0%</span>;
}

export default function ReportesPage() {
  const [monthStr, setMonthStr] = useState(currentMonthStr);
  const [tourId, setTourId] = useState<string>("");

  // Monthly report
  const { data: monthlyReport, isLoading: loadingMonthly } = trpc.dashboard.getMonthlyReport.useQuery(
    { date: monthStr },
    { enabled: !!monthStr }
  );

  // Tour report
  const { data: tourReport, isLoading: loadingTour } = trpc.dashboard.getTourReport.useQuery(
    { tourId },
    { enabled: !!tourId }
  );

  // Tours list for selector
  const { data: toursData } = trpc.tour.list.useQuery({ page: 1, limit: 50 });

  // Month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
      options.push({ value: val, label });
    }
    return options;
  }, []);

  const handleExportMonthly = () => {
    if (!monthlyReport?.reservations) return;
    exportToCSV(
      monthlyReport.reservations.map((r) => ({
        referenceCode: r.referenceCode,
        client: `${r.client.firstName} ${r.client.lastName}`,
        email: r.client.email,
        tour: r.tour.nameEs,
        destination: r.tour.destination,
        adults: r.adults,
        children: r.children,
        totalAmount: r.totalAmount,
        currency: r.currency,
        status: r.status,
        origin: r.origin,
        date: new Date(r.createdAt).toLocaleDateString("es-PE", { timeZone: "UTC" }),
      })),
      `reporte-mensual-${monthStr}`,
      [
        { key: "referenceCode", label: "Código" },
        { key: "client", label: "Cliente" },
        { key: "email", label: "Email" },
        { key: "tour", label: "Tour" },
        { key: "destination", label: "Destino" },
        { key: "adults", label: "Adultos" },
        { key: "children", label: "Niños" },
        { key: "totalAmount", label: "Monto" },
        { key: "currency", label: "Moneda" },
        { key: "status", label: "Estado" },
        { key: "origin", label: "Origen" },
        { key: "date", label: "Fecha" },
      ]
    );
  };

  const handleExportTour = () => {
    if (!tourReport?.reservations) return;
    exportToCSV(
      tourReport.reservations.map((r) => ({
        referenceCode: r.referenceCode,
        client: `${r.client.firstName} ${r.client.lastName}`,
        email: r.client.email,
        adults: r.adults,
        children: r.children,
        totalAmount: r.totalAmount,
        currency: r.currency,
        status: r.status,
        origin: r.origin,
        departureDate: r.departure
          ? new Date(r.departure.departureDate).toLocaleDateString("es-PE", { timeZone: "UTC" })
          : "",
        date: new Date(r.createdAt).toLocaleDateString("es-PE", { timeZone: "UTC" }),
      })),
      `reporte-tour-${tourReport.tour.nameEs.replace(/\s+/g, "-").toLowerCase()}`,
      [
        { key: "referenceCode", label: "Código" },
        { key: "client", label: "Cliente" },
        { key: "email", label: "Email" },
        { key: "adults", label: "Adultos" },
        { key: "children", label: "Niños" },
        { key: "totalAmount", label: "Monto" },
        { key: "currency", label: "Moneda" },
        { key: "status", label: "Estado" },
        { key: "origin", label: "Origen" },
        { key: "departureDate", label: "Fecha Salida" },
        { key: "date", label: "Fecha Reserva" },
      ]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-darkRed">Reportes</h1>
        <p className="font-serif italic text-brand-teal">Insights financieros y métricas de rendimiento</p>
      </div>

      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList>
          <TabsTrigger value="monthly">Reporte Mensual</TabsTrigger>
          <TabsTrigger value="tour">Reporte por Tour</TabsTrigger>
        </TabsList>

        {/* ==================== MONTHLY REPORT ==================== */}
        <TabsContent value="monthly" className="space-y-6">
          <div className="flex items-center gap-4">
            <Select value={monthStr} onValueChange={setMonthStr}>
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="capitalize">{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handleExportMonthly}
              disabled={!monthlyReport?.reservations?.length}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>

            {monthlyReport && monthlyReport.reservations.length > 0 && (
              <ReportPDFDownload
                type="monthly"
                filename={`reporte-mensual-${monthStr}`}
                data={{
                  period: monthlyReport.period,
                  periodLabel: monthOptions.find((o) => o.value === monthStr)?.label || monthStr,
                  totalRevenue: monthlyReport.totalRevenue,
                  totalBookings: monthlyReport.totalBookings,
                  totalPeople: monthlyReport.totalPeople,
                  avgBookingValue: monthlyReport.avgBookingValue,
                  paidCount: monthlyReport.paidCount,
                  pendingCount: monthlyReport.pendingCount,
                  topTours: monthlyReport.topTours,
                  reservations: monthlyReport.reservations.map((r) => ({
                    referenceCode: r.referenceCode,
                    client: `${r.client.firstName} ${r.client.lastName}`,
                    tour: r.tour.nameEs,
                    destination: r.tour.destination,
                    adults: r.adults,
                    children: r.children,
                    totalAmount: r.totalAmount,
                    currency: r.currency,
                    status: r.status,
                    origin: r.origin,
                    date: new Date(r.createdAt).toLocaleDateString("es-PE", { timeZone: "UTC" }),
                  })),
                }}
              />
            )}
          </div>

          {loadingMonthly ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : monthlyReport ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      <ChangeIndicator value={monthlyReport.revenueChangePercent} />
                    </div>
                    <p className="text-2xl font-bold mt-2">USD ${monthlyReport.totalRevenue.toFixed(0)}</p>
                    <p className="text-xs font-serif italic text-brand-teal">Revenue total</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <CalendarCheck className="h-5 w-5 text-blue-600" />
                      <ChangeIndicator value={monthlyReport.bookingsChangePercent} />
                    </div>
                    <p className="text-2xl font-bold mt-2">{monthlyReport.totalBookings}</p>
                    <p className="text-xs font-serif italic text-brand-teal">Reservas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <Users className="h-5 w-5 text-purple-600" />
                    <p className="text-2xl font-bold mt-2">{monthlyReport.totalPeople}</p>
                    <p className="text-xs font-serif italic text-brand-teal">Pasajeros</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                    <p className="text-2xl font-bold mt-2">USD ${monthlyReport.avgBookingValue.toFixed(0)}</p>
                    <p className="text-xs font-serif italic text-brand-teal">Valor promedio</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Tours */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Tours</CardTitle>
                    <CardDescription>Por revenue en el período</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyReport.topTours.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tour</TableHead>
                            <TableHead className="text-right">Reservas</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monthlyReport.topTours.map((t, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <p className="font-medium text-sm">{t.name}</p>
                                <p className="text-xs font-serif italic text-brand-teal">{t.destination}</p>
                              </TableCell>
                              <TableCell className="text-right">{t.bookings}</TableCell>
                              <TableCell className="text-right font-medium">${t.revenue.toFixed(0)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Methods */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Métodos de Pago</CardTitle>
                    <CardDescription>Distribución de pagos completados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyReport.byMethod.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sin pagos completados</p>
                    ) : (
                      <div className="space-y-3">
                        {monthlyReport.byMethod.map((m) => (
                          <div key={m.method} className="flex items-center justify-between">
                            <Badge variant="outline">{m.method.replace(/_/g, " ")}</Badge>
                            <span className="font-medium">USD ${m.amount.toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Status breakdown */}
              <div className="flex gap-4 text-sm">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  Pagadas: {monthlyReport.paidCount}
                </Badge>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  Pendientes: {monthlyReport.pendingCount}
                </Badge>
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* ==================== TOUR REPORT ==================== */}
        <TabsContent value="tour" className="space-y-6">
          <div className="flex items-center gap-4">
            <Select value={tourId} onValueChange={setTourId}>
              <SelectTrigger className="w-[350px]">
                <SelectValue placeholder="Selecciona un tour" />
              </SelectTrigger>
              <SelectContent>
                {toursData?.tours.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.nameEs}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handleExportTour}
              disabled={!tourReport?.reservations?.length}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>

            {tourReport && tourReport.reservations.length > 0 && (
              <ReportPDFDownload
                type="tour"
                filename={`reporte-tour-${tourReport.tour.nameEs.replace(/\s+/g, "-").toLowerCase()}`}
                data={{
                  tourName: tourReport.tour.nameEs,
                  destination: tourReport.tour.destination,
                  totalRevenue: tourReport.totalRevenue,
                  totalBookings: tourReport.totalBookings,
                  totalPeople: tourReport.totalPeople,
                  paidCount: tourReport.paidCount,
                  conversionRate: tourReport.conversionRate,
                  reservations: tourReport.reservations.map((r) => ({
                    referenceCode: r.referenceCode,
                    client: `${r.client.firstName} ${r.client.lastName}`,
                    tour: tourReport.tour.nameEs,
                    destination: tourReport.tour.destination,
                    adults: r.adults,
                    children: r.children,
                    totalAmount: r.totalAmount,
                    currency: r.currency,
                    status: r.status,
                    origin: r.origin,
                    date: new Date(r.createdAt).toLocaleDateString("es-PE", { timeZone: "UTC" }),
                  })),
                }}
              />
            )}
          </div>

          {!tourId ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Selecciona un tour para ver su reporte
              </CardContent>
            </Card>
          ) : loadingTour ? (
            <Skeleton className="h-48" />
          ) : tourReport ? (
            <>
              {/* Tour KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-2xl font-bold">USD ${tourReport.totalRevenue.toFixed(0)}</p>
                    <p className="text-xs font-serif italic text-brand-teal">Revenue total</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-2xl font-bold">{tourReport.totalBookings}</p>
                    <p className="text-xs font-serif italic text-brand-teal">Reservas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-2xl font-bold">{tourReport.totalPeople}</p>
                    <p className="text-xs font-serif italic text-brand-teal">Pasajeros</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-2xl font-bold text-emerald-600">{tourReport.paidCount}</p>
                    <p className="text-xs font-serif italic text-brand-teal">Pagados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-2xl font-bold">{tourReport.conversionRate}%</p>
                    <p className="text-xs font-serif italic text-brand-teal">Tasa conversión</p>
                  </CardContent>
                </Card>
              </div>

              {/* Reservations table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reservas de {tourReport.tour.nameEs}</CardTitle>
                  <CardDescription>{tourReport.tour.destination}</CardDescription>
                </CardHeader>
                <CardContent>
                  {tourReport.reservations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Sin reservas para este tour</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Personas</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tourReport.reservations.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-xs">{r.referenceCode.slice(0, 12)}</TableCell>
                            <TableCell>{r.client.firstName} {r.client.lastName}</TableCell>
                            <TableCell>{r.adults + r.children}</TableCell>
                            <TableCell className="font-medium">${r.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{statusLabels[r.status] || r.status}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {new Date(r.createdAt).toLocaleDateString("es-PE", { timeZone: "UTC" })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
