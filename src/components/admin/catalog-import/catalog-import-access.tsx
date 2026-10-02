"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";

export function CatalogImportAccess() {
  const { toast } = useToast();
  const [secret, setSecret] = useState("");
  const [authorizedSecret, setAuthorizedSecret] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [file, setFile] = useState<File | null>(null);
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
      tourDataJson: { nameEs?: string | null; destination?: string | null };
    }>;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
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
              if (!file) return;
              setUploading(true);
              setResult(null);
              const body = new FormData();
              body.append("file", file);
              try {
                const response = await fetch("/api/admin/catalog-import/upload", {
                  method: "POST",
                  headers: { "x-catalog-import-secret": authorizedSecret },
                  body,
                });
                const payload = await response.json() as { import?: NonNullable<typeof result>; error?: string };
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
            </div>
            <Button type="submit" disabled={!file || uploading}>
              {uploading ? "Analizando con Gemini..." : "Analizar catálogo"}
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
                  <div key={tour.id} className="flex items-center justify-between gap-4 p-3 text-sm">
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
                    </div>
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
