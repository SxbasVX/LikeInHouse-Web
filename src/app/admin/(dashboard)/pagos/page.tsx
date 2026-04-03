"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { RouterOutput } from "@/types";

type Payment = RouterOutput["payment"]["list"]["payments"][number];
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Clock,
  TrendingUp,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  COMPLETED: "Completado",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-brand-orange/15 text-brand-orange",
  PROCESSING: "bg-brand-teal/15 text-brand-darkTeal",
  COMPLETED: "bg-brand-teal/15 text-brand-darkTeal",
  FAILED: "bg-brand-darkRed/15 text-brand-darkRed",
  REFUNDED: "bg-brand-beige text-brand-darkRed",
};

const methodLabels: Record<string, string> = {
  CULQI_CARD: "Tarjeta (Culqi)",
  CULQI_YAPE: "Yape (Culqi)",
  PAYPAL: "PayPal",
  BANK_TRANSFER: "Transferencia",
  CASH: "Efectivo",
};

export default function PagosPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [method, setMethod] = useState<string>("");
  const { toast } = useToast();

  const { data, isLoading, refetch } = trpc.payment.list.useQuery({
    page,
    limit: 10,
    status: (status as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED") || undefined,
    method: (method as "CULQI_CARD" | "CULQI_YAPE" | "PAYPAL" | "BANK_TRANSFER" | "CASH") || undefined,
  });

  const { data: stats } = trpc.payment.getStats.useQuery();

  const verifyPayment = trpc.payment.markAsVerified.useMutation({
    onSuccess: () => {
      toast({ title: "Pago verificado exitosamente" });
      refetch();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-darkRed">Pagos</h1>
        <p className="font-serif italic text-brand-teal">Control de pagos y transacciones</p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <DollarSign className="h-4 w-4 text-brand-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-teal">
                S/ {Number(stats.completed.total).toFixed(2)}
              </div>
              <p className="text-xs font-serif italic text-brand-teal">
                {stats.completed.count} transacciones
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-brand-orange" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-orange">
                S/ {Number(stats.pending.total).toFixed(2)}
              </div>
              <p className="text-xs font-serif italic text-brand-teal">
                {stats.pending.count} transacciones
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reembolsados</CardTitle>
              <TrendingUp className="h-4 w-4 text-brand-darkTeal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-darkTeal">
                S/ {Number(stats.refunded.total).toFixed(2)}
              </div>
              <p className="text-xs font-serif italic text-brand-teal">
                {stats.refunded.count} transacciones
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transacciones</CardTitle>
          <CardDescription>
            {data ? `${data.total} pagos registrados` : "Cargando..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val === "ALL" ? "" : val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="PROCESSING">Procesando</SelectItem>
                <SelectItem value="COMPLETED">Completado</SelectItem>
                <SelectItem value="FAILED">Fallido</SelectItem>
                <SelectItem value="REFUNDED">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={method}
              onValueChange={(val) => {
                setMethod(val === "ALL" ? "" : val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="CULQI_CARD">Tarjeta (Culqi)</SelectItem>
                <SelectItem value="CULQI_YAPE">Yape</SelectItem>
                <SelectItem value="PAYPAL">PayPal</SelectItem>
                <SelectItem value="BANK_TRANSFER">Transferencia</SelectItem>
                <SelectItem value="CASH">Efectivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data?.payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron pagos
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reserva</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tour</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.payments.map((payment: Payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.reservation.referenceCode.slice(0, 12)}...
                      </TableCell>
                      <TableCell>
                        {payment.reservation.client.firstName}{" "}
                        {payment.reservation.client.lastName}
                      </TableCell>
                      <TableCell>{payment.reservation.tour.nameEs}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {methodLabels[payment.method] || payment.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.currency} {Number(payment.amount).toFixed(2)}
                        {payment.isDeposit && (
                          <span className="ml-1 text-xs text-muted-foreground">(Dep.)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[payment.status] || ""} variant="secondary">
                          {statusLabels[payment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(payment.createdAt).toLocaleDateString("es-PE")}
                      </TableCell>
                      <TableCell>
                        {payment.status === "PENDING" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  verifyPayment.mutate({ id: payment.id })
                                }
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Verificar Pago
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data && data.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm font-serif italic text-brand-teal">
                    Página {data.page} de {data.pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= (data?.pages ?? 1)}
                    >
                      Siguiente <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
