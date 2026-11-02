"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import type { RouterOutput } from "@/types";
import { DownloadPDFButton } from "@/components/pdf/download-button";

type Reservation = RouterOutput["reservation"]["list"]["reservations"][number];

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/admin/list-states";
import { formatDate, formatMoney } from "@/lib/format";
import { reservationOriginLabel, statusLabel, statusOptions, trafficSourceLabel } from "@/lib/status";
import { formatTrpcError } from "@/lib/trpc-error";
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  CalendarCheck,
} from "lucide-react";

/**
 * Fecha del viaje: la salida programada si existe y, si no, la que pidió el
 * cliente en el calendario abierto. Mirar sólo `departure` dejaba la mayoría
 * de las reservas "Sin fecha".
 */
function reservationDateStr(r: { departure?: { departureDate: string | Date } | null; travelDate?: string | Date | null }): string {
  return formatDate(r.departure?.departureDate ?? r.travelDate);
}

export default function ReservasPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const { toast } = useToast();

  const { data, isLoading, error, refetch, isRefetching } = trpc.reservation.list.useQuery({
    page,
    limit: 10,
    search: search || undefined,
    status: (status as "PENDING" | "CONFIRMED" | "PAID" | "COMPLETED" | "CANCELLED") || undefined,
  });

  const updateStatus = trpc.reservation.updateStatus.useMutation({
    onSuccess: () => {
      toast({ title: "Estado actualizado" });
      refetch();
      setSelectedId(null);
    },
    onError: (error) => {
      toast({ title: "No se pudo actualizar el estado", description: formatTrpcError(error), variant: "destructive" });
    },
  });

  const handleStatusChange = () => {
    if (selectedId && newStatus) {
      updateStatus.mutate({
        id: selectedId,
        status: newStatus as "PENDING" | "CONFIRMED" | "PAID" | "COMPLETED" | "CANCELLED",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservas"
        subtitle="Gestiona las reservas de tours"
        actions={
          <Button asChild>
            <Link href="/admin/reservas/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Reserva
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Reservas</CardTitle>
          <CardDescription>
            {data ? `${data.total} reservas en total` : error ? "—" : "Cargando..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap mb-6">
            <div className="relative flex-1 min-w-0 sm:min-w-[240px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, cliente o tour..."
                aria-label="Buscar reservas"
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
                {statusOptions("reservation").map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <TableSkeleton />
          ) : error ? (
            <ErrorState title="No se pudieron cargar las reservas" error={error} onRetry={() => refetch()} isRetrying={isRefetching} />
          ) : data?.reservations.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No se encontraron reservas"
              description={search || status ? "Prueba con otros filtros de búsqueda." : "Las reservas nuevas aparecerán aquí."}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Tour</TableHead>
                    <TableHead>Fecha salida</TableHead>
                    <TableHead className="hidden lg:table-cell">Personas</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden xl:table-cell">Origen</TableHead>
                    <TableHead className="hidden xl:table-cell">Fuente</TableHead>
                    <TableHead className="hidden xl:table-cell">Campaña</TableHead>
                    <TableHead className="hidden sm:table-cell">Voucher</TableHead>
                    <TableHead className="w-[50px]"><span className="sr-only">Acciones</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.reservations.map((reservation: Reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-mono text-sm">
                        {reservation.referenceCode}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {reservation.client.firstName} {reservation.client.lastName}
                          </p>
                          <p className="text-sm font-serif italic text-brand-teal">
                            {reservation.client.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{reservation.tour.nameEs}</TableCell>
                      <TableCell>
                        {reservationDateStr(reservation) || "Sin fecha"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {reservation.adults}A {reservation.children > 0 ? `+ ${reservation.children}N` : ""}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatMoney(reservation.totalAmount, reservation.currency)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge domain="reservation" status={reservation.status} />
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Badge variant="outline">{reservationOriginLabel(reservation.origin)}</Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {(reservation as any).firstSource && (reservation as any).firstSource !== "direct" ? (
                          <div className="text-xs space-y-0.5">
                            <div><span className="text-muted-foreground">Primer contacto:</span> <Badge variant="secondary" className="text-xs px-1.5 py-0">{trafficSourceLabel((reservation as any).firstSource)}</Badge></div>
                            {(reservation as any).lastSource && (reservation as any).lastSource !== (reservation as any).firstSource && (
                              <div><span className="text-muted-foreground">Último contacto:</span> <Badge variant="secondary" className="text-xs px-1.5 py-0">{trafficSourceLabel((reservation as any).lastSource)}</Badge></div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{trafficSourceLabel((reservation as any).firstSource)}</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-xs">{(reservation as any).utmCampaign || "—"}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <DownloadPDFButton
                          isEs={true}
                          variant="ghost"
                          className="h-8 gap-1.5 px-2.5 text-xs font-medium"
                          data={{
                            referenceCode: reservation.referenceCode,
                            serviceName: reservation.tour?.nameEs || "Servicio",
                            serviceDescription: reservation.tour?.shortDescEs || null,
                            serviceImageUrl: (reservation.tour as any)?.images?.[0]?.url || null,
                            serviceDestination: (reservation.tour as any)?.destination || null,
                            serviceDurationLabel:
                              (reservation.tour as any)?.durationDays && (reservation.tour as any).durationDays > 0
                                ? `${(reservation.tour as any).durationDays}D / ${(reservation.tour as any).durationNights ?? Math.max(0, (reservation.tour as any).durationDays - 1)}N`
                                : (reservation.tour as any)?.durationHours
                                  ? `${(reservation.tour as any).durationHours}h`
                                  : null,
                            serviceIncludes: ((reservation.tour as any)?.includes || []).map((i: { textEs: string }) => i.textEs),
                            clientName: `${reservation.client.firstName} ${reservation.client.lastName}`,
                            clientEmail: reservation.client.email,
                            clientPhone: (reservation.client as any).phone || null,
                            amountPaid: ["PAID", "COMPLETED"].includes(reservation.status) ? Number(reservation.totalAmount) : 0,
                            totalAmount: Number(reservation.totalAmount),
                            currency: reservation.currency,
                            dateStr: reservationDateStr(reservation) || "Sin fecha",
                            adults: reservation.adults,
                            children: reservation.children,
                            isEs: true,
                            type: "RESERVATION" as const,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Acciones para la reserva ${reservation.referenceCode}`}
                              title="Acciones"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedId(reservation.id);
                                setNewStatus("CONFIRMED");
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" /> Confirmar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedId(reservation.id);
                                setNewStatus("PAID");
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" /> Marcar Pagada
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedId(reservation.id);
                                setNewStatus("COMPLETED");
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" /> Completar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedId(reservation.id);
                                setNewStatus("CANCELLED");
                              }}
                              className="text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                  itemLabel="reservas"
                  onPageChange={setPage}
                  className="mt-4"
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirm status change dialog */}
      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar estado de reserva</DialogTitle>
            <DialogDescription>
              ¿Confirmas cambiar el estado a &quot;{statusLabel("reservation", newStatus)}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleStatusChange} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
