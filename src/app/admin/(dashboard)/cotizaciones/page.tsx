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
  Send,
  CheckCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  VIEWED: "Vista",
  ACCEPTED: "Aceptada",
  CONVERTED: "Convertida",
  EXPIRED: "Expirada",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  VIEWED: "bg-cyan-100 text-cyan-800",
  ACCEPTED: "bg-green-100 text-green-800",
  CONVERTED: "bg-purple-100 text-purple-800",
  EXPIRED: "bg-red-100 text-red-800",
};

export default function CotizacionesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data, isLoading, refetch } = trpc.quotation.list.useQuery({
    page,
    limit: 10,
    search: search || undefined,
    status: (status as "DRAFT" | "SENT" | "VIEWED" | "ACCEPTED" | "CONVERTED" | "EXPIRED") || undefined,
  });

  const updateStatus = trpc.quotation.updateStatus.useMutation({
    onSuccess: () => {
      toast({ title: "Estado actualizado" });
      refetch();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteQuotation = trpc.quotation.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Cotización eliminada" });
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cotizaciones</h1>
        <p className="text-muted-foreground">Gestiona las cotizaciones enviadas a clientes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cotizaciones</CardTitle>
          <CardDescription>
            {data ? `${data.total} cotizaciones en total` : "Cargando..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, título o cliente..."
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
                <SelectItem value="DRAFT">Borrador</SelectItem>
                <SelectItem value="SENT">Enviada</SelectItem>
                <SelectItem value="VIEWED">Vista</SelectItem>
                <SelectItem value="ACCEPTED">Aceptada</SelectItem>
                <SelectItem value="CONVERTED">Convertida</SelectItem>
                <SelectItem value="EXPIRED">Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data?.quotations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron cotizaciones
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Válida hasta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creada por</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.quotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-mono text-sm">
                        {quotation.referenceCode}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {quotation.client.firstName} {quotation.client.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {quotation.client.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{quotation.titleEs}</TableCell>
                      <TableCell>{quotation._count.items}</TableCell>
                      <TableCell className="font-medium">
                        {quotation.currency} {Number(quotation.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(quotation.validUntil).toLocaleDateString("es-PE")}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[quotation.status] || ""} variant="secondary">
                          {statusLabels[quotation.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {quotation.createdBy.name}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {quotation.status === "DRAFT" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatus.mutate({ id: quotation.id, status: "SENT" })
                                }
                              >
                                <Send className="mr-2 h-4 w-4" /> Marcar como Enviada
                              </DropdownMenuItem>
                            )}
                            {quotation.status === "VIEWED" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatus.mutate({ id: quotation.id, status: "ACCEPTED" })
                                }
                              >
                                <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Aceptada
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setDeleteId(quotation.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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
                  <p className="text-sm text-muted-foreground">
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

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cotización</DialogTitle>
            <DialogDescription>
              ¿Estás seguro? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteQuotation.mutate({ id: deleteId })}
              disabled={deleteQuotation.isPending}
            >
              {deleteQuotation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
