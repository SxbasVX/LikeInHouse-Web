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
  const [authorized, setAuthorized] = useState(false);
  const access = trpc.catalogImport.access.useMutation({
    onSuccess: () => {
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
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        La ruta privada está habilitada, pero el procesamiento de PDFs todavía no
        está disponible. La carga y extracción se implementarán en la siguiente fase.
      </div>
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
