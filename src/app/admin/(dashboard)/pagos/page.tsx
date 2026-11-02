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
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/admin/list-states";
import { formatMoney, formatTimestampDate } from "@/lib/format";
import { paymentMethodLabel, statusOptions } from "@/lib/status";
import { formatTrpcError } from "@/lib/trpc-error";
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  CreditCard,
  DollarSign,
  Clock,
  TrendingUp,
} from "lucide-react";

// "USD 1,234.00 · PEN 560.00": un total por moneda, nunca sumados entre sí.
function formatTotals(totals: { currency: string; amount: number }[]): string {
  if (totals.length === 0) return formatMoney(0, "USD");
  return totals.map((t) => formatMoney(t.amount, t.currency)).join(" · ");
}

export default function PagosPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [method, setMethod] = useState<string>("");
  const [search, setSearch] = useState("");
  const [verifyTarget, setVerifyTarget] = useState<Payment | null>(null);
  const { toast } = useToast();

  const { data, isLoading, error, refetch, isRefetching } = trpc.payment.list.useQuery({
    page,
    limit: 10,
    status: (status as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED") || undefined,
    method: (method as "CULQI_CARD" | "CULQI_YAPE" | "PAYPAL" | "BANK_TRANSFER" | "CASH") || undefined,
    search: search.trim() || undefined,
  });

  const { data: stats, refetch: refetchStats } = trpc.payment.getStats.useQuery();

  const verifyPayment = trpc.payment.markAsVerified.useMutation({
    onSuccess: () => {
      toast({ title: "Pago verificado exitosamente" });
      refetch();
      refetchStats();
      setVerifyTarget(null);
    },
    onError: (error) => {
      toast({ title: "No se pudo verificar el pago", description: formatTrpcError(error), variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Pagos" subtitle="Control de pagos y transacciones" />

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
                {formatTotals(stats.completed.totals)}
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
                {formatTotals(stats.pending.totals)}
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
                {formatTotals(stats.refunded.totals)}
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
            {data ? `${data.total} pagos registrados` : error ? "—" : "Cargando..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap mb-6">
            <div className="relative flex-1 min-w-0 sm:min-w-[240px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente o código de reserva..."
                aria-label="Buscar pagos"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val === "ALL" ? "" : val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por estado">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {statusOptions("payment").map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={method}
              onValueChange={(val) => {
                setMethod(val === "ALL" ? "" : val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por método">
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
            <TableSkeleton />
          ) : error ? (
            <ErrorState title="No se pudieron cargar los pagos" error={error} onRetry={() => refetch()} isRetrying={isRefetching} />
          ) : data?.payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No se encontraron pagos"
              description={status || method || search ? "Prueba con otros filtros." : "Los pagos registrados aparecerán aquí."}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reserva</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden lg:table-cell">Tour</TableHead>
                    <TableHead className="hidden md:table-cell">Método</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden md:table-cell">Fecha</TableHead>
                    <TableHead className="w-[50px]"><span className="sr-only">Acciones</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.payments.map((payment: Payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm max-w-[160px]">
                        <span className="block truncate" title={payment.reservation.referenceCode}>
                          {payment.reservation.referenceCode}
                        </span>
                      </TableCell>
                      <TableCell>
                        {payment.reservation.client.firstName}{" "}
                        {payment.reservation.client.lastName}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{payment.reservation.tour.nameEs}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">
                          {paymentMethodLabel(payment.method)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatMoney(payment.amount, payment.currency)}
                        {payment.isDeposit && (
                          <span className="ml-1 text-xs text-muted-foreground">(Dep.)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge domain="payment" status={payment.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {formatTimestampDate(payment.createdAt)}
                      </TableCell>
                      <TableCell>
                        {payment.status === "PENDING" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Acciones para el pago de la reserva ${payment.reservation.referenceCode}`}
                                title="Acciones"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setVerifyTarget(payment)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Verificar pago
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data && (
                <Pagination
                  page={page}
                  pages={data.pages}
                  total={data.total}
                  itemLabel="pagos"
                  onPageChange={setPage}
                  className="mt-4"
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!verifyTarget}
        onOpenChange={(open) => !open && setVerifyTarget(null)}
        title="Verificar pago"
        description={
          verifyTarget && (
            <>
              <p>
                Se marcará como <strong>completado</strong> el pago de{" "}
                <strong>{formatMoney(Number(verifyTarget.amount), verifyTarget.currency)}</strong>
                {verifyTarget.isDeposit ? " (depósito)" : ""} de{" "}
                <strong>
                  {verifyTarget.reservation.client.firstName} {verifyTarget.reservation.client.lastName}
                </strong>{" "}
                ({paymentMethodLabel(verifyTarget.method)}), reserva{" "}
                <span className="font-mono">{verifyTarget.reservation.referenceCode}</span>.
              </p>
              <p>Confirma sólo si el dinero ya ingresó a la cuenta. Quedará registrado con tu usuario.</p>
            </>
          )
        }
        confirmLabel="Verificar pago"
        isPending={verifyPayment.isPending}
        onConfirm={() => verifyTarget && verifyPayment.mutate({ id: verifyTarget.id })}
      />
    </div>
  );
}
