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

type Status = "PENDIENTE" | "EN_PROCESO" | "RESUELTO" | "RECHAZADO";

export default function ReclamacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: complaint, isLoading } = trpc.complaint.getById.useQuery({ id });

  const [status, setStatus] = useState<Status>("EN_PROCESO");
  const [response, setResponse] = useState("");

  useEffect(() => {
    if (complaint) {
      setStatus((complaint.status === "PENDIENTE" ? "EN_PROCESO" : complaint.status) as Status);
      setResponse(complaint.response ?? "");
    }
  }, [complaint]);

  const respondMut = trpc.complaint.respond.useMutation({
    onSuccess: () => {
      toast({ title: "Respuesta enviada", description: "Se notificó al consumidor por email." });
      utils.complaint.getById.invalidate({ id });
      utils.complaint.list.invalidate();
      utils.complaint.stats.invalidate();
    },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (response.trim().length < 5) {
      toast({ title: "La respuesta debe tener al menos 5 caracteres", variant: "destructive" });
      return;
    }
    respondMut.mutate({ id, status, response: response.trim() });
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  }

  if (!complaint) {
    return <div className="p-8 text-center text-muted-foreground">Reclamo no encontrado.</div>;
  }

  const daysAgo = Math.floor((Date.now() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = 30 - daysAgo;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/admin/reclamaciones">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a la lista
          </Link>
        </Button>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold font-mono">{complaint.code}</h2>
              <Badge variant="outline">{complaint.type}</Badge>
              <Badge variant={complaint.itemType === "SERVICIO" ? "secondary" : "default"}>
                {complaint.itemType}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Registrado el {new Date(complaint.createdAt).toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" })}
            </p>
          </div>
          <div className="text-right">
            <Badge
              variant={complaint.status === "PENDIENTE" ? "destructive" : complaint.status === "RESUELTO" ? "secondary" : "default"}
              className="text-sm"
            >
              {complaint.status}
            </Badge>
            {complaint.status !== "RESUELTO" && complaint.status !== "RECHAZADO" && (
              <p className={`text-xs mt-1 ${daysRemaining < 10 ? "text-rose-600 font-semibold" : "text-muted-foreground"}`}>
                {daysRemaining > 0
                  ? `${daysRemaining} días restantes (plazo 30 días)`
                  : `Plazo vencido hace ${Math.abs(daysRemaining)} días`}
              </p>
            )}
          </div>
        </div>
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
              <span className="font-semibold">{complaint.currency} {Number(complaint.amountClaimed).toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalle del reclamo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle del {complaint.type.toLowerCase()}</CardTitle>
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
              Enviada el {new Date(complaint.respondedAt).toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" })}
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
