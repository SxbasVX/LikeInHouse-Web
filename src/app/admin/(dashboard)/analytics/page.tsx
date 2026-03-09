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
      {source}
    </Badge>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data, isLoading } = trpc.dashboard.getSourceAnalytics.useQuery({ days });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics de Marketing</h1>
          <p className="text-muted-foreground">
            Atribucion de fuentes de trafico y rendimiento de campanas
          </p>
        </div>
        <Select
          value={String(days)}
          onValueChange={(val) => setDays(Number(val))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Ultimos 7 dias</SelectItem>
            <SelectItem value="30">Ultimos 30 dias</SelectItem>
            <SelectItem value="90">Ultimos 90 dias</SelectItem>
            <SelectItem value="180">Ultimos 6 meses</SelectItem>
            <SelectItem value="365">Ultimo ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
      ) : !data ? null : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Total Ordenes</CardDescription>
                <ShoppingCart className="h-5 w-5 text-brand-teal" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data.totalOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">Ultimos {data.days} dias</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Revenue Total</CardDescription>
                <DollarSign className="h-5 w-5 text-brand-orange" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">$ {data.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">USD</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Fuentes Activas</CardDescription>
                <TrendingUp className="h-5 w-5 text-brand-darkTeal" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data.firstSourceStats.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Canales con ordenes</p>
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
                  Por Primera Fuente
                </CardTitle>
                <CardDescription>
                  Primer canal que trajo al visitante (first-touch)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.firstSourceStats.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Sin datos de fuentes aun
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fuente</TableHead>
                        <TableHead className="text-right">Ordenes</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.firstSourceStats.map((row) => (
                        <TableRow key={row.source}>
                          <TableCell><SourceBadge source={row.source} /></TableCell>
                          <TableCell className="text-right font-medium">{row.orders}</TableCell>
                          <TableCell className="text-right font-medium">$ {row.revenue.toLocaleString()}</TableCell>
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
                  Por Ultima Fuente
                </CardTitle>
                <CardDescription>
                  Ultimo canal antes de la compra (last-touch)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.lastSourceStats.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Sin datos de fuentes aun
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fuente</TableHead>
                        <TableHead className="text-right">Ordenes</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.lastSourceStats.map((row) => (
                        <TableRow key={row.source}>
                          <TableCell><SourceBadge source={row.source} /></TableCell>
                          <TableCell className="text-right font-medium">{row.orders}</TableCell>
                          <TableCell className="text-right font-medium">$ {row.revenue.toLocaleString()}</TableCell>
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
                Por Campana
              </CardTitle>
              <CardDescription>
                Rendimiento por campana de marketing (utm_campaign)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.campaignStats.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Sin datos de campanas aun
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campana</TableHead>
                      <TableHead className="text-right">Ordenes</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Promedio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.campaignStats.map((row) => (
                      <TableRow key={row.campaign}>
                        <TableCell>
                          <span className="font-mono text-sm">{row.campaign}</span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{row.orders}</TableCell>
                        <TableCell className="text-right font-medium">$ {row.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          $ {row.orders > 0 ? (row.revenue / row.orders).toFixed(2) : "0.00"}
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
