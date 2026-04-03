"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import { Map, CalendarCheck, CreditCard, FileText, Plus, ArrowRight } from "lucide-react";

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING:   { label: "Pendiente",  className: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "Confirmada", className: "bg-teal-50 text-teal-700 border-teal-200" },
  PAID:      { label: "Pagada",     className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  COMPLETED: { label: "Completada", className: "bg-gray-50 text-gray-600 border-gray-200" },
  CANCELLED: { label: "Cancelada",  className: "bg-red-50 text-red-600 border-red-200" },
};

const statCards = (stats: any) => [
  {
    title: "Tours Publicados",
    value: stats.publishedTours,
    subtitle: `${stats.totalTours} total`,
    icon: Map,
    accent: "border-t-brand-teal",
    iconBg: "bg-brand-teal/10",
    iconColor: "text-brand-teal",
  },
  {
    title: "Reservas Pendientes",
    value: stats.pendingReservations,
    subtitle: `${stats.totalReservations} total`,
    icon: CalendarCheck,
    accent: "border-t-brand-orange",
    iconBg: "bg-brand-orange/10",
    iconColor: "text-brand-orange",
  },
  {
    title: "Pagos Pendientes",
    value: stats.pendingPayments,
    subtitle: "Por verificar",
    icon: CreditCard,
    accent: "border-t-brand-darkTeal",
    iconBg: "bg-brand-darkTeal/10",
    iconColor: "text-brand-darkTeal",
  },
  {
    title: "Cotizaciones Abiertas",
    value: stats.openQuotations,
    subtitle: `${stats.totalClients} clientes`,
    icon: FileText,
    accent: "border-t-brand-darkRed",
    iconBg: "bg-brand-darkRed/8",
    iconColor: "text-brand-darkRed",
  },
];

function StatSkeleton() {
  return (
    <Card className="rounded-2xl border-brand-darkRed/8">
      <CardContent className="pt-6">
        <Skeleton className="h-5 w-32 mb-3" />
        <Skeleton className="h-10 w-16 mb-2" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = trpc.dashboard.getStats.useQuery();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const dateStr = now.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-brand-teal font-medium mb-1 uppercase tracking-widest">
            {greeting} — <span className="capitalize">{dateStr}</span>
          </p>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-brand-darkRed leading-none">
            Dashboard
          </h1>
          <p className="font-serif italic text-brand-teal text-xl mt-1">
            Vista general de tu agencia
          </p>
        </div>
        <Button asChild size="lg" className="gap-2 rounded-xl shadow-md shadow-brand-orange/20">
          <Link href="/admin/tours/nuevo">
            <Plus className="h-4 w-4" />
            Nuevo Tour
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />)
          : stats && statCards(stats).map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.title}
                  className={`rounded-2xl border-brand-darkRed/8 border-t-4 ${card.accent} shadow-sm hover:shadow-md transition-shadow`}
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-sm font-medium text-gray-500">{card.title}</p>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}>
                        <Icon className={`h-4 w-4 ${card.iconColor}`} />
                      </div>
                    </div>
                    <p className="font-heading text-4xl font-bold text-brand-darkRed leading-none">
                      {card.value}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">{card.subtitle}</p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Recent Reservations */}
      {stats && (
        <Card className="rounded-2xl border-brand-darkRed/8 shadow-sm">
          <CardHeader className="pb-3 border-b border-brand-darkRed/6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading text-xl text-brand-darkRed">
                  Reservas Recientes
                </CardTitle>
                <CardDescription className="font-serif italic text-brand-teal">
                  Últimas 5 reservas registradas
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-brand-teal hover:text-brand-darkTeal gap-1">
                <Link href="/admin/reservas">
                  Ver todas <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.recentReservations.length === 0 ? (
              <div className="py-12 text-center">
                <p className="font-serif italic text-brand-teal text-lg">No hay reservas aún</p>
                <p className="text-sm text-gray-400 mt-1">Las nuevas reservas aparecerán aquí</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-brand-darkRed/6 hover:bg-transparent">
                    <TableHead className="font-heading text-xs tracking-wider text-brand-darkRed/60 uppercase">Código</TableHead>
                    <TableHead className="font-heading text-xs tracking-wider text-brand-darkRed/60 uppercase">Cliente</TableHead>
                    <TableHead className="font-heading text-xs tracking-wider text-brand-darkRed/60 uppercase">Tour</TableHead>
                    <TableHead className="font-heading text-xs tracking-wider text-brand-darkRed/60 uppercase">Estado</TableHead>
                    <TableHead className="font-heading text-xs tracking-wider text-brand-darkRed/60 uppercase text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentReservations.map((res) => (
                    <TableRow key={res.id} className="border-brand-darkRed/5 hover:bg-brand-darkRed/[0.02]">
                      <TableCell className="font-mono text-xs text-gray-500">
                        {res.referenceCode.slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium text-brand-darkRed">
                        {res.client.firstName} {res.client.lastName}
                      </TableCell>
                      <TableCell className="text-gray-600">{res.tour.nameEs}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[res.status]?.className || "bg-gray-50 text-gray-600"}>
                          {statusConfig[res.status]?.label || res.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-brand-darkRed">
                        {res.currency} {Number(res.totalAmount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
