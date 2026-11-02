"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Phone, MapPin, FileText, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/admin/list-states";
import { formatDateTime, formatMoney } from "@/lib/format";
import { statusLabel } from "@/lib/status";
import { formatTrpcError } from "@/lib/trpc-error";
import {
  complaintTypeLabels,
  complaintItemTypeLabels,
  type ComplaintStatus as Status,
} from "@/components/admin/complaint-labels";

export default function ReclamacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: complaint, isLoading, error, refetch, isRefetching } = trpc.complaint.getById.useQuery({ id });

  const [status, setStatus] = useState<Status>("EN_PROCESO");
  const [response, setResponse] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (complaint) {
      setStatus((complaint.status === "PENDIENTE" ? "EN_PROCESO" : complaint.status) as Status);
      setResponse(complaint.response ?? "");
    }
  }, [complaint]);

  const respondMut = trpc.complaint.respond.useMutation({
    onSuccess: () => {
      toast({ title: "Respuesta enviada", description: "Se notificó al consumidor por email." });
      setConfirmOpen(false);
      utils.complaint.getById.invalidate({ id });
      utils.complaint.list.invalidate();
      utils.complaint.stats.invalidate();
    },
    onError: (e) => toast({ title: "No se pudo enviar la respuesta", description: formatTrpcError(e), variant: "destructive" }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (response.trim().length < 5) {
      toast({ title: "La respuesta debe tener al menos 5 caracteres", variant: "destructive" });
      return;
    }
    setConfirmOpen(true);
  }

  const backLink = (
    <Button variant="ghost" size="sm" asChild className="-ml-2">
      <Link href="/admin/reclamaciones">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a la lista
      </Link>
    </Button>
  );

  if (isLoading) {
    return <TableSkeleton rows={4} rowClassName="h-32" />;
  }

  if (error && error.data?.code !== "NOT_FOUND") {
    return (
      <div className="space-y-6">
        {backLink}
        <ErrorState title="No se pudo cargar el reclamo" error={error} onRetry={() => refetch()} isRetrying={isRefetching} />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="space-y-6">
        {backLink}
        <EmptyState title="Reclamo no encontrado" description="El registro no existe o fue eliminado." />
      </div>
    );
  }

  const daysAgo = Math.floor((Date.now() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = 30 - daysAgo;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {backLink}
        <PageHeader
          title={<span className="font-mono">{complaint.code}</span>}
          subtitle={`Registrado el ${formatDateTime(complaint.createdAt, { dateStyle: "long", timeStyle: "short" })}`}
          actions={
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{complaintTypeLabels[complaint.type] ?? complaint.type}</Badge>
                <Badge variant={complaint.itemType === "SERVICIO" ? "secondary" : "default"}>
                  {complaintItemTypeLabels[complaint.itemType] ?? complaint.itemType}
                </Badge>
                <StatusBadge domain="complaint" status={complaint.status} className="text-sm" />
              </div>
              {complaint.status !== "RESUELTO" && complaint.status !== "RECHAZADO" && (
                <p className={`text-xs ${daysRemaining < 10 ? "text-rose-600 font-semibold" : "text-muted-foreground"}`}>
                  {daysRemaining > 0
                    ? `${daysRemaining} días restantes (plazo 30 días)`
                    : `Plazo vencido hace ${Math.abs(daysRemaining)} días`}
                </p>
              )}
            </div>
          }
        />
      </div>

      {/* Consumidor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del consumidor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Nombre</p>
              <p className="font-medium">{complaint.consumerName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Documento</p>
              <p className="font-medium">{complaint.consumerDocType}: {complaint.consumerDocNum}</p>
            </div>
            <div className="md:col-span-2 flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p>{complaint.consumerAddress}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${complaint.consumerEmail}`} className="text-brand-orange hover:underline">{complaint.consumerEmail}</a>
            </div>
            {complaint.consumerPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${complaint.consumerPhone}`} className="text-brand-orange hover:underline">{complaint.consumerPhone}</a>
              </div>
            )}
            {complaint.isMinor && (
              <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 font-medium">Consumidor menor de edad</p>
                <p className="text-sm mt-1">
                  Padre/Madre/Tutor: <strong>{complaint.guardianName}</strong> (DNI: {complaint.guardianDocNum})
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bien/Servicio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bien o servicio contratado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="whitespace-pre-wrap">{complaint.itemDescription}</p>
          {complaint.amountClaimed && (
            <div className="inline-block bg-muted rounded-lg px-3 py-1.5">
              <span className="text-xs text-muted-foreground">Monto reclamado: </span>
              <span className="font-semibold">{formatMoney(complaint.amountClaimed, complaint.currency)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalle del reclamo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Detalle del {(complaintTypeLabels[complaint.type] ?? complaint.type).toLowerCase()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Lo sucedido</p>
            <p className="whitespace-pre-wrap">{complaint.detail}</p>
          </div>
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pedido del consumidor</p>
            <p className="whitespace-pre-wrap">{complaint.request}</p>
          </div>
        </CardContent>
      </Card>

      {/* Respuesta previa (si existe) */}
      {complaint.response && complaint.respondedAt && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-700" />
              Respuesta enviada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-xs text-muted-foreground">
              Enviada el {formatDateTime(complaint.respondedAt, { dateStyle: "long", timeStyle: "short" })}
            </p>
            <p className="whitespace-pre-wrap">{complaint.response}</p>
          </CardContent>
        </Card>
      )}

      {/* Formulario de respuesta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {complaint.response ? "Actualizar respuesta" : "Responder al consumidor"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="status">Estado del registro *</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN_PROCESO">En proceso</SelectItem>
                  <SelectItem value="RESUELTO">Resuelto</SelectItem>
                  <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="response">Respuesta al consumidor *</Label>
              <Textarea
                id="response"
                rows={8}
                required
                maxLength={5000}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Describe la respuesta que se enviará al consumidor..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Esta respuesta se enviará al email <strong>{complaint.consumerEmail}</strong> y quedará registrada.
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={respondMut.isPending}>
                {respondMut.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar respuesta
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={complaint.respondedAt ? "Reenviar respuesta" : "Enviar respuesta"}
        description={
          <>
            {complaint.respondedAt && (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-900">
                Este registro ya fue respondido el{" "}
                {formatDateTime(complaint.respondedAt, { dateStyle: "long", timeStyle: "short" })}.
                Se enviará un nuevo correo con la respuesta actualizada.
              </p>
            )}
            <p>
              Se enviará la respuesta por email a <strong>{complaint.consumerEmail}</strong> y el
              registro quedará como{" "}
              <strong>{statusLabel("complaint", status)}</strong>.
            </p>
          </>
        }
        confirmLabel={complaint.respondedAt ? "Reenviar" : "Enviar"}
        isPending={respondMut.isPending}
        onConfirm={() => respondMut.mutate({ id, status, response: response.trim() })}
      />

      {/* Metadata técnica */}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">Información técnica</summary>
        <div className="mt-2 space-y-1 font-mono">
          {complaint.ipAddress && <p>IP: {complaint.ipAddress}</p>}
          {complaint.userAgent && <p className="truncate">UA: {complaint.userAgent}</p>}
          <p>Idioma: {complaint.locale}</p>
          <p>ID: {complaint.id}</p>
        </div>
      </details>
    </div>
  );
}
