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
  const [result, setResult] = useState<{ totalTours: number; readyCount: number; reviewCount: number; duplicateCount: number } | null>(null);
  const [uploading, setUploading] = useState(false);
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
                const payload = await response.json() as { import?: typeof result; error?: string };
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
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-4">
              <div><strong>{result.totalTours}</strong><span className="block text-muted-foreground">Detectados</span></div>
              <div><strong>{result.readyCount}</strong><span className="block text-muted-foreground">Listos</span></div>
              <div><strong>{result.reviewCount}</strong><span className="block text-muted-foreground">En revisión</span></div>
              <div><strong>{result.duplicateCount}</strong><span className="block text-muted-foreground">Duplicados</span></div>
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
