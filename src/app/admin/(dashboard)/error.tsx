"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-2xl font-bold">Error en el Panel</h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        {error.message || "Ocurrió un error inesperado. Por favor intenta de nuevo."}
      </p>
      <Button onClick={reset} className="mt-6">
        Reintentar
      </Button>
    </div>
  );
}
