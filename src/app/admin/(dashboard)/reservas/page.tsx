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
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  FileDown,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  PAID: "Pagada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-brand-orange/15 text-brand-orange",
  CONFIRMED: "bg-brand-teal/15 text-brand-darkTeal",
  PAID: "bg-brand-teal/15 text-brand-darkTeal",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-brand-darkRed/15 text-brand-darkRed",
};

export default function ReservasPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const { toast } = useToast();

  const { data, isLoading, refetch } = trpc.reservation.list.useQuery({
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-darkRed">Reservas</h1>
          <p className="font-serif italic text-brand-teal">Gestiona las reservas de tours</p>
        </div>
        <Button asChild>
          <Link href="/admin/reservas/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Reserva
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Reservas</CardTitle>
          <CardDescription>
            {data ? `${data.total} reservas en total` : "Cargando..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, cliente o tour..."
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                <SelectItem value="PAID">Pagada</SelectItem>
                <SelectItem value="COMPLETED">Completada</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data?.reservations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron reservas
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tour</TableHead>
                    <TableHead>Fecha Salida</TableHead>
                    <TableHead>Personas</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Campaña</TableHead>
                    <TableHead>Voucher</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
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
                      <TableCell>{reservation.tour.nameEs}</TableCell>
                      <TableCell>
                        {reservation.departure
                          ? new Date(reservation.departure.departureDate).toLocaleDateString("es-PE")
                          : "Sin fecha"}
                      </TableCell>
                      <TableCell>
                        {reservation.adults}A {reservation.children > 0 ? `+ ${reservation.children}N` : ""}
                      </TableCell>
                      <TableCell className="font-medium">
                        {reservation.currency} {Number(reservation.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[reservation.status] || ""} variant="secondary">
                          {statusLabels[reservation.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{reservation.origin}</Badge>
                      </TableCell>
                      <TableCell>
                        {(reservation as any).firstSource && (reservation as any).firstSource !== "direct" ? (
                          <div className="text-xs space-y-0.5">
                            <div><span className="text-muted-foreground">1st:</span> <Badge variant="secondary" className="text-xs px-1.5 py-0">{(reservation as any).firstSource}</Badge></div>
                            {(reservation as any).lastSource && (reservation as any).lastSource !== (reservation as any).firstSource && (
                              <div><span className="text-muted-foreground">Last:</span> <Badge variant="secondary" className="text-xs px-1.5 py-0">{(reservation as any).lastSource}</Badge></div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{(reservation as any).firstSource || "—"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{(reservation as any).utmCampaign || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <DownloadPDFButton
                          isEs={true}
                          variant="ghost"
                          className="h-8 gap-1.5 px-2.5 text-xs font-medium"
                          data={{
                            referenceCode: reservation.referenceCode,
                            serviceName: reservation.tour?.nameEs || "Servicio",
                            serviceDescription: (reservation.tour as any)?.shortDescEs || "",
                            clientName: `${reservation.client.firstName} ${reservation.client.lastName}`,
                            clientEmail: reservation.client.email,
                            amountPaid: ["PAID", "COMPLETED"].includes(reservation.status) ? Number(reservation.totalAmount) : 0,
                            totalAmount: Number(reservation.totalAmount),
                            currency: reservation.currency,
                            dateStr: reservation.departure ? new Date(reservation.departure.departureDate).toLocaleDateString("es-PE") : "Sin fecha",
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
                            <Button variant="ghost" size="icon">
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

      {/* Confirm status change dialog */}
      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar estado de reserva</DialogTitle>
            <DialogDescription>
              ¿Confirmas cambiar el estado a &quot;{statusLabels[newStatus]}&quot;?
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
