"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Search, UserPlus } from "lucide-react";
import Link from "next/link";

export default function NuevaReservaPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [clientId, setClientId] = useState("");
  const [tourId, setTourId] = useState("");
  const [departureId, setDepartureId] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [depositAmount, setDepositAmount] = useState<number | undefined>();
  const [internalNotes, setInternalNotes] = useState("");

  // Client search
  const [clientSearch, setClientSearch] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientData, setNewClientData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    country: "",
  });

  // Queries
  const { data: clientsData } = trpc.client.list.useQuery({
    page: 1,
    limit: 50,
    search: clientSearch || undefined,
  });

  const { data: toursData } = trpc.tour.list.useQuery({
    page: 1,
    limit: 100,
    status: "PUBLISHED",
    tourType: "BOOKABLE",
  });

  const { data: tourDetail } = trpc.tour.getById.useQuery(
    { id: tourId },
    { enabled: !!tourId }
  );

  // Mutations
  const createClient = trpc.client.create.useMutation({
    onSuccess: (client) => {
      setClientId(client.id);
      setShowNewClient(false);
      toast({ title: "Cliente creado", description: `${client.firstName} ${client.lastName}` });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createReservation = trpc.reservation.create.useMutation({
    onSuccess: (res) => {
      toast({ title: "Reserva creada", description: `Ref: ${res.referenceCode}` });
      router.push("/admin/reservas");
    },
    onError: (err) => toast({ title: "Error al crear reserva", description: err.message, variant: "destructive" }),
  });

  // Computed pricing
  const pricing = useMemo(() => {
    if (!tourDetail?.pricing) return null;
    const adultPrice = Number(tourDetail.pricing.basePriceUsdAdult);
    const childPrice = Number(tourDetail.pricing.basePriceUsdChild);
    const total = adultPrice * adults + childPrice * children;
    return { adultPrice, childPrice, total };
  }, [tourDetail, adults, children]);

  // Available departures (future, with capacity)
  const availableDepartures = useMemo(() => {
    if (!tourDetail?.departures) return [];
    const now = new Date();
    return tourDetail.departures.filter(
      (d) => new Date(d.departureDate) > now && d.status === "AVAILABLE"
    );
  }, [tourDetail]);

  // Selected departure capacity
  const selectedDeparture = availableDepartures.find((d) => d.id === departureId);
  const availableCapacity = selectedDeparture
    ? selectedDeparture.maxCapacity - selectedDeparture.bookedCount
    : null;

  // Selected client name
  const selectedClient = clientsData?.clients.find((c) => c.id === clientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !tourId || !pricing) return;

    createReservation.mutate({
      clientId,
      tourId,
      departureId: departureId || undefined,
      adults,
      children,
      currency: "USD",
      totalAmount: pricing.total,
      depositAmount,
      origin: "MANUAL",
      internalNotes: internalNotes || undefined,
    });
  };

  const handleCreateClient = () => {
    createClient.mutate({
      email: newClientData.email,
      firstName: newClientData.firstName,
      lastName: newClientData.lastName,
      phone: newClientData.phone || undefined,
      country: newClientData.country || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/reservas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-darkRed">Nueva Reserva Manual</h1>
          <p className="font-serif italic text-brand-teal">Crea una reserva para un cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliente</CardTitle>
              <CardDescription>Selecciona un cliente existente o crea uno nuevo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showNewClient ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, email o teléfono..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {clientsData && clientsData.clients.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                      {clientsData.clients.map((client) => (
                        <button
                          type="button"
                          key={client.id}
                          onClick={() => setClientId(client.id)}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                            clientId === client.id ? "bg-primary/10 border-l-2 border-primary" : ""
                          }`}
                        >
                          <span className="font-medium">{client.firstName} {client.lastName}</span>
                          <span className="text-muted-foreground ml-2">{client.email}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedClient && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">Seleccionado</Badge>
                      <span>{selectedClient.firstName} {selectedClient.lastName} — {selectedClient.email}</span>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewClient(true)}
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Crear nuevo cliente
                  </Button>
                </>
              ) : (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nombre *</Label>
                      <Input
                        value={newClientData.firstName}
                        onChange={(e) => setNewClientData((p) => ({ ...p, firstName: e.target.value }))}
                        placeholder="Juan"
                      />
                    </div>
                    <div>
                      <Label>Apellido *</Label>
                      <Input
                        value={newClientData.lastName}
                        onChange={(e) => setNewClientData((p) => ({ ...p, lastName: e.target.value }))}
                        placeholder="Pérez"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData((p) => ({ ...p, email: e.target.value }))}
                      placeholder="cliente@email.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Teléfono</Label>
                      <Input
                        value={newClientData.phone}
                        onChange={(e) => setNewClientData((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+51 999 888 777"
                      />
                    </div>
                    <div>
                      <Label>País</Label>
                      <Input
                        value={newClientData.country}
                        onChange={(e) => setNewClientData((p) => ({ ...p, country: e.target.value }))}
                        placeholder="Perú"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCreateClient}
                      disabled={!newClientData.email || !newClientData.firstName || !newClientData.lastName || createClient.isPending}
                      size="sm"
                    >
                      {createClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Crear Cliente
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewClient(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tour selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tour y Fecha</CardTitle>
              <CardDescription>Selecciona el tour y la fecha de salida</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tour *</Label>
                <Select value={tourId} onValueChange={(v) => { setTourId(v); setDepartureId(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tour" />
                  </SelectTrigger>
                  <SelectContent>
                    {toursData?.tours.map((tour) => (
                      <SelectItem key={tour.id} value={tour.id}>
                        {tour.nameEs} — {tour.destination}
                        {tour.pricing && ` (USD ${Number(tour.pricing.basePriceUsdAdult).toFixed(0)})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {tourId && availableDepartures.length > 0 && (
                <div>
                  <Label>Fecha de Salida</Label>
                  <Select value={departureId} onValueChange={setDepartureId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una fecha (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDepartures.map((dep) => {
                        const available = dep.maxCapacity - dep.bookedCount;
                        return (
                          <SelectItem key={dep.id} value={dep.id}>
                            {new Date(dep.departureDate).toLocaleDateString("es-PE", { timeZone: "UTC" })}
                            {" "}— {available} cupos disponibles
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {availableCapacity !== null && availableCapacity <= 3 && (
                    <p className="text-xs text-destructive mt-1">
                      Solo quedan {availableCapacity} cupos
                    </p>
                  )}
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Adultos *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={availableCapacity ?? 99}
                    value={adults}
                    onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div>
                  <Label>Niños</Label>
                  <Input
                    type="number"
                    min={0}
                    max={availableCapacity ? availableCapacity - adults : 99}
                    value={children}
                    onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notas Internas</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Notas internas sobre esta reserva (solo visible para el equipo)..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column: summary */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cliente</p>
                <p className="text-sm font-medium">
                  {selectedClient
                    ? `${selectedClient.firstName} ${selectedClient.lastName}`
                    : "No seleccionado"}
                </p>
              </div>

              {/* Tour */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tour</p>
                <p className="text-sm font-medium">
                  {toursData?.tours.find((t) => t.id === tourId)?.nameEs || "No seleccionado"}
                </p>
              </div>

              {/* Passengers */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pasajeros</p>
                <p className="text-sm font-medium">
                  {adults} adulto{adults !== 1 ? "s" : ""}
                  {children > 0 && `, ${children} niño${children !== 1 ? "s" : ""}`}
                </p>
              </div>

              <Separator />

              {/* Pricing breakdown */}
              {pricing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Adultos ({adults} × ${pricing.adultPrice.toFixed(2)})</span>
                    <span>${(pricing.adultPrice * adults).toFixed(2)}</span>
                  </div>
                  {children > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Niños ({children} × ${pricing.childPrice.toFixed(2)})</span>
                      <span>${(pricing.childPrice * children).toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>USD ${pricing.total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Deposit */}
              <div>
                <Label>Depósito (opcional)</Label>
                <Input
                  type="number"
                  min={0}
                  max={pricing?.total}
                  step={0.01}
                  placeholder="0.00"
                  value={depositAmount ?? ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setDepositAmount(isNaN(val) ? undefined : val);
                  }}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!clientId || !tourId || !pricing || createReservation.isPending}
              >
                {createReservation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Reserva"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
