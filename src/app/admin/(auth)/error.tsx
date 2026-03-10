"use client";

import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold">Error de autenticación</h2>
        <p className="mt-2 text-muted-foreground">
          {error.message || "Ocurrió un error inesperado. Por favor, intenta de nuevo."}
        </p>
        <Button onClick={reset} className="mt-6">
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
}
