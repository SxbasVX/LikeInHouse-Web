"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Map,
  CalendarCheck,
  CreditCard,
  FileText,
  Users,
  Plus,
} from "lucide-react";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function DashboardPage() {
  const { data: stats, isLoading } = trpc.dashboard.getStats.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Tours Publicados",
      value: stats.publishedTours,
      subtitle: `${stats.totalTours} total`,
      icon: Map,
      color: "text-blue-600",
    },
    {
      title: "Reservas Pendientes",
      value: stats.pendingReservations,
      subtitle: `${stats.totalReservations} total`,
      icon: CalendarCheck,
      color: "text-yellow-600",
    },
    {
      title: "Pagos Pendientes",
      value: stats.pendingPayments,
      subtitle: "Por verificar",
      icon: CreditCard,
      color: "text-green-600",
    },
    {
      title: "Cotizaciones Abiertas",
      value: stats.openQuotations,
      subtitle: `${stats.totalClients} clientes`,
      icon: FileText,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>{card.title}</CardDescription>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/admin/tours/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Tour
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/tours">Ver Tours</Link>
        </Button>
      </div>

      {/* Recent Reservations */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas Recientes</CardTitle>
          <CardDescription>Ultimas 5 reservas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentReservations.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No hay reservas aun
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tour</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentReservations.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-mono text-xs">
                      {res.referenceCode.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {res.client.firstName} {res.client.lastName}
                    </TableCell>
                    <TableCell>{res.tour.nameEs}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[res.status] || ""}
                      >
                        {res.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {res.currency} {Number(res.totalAmount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
