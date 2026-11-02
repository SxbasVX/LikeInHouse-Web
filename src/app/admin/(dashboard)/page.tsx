"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState, ErrorState } from "@/components/admin/list-states";
import { formatMoney, formatTimestampDate } from "@/lib/format";
import { Map, CalendarCheck, CreditCard, FileText, Plus, ArrowRight } from "lucide-react";

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
    iconBg: "bg-brand-darkRed/10",
    iconColor: "text-brand-darkRed",
  },
];

function StatSkeleton() {
  return (
    <Card className="rounded-2xl border-brand-darkRed/10">
      <CardContent className="pt-6">
        <Skeleton className="h-5 w-32 mb-3" />
        <Skeleton className="h-10 w-16 mb-2" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading, error, refetch, isRefetching } = trpc.dashboard.getStats.useQuery();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const dateStr = formatTimestampDate(now, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-brand-teal font-medium uppercase tracking-widest">
          {greeting} — <span className="capitalize">{dateStr}</span>
        </p>
        <PageHeader
          title="Dashboard"
          subtitle="Vista general de tu agencia"
          actions={
            <Button asChild>
              <Link href="/admin/tours/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Tour
              </Link>
            </Button>
          }
        />
      </div>

      {error && (
        <Card className="rounded-2xl border-brand-darkRed/10">
          <ErrorState title="No se pudieron cargar los datos del panel" error={error} onRetry={() => refetch()} isRetrying={isRefetching} />
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />)
          : stats && statCards(stats).map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.title}
                  className={`rounded-2xl border-brand-darkRed/10 border-t-4 ${card.accent} shadow-sm hover:shadow-md transition-shadow`}
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
        <Card className="rounded-2xl border-brand-darkRed/10 shadow-sm">
          <CardHeader className="pb-3 border-b border-brand-darkRed/5">
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
              <EmptyState
                icon={CalendarCheck}
                title="No hay reservas aún"
                description="Las nuevas reservas aparecerán aquí."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-brand-darkRed/5 hover:bg-transparent">
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
                        <StatusBadge domain="reservation" status={res.status} />
                      </TableCell>
                      <TableCell className="text-right font-semibold text-brand-darkRed">
                        {formatMoney(res.totalAmount, res.currency)}
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
