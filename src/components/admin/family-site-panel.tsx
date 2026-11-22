"use client";

import { useState } from "react";
import { Baby, Copy, ExternalLink, Loader2, RefreshCw, Trash2 } from "lucide-react";
import Image from "next/image";
import { ImageUpload } from "@/components/ui/image-upload";
import { FAMILY_CAPTION_MAX, FAMILY_GALLERY_MAX, FAMILY_GENERATIONS, type FamilyGeneration, type FamilySiteImages } from "@/lib/family-site";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { formatTrpcError } from "@/lib/trpc-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

const GENERATION_LABELS: Record<FamilyGeneration, string> = {
  kids: "Viajes a su ritmo",
  teens: "Edades claras",
  parents: "Todo organizado",
  grandparents: "Recuerdos para todos",
};

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

  const saveImages = trpc.content.familySiteImagesUpdate.useMutation({
    onSuccess: async () => {
      await utils.content.familySiteStatus.invalidate();
      toast({ title: "Fotos guardadas" });
    },
    onError,
  });
  const updateImages = (next: FamilySiteImages) => saveImages.mutate(next);

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

            {/* Fotos de familias: hero y "Momentos en familia" */}
            <div className="space-y-6 border-t pt-6">
              <div>
                <h3 className="font-semibold">Foto principal</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Va de fondo en el inicio de la web familiar. Usa una foto horizontal de una familia viajando. Si la dejas vacía, se usa la del primer tour familiar.
                </p>
                <ImageUpload
                  value={data.images.hero ?? ""}
                  disabled={saveImages.isPending}
                  onChange={(url) => updateImages({ ...data.images, hero: url })}
                  onRemove={() => updateImages({ ...data.images, hero: null })}
                />
              </div>

              <div>
                <h3 className="font-semibold">Fotos de &quot;Pensado para viajar en familia&quot;</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Una foto real de familias para cada tarjeta. Mientras no haya foto, se muestra el ícono dibujado.
                </p>
                <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {FAMILY_GENERATIONS.map((gen) => (
                    <li key={gen} className="space-y-2">
                      <p className="text-sm font-medium">{GENERATION_LABELS[gen]}</p>
                      <ImageUpload
                        value={data.images.generations[gen] ?? ""}
                        disabled={saveImages.isPending}
                        onChange={(url) => updateImages({ ...data.images, generations: { ...data.images.generations, [gen]: url } })}
                        onRemove={() => updateImages({ ...data.images, generations: { ...data.images.generations, [gen]: null } })}
                      />
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold">Estas familias también lo vivieron ({data.images.gallery.length}/{FAMILY_GALLERY_MAX})</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Fotos reales de familias en sus tours, con una leyenda opcional (ej. &quot;Familia Rodríguez · Cusco 2025&quot;). El carrusel aparece en el inicio cuando hay al menos 3. Pide permiso a las familias antes de publicarlas.
                </p>
                <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {data.images.gallery.map((item, i) => (
                    <li key={item.url} className="space-y-2">
                      <div className="relative aspect-square overflow-hidden rounded-md border">
                        <Image src={item.url} alt={item.caption || `Foto ${i + 1}`} fill className="object-cover" sizes="200px" />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute right-1 top-1 h-7 w-7"
                          aria-label={`Quitar foto ${i + 1}`}
                          disabled={saveImages.isPending}
                          onClick={() => updateImages({ ...data.images, gallery: data.images.gallery.filter((g) => g.url !== item.url) })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Input
                        aria-label={`Leyenda de la foto ${i + 1}`}
                        placeholder="Familia Rodríguez · Cusco 2025"
                        maxLength={FAMILY_CAPTION_MAX}
                        defaultValue={item.caption}
                        disabled={saveImages.isPending}
                        onBlur={(e) => {
                          const caption = e.currentTarget.value.trim();
                          if (caption === item.caption) return;
                          updateImages({
                            ...data.images,
                            gallery: data.images.gallery.map((g) => (g.url === item.url ? { ...g, caption } : g)),
                          });
                        }}
                      />
                    </li>
                  ))}
                </ul>
                {data.images.gallery.length < FAMILY_GALLERY_MAX && (
                  <ImageUpload
                    value=""
                    disabled={saveImages.isPending}
                    onChange={(url) => updateImages({ ...data.images, gallery: [...data.images.gallery, { url, caption: "" }] })}
                    onRemove={() => {}}
                  />
                )}
              </div>
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
