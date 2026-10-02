"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";
import { CldUploadWidget } from "next-cloudinary";

type CandidateData = Record<string, unknown> & {
  nameEs?: string | null;
  nameEn?: string | null;
  category?: string | null;
  destination?: string | null;
  shortDescEs?: string | null;
  shortDescEn?: string | null;
  longDescEs?: string | null;
  longDescEn?: string | null;
  durationDays?: number | null;
  durationNights?: number | null;
};

export function CatalogImportAccess() {
  const { toast } = useToast();
  const [secret, setSecret] = useState("");
  const [authorizedSecret, setAuthorizedSecret] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedPdf, setUploadedPdf] = useState<{ url: string; filename: string } | null>(null);
  const [result, setResult] = useState<{
    id: string;
    totalTours: number;
    readyCount: number;
    reviewCount: number;
    duplicateCount: number;
    tours: Array<{
      id: string;
      status: string;
      createdTourId?: string | null;
      sourcePages: number[];
      tourDataJson: CandidateData;
      issues: Array<{ type: string; field?: string | null; reason: string }>;
    }>;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const createDraft = trpc.catalogImport.createDraft.useMutation({
    onSuccess: (created, variables) => {
      setResult((current) => current
        ? {
            ...current,
            tours: current.tours.map((tour) => tour.id === variables.importTourId
              ? { ...tour, status: "DRAFT_CREATED", createdTourId: created.id }
              : tour),
          }
        : current);
      toast({ title: "Borrador creado", description: "El tour fue creado como DRAFT y no se publicó." });
    },
    onError: (error) => {
      toast({
        title: "No se pudo crear el borrador",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const updateCandidate = trpc.catalogImport.updateCandidate.useMutation({
    onSuccess: (updated, variables) => {
      setResult((current) => current
        ? {
            ...current,
            tours: current.tours.map((tour) => tour.id === variables.importTourId
              ? {
                  ...tour,
                  status: updated.status,
                  issues: updated.issues,
                  tourDataJson: variables.candidate as CandidateData,
                }
              : tour),
          }
        : current);
      setEditingId(null);
      toast({
        title: updated.status === "READY" ? "Candidato listo" : "Candidato actualizado",
        description: updated.status === "READY"
          ? "Ya puedes crear el borrador."
          : "Aún requiere revisión.",
      });
    },
    onError: (error) => toast({ title: "No se pudo revalidar", description: error.message, variant: "destructive" }),
  });
  const history = trpc.catalogImport.history.useQuery(
    { secret: authorizedSecret, limit: 10 },
    { enabled: authorized && !!authorizedSecret },
  );
  const access = trpc.catalogImport.access.useMutation({
    onSuccess: () => {
      setAuthorizedSecret(secret);
      setSecret("");
      setAuthorized(true);
    },
    onError: (error) => {
      setSecret("");
      toast({
        title: "Acceso denegado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (authorized) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Analizar catálogo PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!file && !uploadedPdf) return;
              setUploading(true);
              setResult(null);
              try {
                const response = await fetch("/api/admin/catalog-import/upload", {
                  method: "POST",
                  headers: {
                    "x-catalog-import-secret": authorizedSecret,
                    ...(uploadedPdf ? { "Content-Type": "application/json" } : {}),
                  },
                  body: uploadedPdf
                    ? JSON.stringify({ fileUrl: uploadedPdf.url, filename: uploadedPdf.filename })
                    : (() => {
                        const body = new FormData();
                        body.append("file", file!);
                        return body;
                      })(),
                });
                const responseText = await response.text();
                let payload: { import?: NonNullable<typeof result>; error?: string } = {};
                try {
                  payload = JSON.parse(responseText) as typeof payload;
                } catch {
                  throw new Error(
                    response.status === 413
                      ? "El servidor rechazó el tamaño de la solicitud. Usa la carga directa del PDF."
                      : `El servidor respondió con un error (${response.status}).`,
                  );
                }


                if (!response.ok || !payload.import) {
                  throw new Error(payload.error ?? "No se pudo procesar el catálogo.");
                }
                setResult(payload.import);
              } catch (error) {
                toast({
                  title: "Error al analizar",
                  description: error instanceof Error ? error.message : "Error desconocido.",
                  variant: "destructive",
                });
              } finally {
                setUploading(false);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="catalog-pdf">Catálogo PDF (máximo 20 MB)</Label>
              <Input
                id="catalog-pdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                disabled={uploading}
              />
              <CldUploadWidget
                onSuccess={(uploadResult) => {
                  const info = uploadResult.info as { secure_url?: string; original_filename?: string };
                  if (info.secure_url) {
                    setUploadedPdf({
                      url: info.secure_url,
                      filename: `${info.original_filename ?? "catalogo"}.pdf`,
                    });
                    setFile(null);
                  }
                }}
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "agencia_tours_dev"}
                options={{
                  maxFiles: 1,
                  sources: ["local"],
                  clientAllowedFormats: ["pdf"],
                  maxFileSize: 20_000_000,
                  resourceType: "raw",
                  folder: "likesinhouse/catalog-imports",
                }}
              >
                {({ open }) => (
                  <Button type="button" variant="outline" onClick={() => open()} disabled={uploading}>
                    {uploadedPdf ? `PDF cargado: ${uploadedPdf.filename}` : "Cargar PDF grande"}
                  </Button>
                )}
              </CldUploadWidget>
            </div>
            <Button type="submit" disabled={(!file && !uploadedPdf) || uploading}>
              {uploading ? "Analizando catálogo..." : "Analizar catálogo"}
            </Button>
          </form>
          {result && (
            <>
              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-4">
                <div><strong>{result.totalTours}</strong><span className="block text-muted-foreground">Detectados</span></div>
                <div><strong>{result.readyCount}</strong><span className="block text-muted-foreground">Listos</span></div>
                <div><strong>{result.reviewCount}</strong><span className="block text-muted-foreground">En revisión</span></div>
                <div><strong>{result.duplicateCount}</strong><span className="block text-muted-foreground">Duplicados</span></div>
              </div>
              <div className="divide-y rounded-lg border">
                {result.tours.map((tour) => (
                  <div key={tour.id} className="space-y-3 p-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{tour.tourDataJson.nameEs ?? "Tour sin nombre"}</p>
                      <p className="text-xs text-muted-foreground">
                        {tour.tourDataJson.destination ?? "Destino no indicado"} · páginas {tour.sourcePages.join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-muted px-2 py-1 text-xs">{tour.status}</span>
                      {tour.status === "READY" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={createDraft.isPending}
                          onClick={() => createDraft.mutate({
                            secret: authorizedSecret,
                            importTourId: tour.id,
                          })}
                        >
                          Crear borrador
                        </Button>
                      )}
                      {tour.status === "NEEDS_REVIEW" && (
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(editingId === tour.id ? null : tour.id)}>
                          {editingId === tour.id ? "Cerrar" : "Revisar"}
                        </Button>
                      )}
                    </div>
                  </div>
                    {tour.issues.length > 0 && (
                      <div className="rounded-md bg-amber-50 p-2 text-xs text-amber-900">
                        {tour.issues.map((issue, index) => (
                          <p key={`${issue.field}-${index}`}>• {issue.field ?? "dato"}: {issue.reason}</p>
                        ))}
                      </div>
                    )}
                    {editingId === tour.id && (
                      <CandidateEditor
                        candidate={tour.tourDataJson}
                        disabled={updateCandidate.isPending}
                        onSave={(candidate) => updateCandidate.mutate({
                          secret: authorizedSecret,
                          importTourId: tour.id,
                          candidate,
                        })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          {history.data && history.data.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Importaciones anteriores</h3>
              <div className="divide-y rounded-lg border text-sm">
                {history.data.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 p-3">
                    <div>
                      <p className="font-medium">{item.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.totalTours} detectados · {item.createdCount} borradores creados
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            El PDF es la única fuente de verdad. Los tours nunca se publican automáticamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Verificación adicional</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            access.mutate({ secret });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="catalog-import-secret">Código privado</Label>
            <Input
              id="catalog-import-secret"
              type="password"
              autoComplete="off"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              disabled={access.isPending}
              required
            />
          </div>
          <Button type="submit" disabled={access.isPending || !secret}>
            {access.isPending ? "Verificando..." : "Ingresar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CandidateEditor({
  candidate,
  disabled,
  onSave,
}: {
  candidate: CandidateData;
  disabled: boolean;
  onSave: (candidate: CandidateData) => void;
}) {
  const [draft, setDraft] = useState<CandidateData>(candidate);
  const setValue = (field: string, value: string | number | null) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };
  const textField = (field: keyof CandidateData, label: string) => (
    <div className="space-y-1">
      <Label htmlFor={`candidate-${String(field)}`}>{label}</Label>
      <Input
        id={`candidate-${String(field)}`}
        value={typeof draft[field] === "string" ? draft[field] as string : ""}
        onChange={(event) => setValue(String(field), event.target.value || null)}
        disabled={disabled}
      />
    </div>
  );

  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-3">
      <p className="font-medium">Revisión manual</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {textField("nameEs", "Nombre en español")}
        {textField("nameEn", "Nombre en inglés")}
        {textField("category", "Categoría")}
        {textField("destination", "Destino")}
        {textField("shortDescEs", "Descripción corta (ES)")}
        {textField("shortDescEn", "Descripción corta (EN)")}
        {textField("longDescEs", "Descripción larga (ES)")}
        {textField("longDescEn", "Descripción larga (EN)")}
        <div className="space-y-1">
          <Label htmlFor="candidate-durationDays">Días</Label>
          <Input
            id="candidate-durationDays"
            type="number"
            min="1"
            value={draft.durationDays ?? ""}
            onChange={(event) => setValue("durationDays", event.target.value ? Number(event.target.value) : null)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="candidate-durationNights">Noches</Label>
          <Input
            id="candidate-durationNights"
            type="number"
            min="0"
            value={draft.durationNights ?? ""}
            onChange={(event) => setValue("durationNights", event.target.value ? Number(event.target.value) : null)}
            disabled={disabled}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Corrige solo con información confirmada en el PDF. Los precios, itinerario y condiciones se mantienen tal como fueron extraídos.
      </p>
      <Button type="button" size="sm" disabled={disabled} onClick={() => onSave(draft)}>
        {disabled ? "Revalidando..." : "Guardar y revalidar"}
      </Button>
    </div>
  );
}
