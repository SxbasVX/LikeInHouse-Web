"use client";

import { useState } from "react";
import { Baby, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { formatTrpcError } from "@/lib/trpc-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

// Web familiar (familia.likeinhouseperu.com): queda en borrador hasta que un administrador la aprueba aquí.
export function FamilySitePanel() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const status = trpc.content.familySiteStatus.useQuery(undefined, { retry: false });
  const [confirm, setConfirm] = useState<null | "publish" | "unpublish" | "regenerate">(null);

  const onError = (error: Parameters<typeof formatTrpcError>[0]) =>
    toast({ title: "Error", description: formatTrpcError(error), variant: "destructive" });

  const previewLink = trpc.content.familySitePreviewLink.useMutation({
    onSuccess: async ({ previewUrl }, { regenerate }) => {
      await utils.content.familySiteStatus.invalidate();
      setConfirm(null);
      await copy(previewUrl, regenerate ? "Enlace nuevo copiado. El anterior ya no funciona." : "Enlace de vista previa copiado");
    },
    onError,
  });

  const publish = trpc.content.familySitePublish.useMutation({
    onSuccess: async ({ published }) => {
      await utils.content.familySiteStatus.invalidate();
      setConfirm(null);
      toast({ title: published ? "Web familiar publicada" : "Web familiar en borrador" });
    },
    onError,
  });

  async function copy(text: string, title: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title });
    } catch {
      toast({ title: "Copia el enlace manualmente", description: text });
    }
  }

  // Ventas no tiene acceso: la tarjeta simplemente no se muestra.
  if (status.error?.data?.code === "FORBIDDEN" || status.error?.data?.code === "UNAUTHORIZED") return null;

  const data = status.data;
  const isBusy = previewLink.isPending || publish.isPending;

  return (
    <Card className="border-brand-teal/40">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-brand-teal" aria-hidden />
            Web familiar
          </CardTitle>
          {data && (
            <Badge variant={data.published ? "default" : "secondary"}>
              {data.published ? "Publicada" : "Borrador"}
            </Badge>
          )}
        </div>
        <CardDescription>
          familia.likeinhouseperu.com muestra sólo los tours marcados como &quot;Familia&quot;. Mientras esté en borrador,
          el público ve &quot;Próximamente&quot;, Google no la indexa y la web general no muestra el banner ni el enlace
          &quot;Familias&quot;. Para revisarla antes, usa el enlace de vista previa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : status.error ? (
          <p className="text-sm text-destructive">{formatTrpcError(status.error)}</p>
        ) : data ? (
          <>
            <p className="text-sm">
              Tours familiares publicados: <strong>{data.familyTours}</strong>
              {data.familyTours === 0 && (
                <span className="text-muted-foreground"> · Marca tours con &quot;Familia&quot; en Tours &gt; Editar.</span>
              )}
            </p>

            <div className="flex flex-wrap gap-2">
              {data.published ? (
                <Button variant="outline" asChild>
                  <a href={data.siteUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Abrir web familiar
                  </a>
                </Button>
              ) : data.previewUrl ? (
                <>
                  <Button variant="outline" asChild>
                    <a href={data.previewUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> Ver vista previa
                    </a>
                  </Button>
                  <Button variant="outline" onClick={() => copy(data.previewUrl!, "Enlace de vista previa copiado")}>
                    <Copy className="mr-2 h-4 w-4" /> Copiar enlace
                  </Button>
                  <Button variant="ghost" disabled={isBusy} onClick={() => setConfirm("regenerate")}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Renovar enlace
                  </Button>
                </>
              ) : (
                <Button variant="outline" disabled={isBusy} onClick={() => previewLink.mutate({ regenerate: false })}>
                  {previewLink.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
                  Crear enlace de vista previa
                </Button>
              )}

              {data.published ? (
                <Button variant="secondary" disabled={isBusy} onClick={() => setConfirm("unpublish")}>
                  Volver a borrador
                </Button>
              ) : (
                <Button disabled={isBusy} onClick={() => setConfirm("publish")}>
                  Aprobar y publicar
                </Button>
              )}
            </div>
          </>
        ) : null}
      </CardContent>

      <ConfirmDialog
        open={confirm === "publish"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="¿Publicar la web familiar?"
        description="Quedará visible para todo el público, Google podrá indexarla y la web general mostrará el banner «¿Viajas con niños?» y el enlace «Familias». Sólo administradores pueden hacerlo."
        confirmLabel="Publicar"
        isPending={publish.isPending}
        onConfirm={() => publish.mutate({ published: true })}
      />
      <ConfirmDialog
        open={confirm === "unpublish"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="¿Volver la web familiar a borrador?"
        description="El público verá «Próximamente» y se ocultarán el banner y el enlace en la web general. Las reservas ya hechas no cambian."
        confirmLabel="Volver a borrador"
        destructive
        isPending={publish.isPending}
        onConfirm={() => publish.mutate({ published: false })}
      />
      <ConfirmDialog
        open={confirm === "regenerate"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="¿Renovar el enlace de vista previa?"
        description="Se crea un enlace nuevo y el anterior deja de funcionar. Úsalo si compartiste el enlace con alguien que ya no debe verla."
        confirmLabel="Renovar"
        isPending={previewLink.isPending}
        onConfirm={() => previewLink.mutate({ regenerate: true })}
      />
    </Card>
  );
}
