"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { RouterOutput } from "@/types";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DownloadPDFButton } from "@/components/pdf/download-button";

type Quotation = RouterOutput["quotation"]["list"]["quotations"][number];
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MoreHorizontal,
  Send,
  CheckCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  LinkIcon,
  Copy,
  ExternalLink,
  Loader2,
  X,
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
  SENT: "bg-brand-teal/15 text-brand-darkTeal",
  VIEWED: "bg-brand-beige text-brand-darkRed",
  ACCEPTED: "bg-brand-teal/15 text-brand-darkTeal",
  CONVERTED: "bg-brand-darkTeal/15 text-brand-darkTeal",
  EXPIRED: "bg-brand-darkRed/15 text-brand-darkRed",
};

// =============================================
// Schema para crear cotizacion
// =============================================
const itemSchema = z.object({
  descriptionEs: z.string().min(1, "Descripcion requerida"),
  descriptionEn: z.string().optional(),
  adults: z.number().min(1).default(1),
  children: z.number().min(0).default(0),
  unitPrice: z.number().min(0, "Precio requerido"),
  quantity: z.number().min(1).default(1),
});

const createQuotationSchema = z.object({
  clientId: z.string().optional(),
  newClientName: z.string().optional(),
  newClientEmail: z.string().optional(),
  newClientPhone: z.string().optional(),
  titleEs: z.string().min(1, "Titulo requerido"),
  titleEn: z.string().optional(),
  notesEs: z.string().optional(),
  currency: z.literal("USD"),
  validDays: z.number().min(1).default(15),
  depositPercent: z.number().min(0).max(100).optional(),
  items: z.array(itemSchema).min(1, "Agrega al menos un item"),
});

type CreateQuotationForm = z.infer<typeof createQuotationSchema>;

export default function CotizacionesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [linkDialog, setLinkDialog] = useState<{ url: string; token: string } | null>(null);
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

  const sendEmail = trpc.quotation.sendEmail.useMutation({
    onSuccess: () => {
      toast({ title: "Correo enviado exitosamente" });
      refetch();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteQuotation = trpc.quotation.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Cotizacion eliminada" });
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const generatePaymentLink = trpc.paymentLink.createFromQuotation.useMutation({
    onSuccess: (link) => {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const url = `${baseUrl}/es/pagar/${link.token}`;
      setLinkDialog({ url, token: link.token });
      toast({ title: "Link de pago generado" });
      refetch();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado al portapapeles" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cotizaciones</h1>
          <p className="text-muted-foreground">Gestiona cotizaciones y genera links de pago</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nueva Cotizacion
        </Button>
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
                placeholder="Buscar por codigo, titulo o cliente..."
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
                    <TableHead>Codigo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Titulo</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Valida hasta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creada por</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.quotations.map((quotation: Quotation) => (
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
                            <DropdownMenuItem
                              onClick={() => sendEmail.mutate({ id: quotation.id })}
                              disabled={sendEmail.isPending}
                            >
                              <Send className="mr-2 h-4 w-4" /> {sendEmail.isPending ? "Enviando..." : "Enviar por Correo"}
                            </DropdownMenuItem>
                            {quotation.status === "VIEWED" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatus.mutate({ id: quotation.id, status: "ACCEPTED" })
                                }
                              >
                                <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Aceptada
                              </DropdownMenuItem>
                            )}
                            {(quotation.status === "DRAFT" || quotation.status === "SENT" || quotation.status === "ACCEPTED") && !(quotation as any).paymentLinkId && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => generatePaymentLink.mutate({ quotationId: quotation.id })}
                                  disabled={generatePaymentLink.isPending}
                                >
                                  <LinkIcon className="mr-2 h-4 w-4" />
                                  {generatePaymentLink.isPending ? "Generando..." : "Generar Link de Pago"}
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <div className="px-1 py-1">
                              <DownloadPDFButton
                                isEs={true}
                                variant="ghost"
                                className="w-full justify-start h-8 px-2 py-1.5 text-sm font-normal"
                                data={{
                                  referenceCode: quotation.referenceCode,
                                  serviceName: "Cotización de Viaje",
                                  clientName: `${quotation.client.firstName} ${quotation.client.lastName}`,
                                  clientEmail: quotation.client.email,
                                  amountPaid: 0,
                                  totalAmount: Number(quotation.totalAmount),
                                  currency: quotation.currency,
                                  dateStr: quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString("es-PE") : "Por definir",
                                  adults: 1,
                                  children: 0,
                                  isEs: true,
                                  type: "RESERVATION"
                                }}
                              />
                            </div>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(quotation.id)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
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
                    Pagina {data.page} de {data.pages}
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

      {/* Create Quotation Dialog */}
      <CreateQuotationDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSuccess={() => {
          refetch();
          setShowCreate(false);
        }}
      />

      {/* Payment Link Result Dialog */}
      <Dialog open={!!linkDialog} onOpenChange={() => setLinkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de Pago Generado</DialogTitle>
            <DialogDescription>
              Comparte este link con el cliente para que pueda realizar el pago.
            </DialogDescription>
          </DialogHeader>
          {linkDialog && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="flex-1 text-sm break-all">{linkDialog.url}</code>
                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(linkDialog.url)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => copyToClipboard(linkDialog.url)}>
                  <Copy className="h-4 w-4 mr-2" /> Copiar Link
                </Button>
                <Button variant="outline" asChild>
                  <a href={linkDialog.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> Abrir
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cotizacion</DialogTitle>
            <DialogDescription>
              Estas seguro? Esta accion no se puede deshacer.
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
              {deleteQuotation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =============================================
// Create Quotation Dialog
// =============================================
function CreateQuotationDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [clientMode, setClientMode] = useState<"existing" | "new">("new");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientLabel, setSelectedClientLabel] = useState("");

  const { data: clientsData } = trpc.client.list.useQuery(
    { page: 1, limit: 50, search: clientSearch || undefined },
    { enabled: open && clientMode === "existing" }
  );

  const createClient = trpc.client.create.useMutation();

  const createQuotation = trpc.quotation.create.useMutation({
    onSuccess: () => {
      toast({ title: "Cotizacion creada exitosamente" });
      onSuccess();
      reset();
      setClientMode("new");
      setClientSearch("");
      setSelectedClientLabel("");
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateQuotationForm>({
    resolver: zodResolver(createQuotationSchema) as any,
    defaultValues: {
      currency: "USD",
      validDays: 15,
      items: [{ descriptionEs: "", adults: 1, children: 0, unitPrice: 0, quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchItems = watch("items");
  const currency = watch("currency");

  const calculateSubtotal = (item: { unitPrice: number; quantity: number; adults: number; children: number }) => {
    return (item.unitPrice || 0) * (item.quantity || 1) * ((item.adults || 1) + (item.children || 0));
  };

  const grandTotal = watchItems?.reduce((sum, item) => sum + calculateSubtotal(item), 0) || 0;

  const onSubmit = async (data: CreateQuotationForm) => {
    let clientId = data.clientId;

    // If new client mode, create client first
    if (clientMode === "new") {
      if (!data.newClientName || !data.newClientEmail) {
        toast({ title: "Error", description: "Nombre y email del cliente son requeridos", variant: "destructive" });
        return;
      }
      const nameParts = data.newClientName.trim().split(" ");
      const firstName = nameParts[0] || data.newClientName;
      const lastName = nameParts.slice(1).join(" ") || "-";

      try {
        const newClient = await createClient.mutateAsync({
          firstName,
          lastName,
          email: data.newClientEmail,
          phone: data.newClientPhone || undefined,
        });
        clientId = newClient.id;
      } catch (err: any) {
        // If client already exists, try to find by email
        if (err.message?.includes("Ya existe")) {
          toast({ title: "Error", description: "Ya existe un cliente con ese email. Usa 'Cliente Existente' para buscarlo.", variant: "destructive" });
          return;
        }
        toast({ title: "Error", description: err.message, variant: "destructive" });
        return;
      }
    }

    if (!clientId) {
      toast({ title: "Error", description: "Selecciona o crea un cliente", variant: "destructive" });
      return;
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + data.validDays);

    createQuotation.mutate({
      clientId,
      titleEs: data.titleEs,
      titleEn: data.titleEn,
      notesEs: data.notesEs,
      currency: data.currency,
      totalAmount: grandTotal,
      validUntil: validUntil.toISOString(),
      depositPercent: data.depositPercent,
      items: data.items.map((item, index) => ({
        descriptionEs: item.descriptionEs,
        descriptionEn: item.descriptionEn,
        adults: item.adults,
        children: item.children,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: calculateSubtotal(item),
        sortOrder: index,
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Cotizacion</DialogTitle>
          <DialogDescription>
            Crea una cotizacion personalizada para un cliente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Cliente */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Cliente</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={clientMode === "new" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setClientMode("new"); setValue("clientId", ""); setSelectedClientLabel(""); }}
                >
                  Nuevo
                </Button>
                <Button
                  type="button"
                  variant={clientMode === "existing" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setClientMode("existing")}
                >
                  Existente
                </Button>
              </div>
            </div>

            {clientMode === "new" ? (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nombre completo *</Label>
                    <Input placeholder="Juan Perez" {...register("newClientName")} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email *</Label>
                    <Input type="email" placeholder="cliente@email.com" {...register("newClientEmail")} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Telefono (opcional)</Label>
                  <Input placeholder="+51 999 888 777" {...register("newClientPhone")} />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedClientLabel ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                    <span className="text-sm font-medium">{selectedClientLabel}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setValue("clientId", ""); setSelectedClientLabel(""); setClientSearch(""); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Buscar cliente por nombre o email..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                    />
                    {clientsData && clientsData.clients.length > 0 && (
                      <div className="border rounded-md max-h-32 overflow-y-auto">
                        {clientsData.clients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setValue("clientId", client.id);
                              setSelectedClientLabel(`${client.firstName} ${client.lastName} - ${client.email}`);
                              setClientSearch("");
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-0"
                          >
                            <span className="font-medium">{client.firstName} {client.lastName}</span>
                            <span className="text-muted-foreground ml-2">{client.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {clientSearch && clientsData?.clients.length === 0 && (
                      <p className="text-sm text-muted-foreground px-1">
                        No se encontro. <button type="button" className="text-primary underline" onClick={() => setClientMode("new")}>Crear nuevo cliente</button>
                      </p>
                    )}
                  </>
                )}
                <input type="hidden" {...register("clientId")} />
              </div>
            )}
          </div>

          {/* Titulo y moneda */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Titulo *</Label>
              <Input placeholder="Ej: Paquete Cusco + Machu Picchu 4D/3N" {...register("titleEs")} />
              {errors.titleEs && <span className="text-sm text-destructive">{errors.titleEs.message}</span>}
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={currency} onValueChange={(v) => setValue("currency", v as "USD")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Validez y deposito */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Validez (dias)</Label>
              <Input type="number" min={1} {...register("validDays", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Deposito (%)</Label>
              <Input type="number" min={0} max={100} placeholder="Ej: 30" {...register("depositPercent", { valueAsNumber: true })} />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Items de la Cotizacion</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ descriptionEs: "", adults: 1, children: 0, unitPrice: 0, quantity: 1 })}
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar Item
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Descripcion del servicio"
                      {...register(`items.${index}.descriptionEs`)}
                    />
                    {errors.items?.[index]?.descriptionEs && (
                      <span className="text-sm text-destructive">{errors.items[index]?.descriptionEs?.message}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Adultos</Label>
                      <Input type="number" min={1} {...register(`items.${index}.adults`, { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Ninos</Label>
                      <Input type="number" min={0} {...register(`items.${index}.children`, { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Precio Unit.</Label>
                      <Input type="number" min={0} step="0.01" {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cantidad</Label>
                      <Input type="number" min={1} {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                    </div>
                  </div>

                  <div className="text-right text-sm font-medium">
                    Subtotal: $ {calculateSubtotal(watchItems?.[index] || { unitPrice: 0, quantity: 1, adults: 1, children: 0 }).toFixed(2)}
                  </div>
                </div>
              </Card>
            ))}

            {errors.items && typeof errors.items === "object" && "message" in errors.items && (
              <span className="text-sm text-destructive">{(errors.items as any).message}</span>
            )}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">
              $ {grandTotal.toFixed(2)}
            </span>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea placeholder="Notas adicionales para el cliente..." {...register("notesEs")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createQuotation.isPending}>
              {createQuotation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando...
                </>
              ) : (
                "Crear Cotizacion"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
