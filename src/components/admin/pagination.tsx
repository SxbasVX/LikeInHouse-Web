import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  /** Total de elementos; si se pasa, se muestra junto a la página. */
  total?: number;
  /** Sustantivo en plural para el total, p. ej. "reservas". */
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  page,
  pages,
  onPageChange,
  total,
  itemLabel,
  className,
}: PaginationProps) {
  if (pages <= 1) return null;

  return (
    <nav
      aria-label="Paginación"
      className={cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", className)}
    >
      <p className="text-sm font-serif italic text-brand-teal">
        Mostrando página {page} de {pages}
        {total !== undefined && ` (${total}${itemLabel ? ` ${itemLabel}` : ""})`}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(pages, page + 1))}
          disabled={page >= pages}
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
