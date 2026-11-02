"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2, MapPin, Plus, Settings2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatTrpcError } from "@/lib/trpc-error";
import { cn } from "@/lib/utils";

interface TourDestinationsPanelProps {
  selected?: string;
  onSelect: (destination: string | undefined) => void;
}

export function TourDestinationsPanel({ selected, onSelect }: TourDestinationsPanelProps) {
  const { data: summary, isLoading } = trpc.tour.destinationSummary.useQuery();
  const [managing, setManaging] = useState(false);

  const cities = summary?.filter((s) => s.inList) ?? [];
  const outOfList = summary?.filter((s) => !s.inList) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Tours por ciudad</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setManaging(true)}>
          <Settings2 className="mr-2 h-4 w-4" />
          Ciudades
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[...cities, ...outOfList].map((city) => {
              const active = selected === city.destination;
              return (
                <button
                  key={city.destination}
                  type="button"
                  onClick={() => onSelect(active ? undefined : city.destination)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                    active && "border-primary bg-primary/5",
                    !city.inList && "border-destructive/50",
                    city.total === 0 && "border-dashed"
                  )}
                >
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    {city.inList ? (
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                    )}
                    <span className="truncate">{city.destination}</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold">{city.total}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {city.inList
                      ? `${city.published} publicados · ${city.draft} borrador`
                      : "Fuera de la lista: reasigna estos tours"}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>

      {managing && (
        <ManageDestinationsDialog
          initial={cities.map((c) => c.destination)}
          counts={Object.fromEntries((summary ?? []).map((s) => [s.destination, s.total]))}
          onClose={() => setManaging(false)}
        />
      )}
    </Card>
  );
}

function ManageDestinationsDialog({
  initial,
  counts,
  onClose,
}: {
  initial: string[];
  counts: Record<string, number>;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [destinations, setDestinations] = useState(initial);
  const [newCity, setNewCity] = useState("");

  const save = trpc.tour.setDestinations.useMutation({
    onSuccess: async () => {
      toast({ title: "Lista de ciudades actualizada" });
      await Promise.all([utils.tour.destinations.invalidate(), utils.tour.destinationSummary.invalidate()]);
      onClose();
    },
    onError: (error) => toast({ title: "Error", description: formatTrpcError(error), variant: "destructive" }),
  });

  const addCity = () => {
    const value = newCity.trim();
    if (!value) return;
    if (!destinations.some((d) => d.toLocaleLowerCase("es") === value.toLocaleLowerCase("es"))) {
      setDestinations([...destinations, value]);
    }
    setNewCity("");
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !save.isPending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ciudades de operación</DialogTitle>
          <DialogDescription>
            Son las únicas opciones del campo Destino al crear o editar un tour. Solo puedes quitar ciudades sin tours.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCity();
              }
            }}
            placeholder="Nueva ciudad, ej. Huaraz"
            maxLength={60}
          />
          <Button type="button" variant="outline" onClick={addCity}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {destinations.map((d) => {
            const inUse = (counts[d] ?? 0) > 0;
            return (
              <div key={d} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>
                  {d} <span className="text-xs text-muted-foreground">({counts[d] ?? 0} tours)</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={inUse}
                  title={inUse ? "Tiene tours: cámbialos de ciudad antes de quitarla" : "Quitar"}
                  aria-label={`Quitar ciudad ${d}`}
                  onClick={() => setDestinations(destinations.filter((x) => x !== d))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate({ destinations })} disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
