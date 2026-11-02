import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RotateCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatTrpcError } from "@/lib/trpc-error";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-4 py-12 text-center", className)}>
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <div>
        <p className="text-base font-medium text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  /** Error de la consulta; su mensaje se muestra legible (Zod/tRPC). */
  error?: unknown;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function ErrorState({
  title = "No se pudo cargar la información",
  error,
  onRetry,
  isRetrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center gap-3 px-4 py-12 text-center", className)}
    >
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div>
        <p className="text-base font-medium text-foreground">{title}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {error ? formatTrpcError(error) : "Revisa tu conexión e intenta de nuevo."}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
          <RotateCw className={cn("mr-2 h-4 w-4", isRetrying && "animate-spin")} />
          Reintentar
        </Button>
      )}
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  rowClassName?: string;
  className?: string;
}

export function TableSkeleton({ rows = 5, rowClassName, className }: TableSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-label="Cargando">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn("h-16 w-full", rowClassName)} />
      ))}
    </div>
  );
}
