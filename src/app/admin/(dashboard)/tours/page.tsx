"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { ToursTable } from "@/components/admin/tours-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { ErrorState, TableSkeleton } from "@/components/admin/list-states";
import { Plus, Search, X } from "lucide-react";
import { TourDestinationsPanel } from "@/components/admin/tour-destinations-panel";

export default function ToursPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [destination, setDestination] = useState<string | undefined>(undefined);
  const utils = trpc.useUtils();

  const { data, isLoading, error, refetch, isRefetching } = trpc.tour.list.useQuery({
    page,
    limit: 10,
    search: search || undefined,
    status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined,
    destination,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Tours"
        subtitle="Gestiona los tours de LikeInHouse"
        actions={
          <Button asChild>
            <Link href="/admin/tours/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tour
            </Link>
          </Button>
        }
      />

      <TourDestinationsPanel
        selected={destination}
        onSelect={(d) => {
          setDestination(d);
          setPage(1);
        }}
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tours..."
            aria-label="Buscar tours"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={status || "all"}
          onValueChange={(v) => {
            setStatus(v === "all" ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="DRAFT">Borrador</SelectItem>
            <SelectItem value="PUBLISHED">Publicado</SelectItem>
            <SelectItem value="ARCHIVED">Archivado</SelectItem>
          </SelectContent>
        </Select>
        {destination && (
          <Button
            variant="secondary"
            onClick={() => { setDestination(undefined); setPage(1); }}
            aria-label={`Quitar filtro de destino ${destination}`}
          >
            {destination}
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={3} className="p-6" />
          ) : error ? (
            <ErrorState title="No se pudieron cargar los tours" error={error} onRetry={() => refetch()} isRetrying={isRefetching} />
          ) : (
            <ToursTable
              tours={data?.tours || []}
              onRefresh={() => {
                refetch();
                utils.tour.destinationSummary.invalidate();
              }}
            />
          )}
        </CardContent>
      </Card>

      {data && (
        <Pagination page={page} pages={data.pages} total={data.total} itemLabel="tours" onPageChange={setPage} />
      )}
    </div>
  );
}
