"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
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
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ErrorState } from "@/components/admin/list-states";
import { formatMoney } from "@/lib/format";
import { trafficSourceLabel } from "@/lib/status";

const SOURCE_COLORS: Record<string, string> = {
  instagram: "bg-pink-100 text-pink-800",
  tiktok: "bg-gray-100 text-gray-800",
  facebook: "bg-blue-100 text-blue-800",
  google: "bg-green-100 text-green-800",
  twitter: "bg-sky-100 text-sky-800",
  youtube: "bg-red-100 text-red-800",
  direct: "bg-slate-100 text-slate-800",
  referral: "bg-purple-100 text-purple-800",
};

function SourceBadge({ source }: { source: string }) {
  return (
    <Badge
      variant="secondary"
      className={SOURCE_COLORS[source] || "bg-gray-100 text-gray-800"}
    >
      {trafficSourceLabel(source)}
    </Badge>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data, isLoading, error, refetch, isRefetching } = trpc.dashboard.getSourceAnalytics.useQuery({ days });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Atribución de fuentes de tráfico y rendimiento de campañas"
        actions={
        <Select
          value={String(days)}
          onValueChange={(val) => setDays(Number(val))}
        >
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Periodo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
            <SelectItem value="180">Últimos 6 meses</SelectItem>
            <SelectItem value="365">Último año</SelectItem>
          </SelectContent>
        </Select>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-16" /></CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Card>
          <ErrorState title="No se pudieron cargar los datos de analytics" error={error} onRetry={() => refetch()} isRetrying={isRefetching} />
        </Card>
      ) : !data ? null : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Total de órdenes</CardDescription>
                <ShoppingCart className="h-5 w-5 text-brand-teal" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data.totalOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">Últimos {data.days} días</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Ingresos totales</CardDescription>
                <DollarSign className="h-5 w-5 text-brand-orange" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatMoney(data.totalRevenue, "USD")}</p>
                <p className="text-xs text-muted-foreground mt-1">USD</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Fuentes activas</CardDescription>
                <TrendingUp className="h-5 w-5 text-brand-darkTeal" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data.firstSourceStats.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Canales con órdenes</p>
              </CardContent>
            </Card>
          </div>

          {/* Two-column: First Source + Last Source */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Purchases by First Source */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Por primera fuente
                </CardTitle>
                <CardDescription>
                  Primer canal que trajo al visitante (primer contacto)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.firstSourceStats.length === 0 ? (
                  <p className="text-center py-8 font-serif italic text-brand-teal">
                    Sin datos de fuentes aún
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fuente</TableHead>
                        <TableHead className="text-right">Órdenes</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.firstSourceStats.map((row) => (
                        <TableRow key={row.source}>
                          <TableCell><SourceBadge source={row.source} /></TableCell>
                          <TableCell className="text-right font-medium">{row.orders}</TableCell>
                          <TableCell className="text-right font-medium">{formatMoney(row.revenue, "USD")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Purchases by Last Source */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Por última fuente
                </CardTitle>
                <CardDescription>
                  Último canal antes de la compra (último contacto)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.lastSourceStats.length === 0 ? (
                  <p className="text-center py-8 font-serif italic text-brand-teal">
                    Sin datos de fuentes aún
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fuente</TableHead>
                        <TableHead className="text-right">Órdenes</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.lastSourceStats.map((row) => (
                        <TableRow key={row.source}>
                          <TableCell><SourceBadge source={row.source} /></TableCell>
                          <TableCell className="text-right font-medium">{row.orders}</TableCell>
                          <TableCell className="text-right font-medium">{formatMoney(row.revenue, "USD")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Purchases by Campaign */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Por campaña
              </CardTitle>
              <CardDescription>
                Rendimiento por campaña de marketing (utm_campaign)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.campaignStats.length === 0 ? (
                <p className="text-center py-8 font-serif italic text-brand-teal">
                  Sin datos de campañas aún
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaña</TableHead>
                      <TableHead className="text-right">Órdenes</TableHead>
                      <TableHead className="text-right">Ingresos</TableHead>
                      <TableHead className="text-right">Promedio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.campaignStats.map((row) => (
                      <TableRow key={row.campaign}>
                        <TableCell>
                          <span className="font-mono text-sm">{row.campaign === "organic" ? "Sin campaña (orgánico)" : row.campaign}</span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{row.orders}</TableCell>
                        <TableCell className="text-right font-medium">{formatMoney(row.revenue, "USD")}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatMoney(row.orders > 0 ? row.revenue / row.orders : 0, "USD")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
