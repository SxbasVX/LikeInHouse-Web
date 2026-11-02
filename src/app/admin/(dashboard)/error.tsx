"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="font-heading text-2xl font-bold tracking-tight text-brand-darkRed">
        No se pudo cargar esta sección
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Ocurrió un error inesperado. Intenta de nuevo; si el problema continúa, recarga la página.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">Código: {error.digest}</p>
      )}
      <Button onClick={reset} className="mt-6">
        <RotateCw className="mr-2 h-4 w-4" />
        Reintentar
      </Button>
    </div>
  );
}
