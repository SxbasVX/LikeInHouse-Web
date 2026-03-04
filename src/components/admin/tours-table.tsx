"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { MoreHorizontal, Pencil, Eye, EyeOff, Star, StarOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Tour {
  id: string;
  slug: string;
  nameEs: string;
  destination: string;
  status: string;
  isFeatured: boolean;
  category: string;
  durationDays: number;
  durationNights: number;
  images: { url: string; altEs: string | null }[];
  pricing: { basePricePenAdult: any; basePriceUsdAdult: any } | null;
  _count: { reservations: number; departures: number };
}

interface ToursTableProps {
  tours: Tour[];
  onRefresh: () => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Borrador", variant: "secondary" },
  PUBLISHED: { label: "Publicado", variant: "default" },
  ARCHIVED: { label: "Archivado", variant: "outline" },
};

export function ToursTable({ tours, onRefresh }: ToursTableProps) {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const togglePublish = trpc.tour.togglePublish.useMutation({
    onSuccess: (tour) => {
      toast({ title: `Tour ${tour.status === "PUBLISHED" ? "publicado" : "despublicado"}` });
      onRefresh();
    },
  });

  const toggleFeatured = trpc.tour.toggleFeatured.useMutation({
    onSuccess: (tour) => {
      toast({ title: tour.isFeatured ? "Marcado como destacado" : "Quitado de destacados" });
      onRefresh();
    },
  });

  const deleteTour = trpc.tour.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Tour eliminado" });
      setDeleteId(null);
      onRefresh();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tour</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead>Duracion</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Precio (PEN)</TableHead>
            <TableHead>Reservas</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tours.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No se encontraron tours
              </TableCell>
            </TableRow>
          ) : (
            tours.map((tour) => (
              <TableRow key={tour.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {tour.images[0] ? (
                      <img
                        src={tour.images[0].url}
                        alt={tour.images[0].altEs || tour.nameEs}
                        className="h-10 w-14 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-14 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        Sin foto
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{tour.nameEs}</p>
                      <p className="text-xs text-muted-foreground">{tour.category}</p>
                    </div>
                    {tour.isFeatured && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                </TableCell>
                <TableCell>{tour.destination}</TableCell>
                <TableCell>{tour.durationDays}D/{tour.durationNights}N</TableCell>
                <TableCell>
                  <Badge variant={statusConfig[tour.status]?.variant || "secondary"}>
                    {statusConfig[tour.status]?.label || tour.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {tour.pricing
                    ? `S/ ${Number(tour.pricing.basePricePenAdult).toFixed(0)}`
                    : "-"}
                </TableCell>
                <TableCell>{tour._count.reservations}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/tours/${tour.id}/editar`} className="gap-2">
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => togglePublish.mutate({ id: tour.id })}
                      >
                        {tour.status === "PUBLISHED" ? (
                          <>
                            <EyeOff className="h-4 w-4" /> Despublicar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" /> Publicar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => toggleFeatured.mutate({ id: tour.id })}
                      >
                        {tour.isFeatured ? (
                          <>
                            <StarOff className="h-4 w-4" /> Quitar destacado
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4" /> Destacar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 text-destructive"
                        onClick={() => setDeleteId(tour.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar tour</DialogTitle>
            <DialogDescription>
              Esta accion no se puede deshacer. Se eliminara el tour y todos sus
              datos asociados (itinerario, precios, imagenes, fechas de salida).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteTour.mutate({ id: deleteId })}
              disabled={deleteTour.isPending}
            >
              {deleteTour.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
