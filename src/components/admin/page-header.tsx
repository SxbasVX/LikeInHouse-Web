import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Único <h1> de la página. */
  title: ReactNode;
  subtitle?: ReactNode;
  /** Botones/acciones: debajo del título en mobile, a la derecha desde `sm`. */
  actions?: ReactNode;
  /** Contenido antes del título (p. ej. botón "volver"). */
  leading?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, leading, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold leading-tight tracking-tight text-brand-darkRed sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 font-serif italic leading-snug text-brand-teal">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
