"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BookOpen, Eye } from "lucide-react";
import {
  complaintStatusIcons,
  complaintTypeLabels,
  type ComplaintStatus as Status,
} from "@/components/admin/complaint-labels";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/admin/list-states";
import { formatTimestampDate } from "@/lib/format";

const PAGE_SIZE = 20;

export default function ReclamacionesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
  const [page, setPage] = useState(1);

  // Debounce de la búsqueda (300 ms) y volver a la primera página al cambiar filtros.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: stats } = trpc.complaint.stats.useQuery(undefined, {
    staleTime: 30_000,
  });

  const { data, isLoading, error, refetch, isRefetching } = trpc.complaint.list.useQuery(
    {
      search: debouncedSearch || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      pageSize: PAGE_SIZE,
    },
    { staleTime: 15_000 }
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Libro de Reclamaciones"
        subtitle="Reclamos y quejas registrados por consumidores (INDECOPI)"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold mt-1">{stats?.total ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-rose-600 uppercase tracking-wide font-medium">Pendientes</p>
            <p className="text-2xl font-bold mt-1 text-rose-600">{stats?.pendiente ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">En Proceso</p>
            <p className="text-2xl font-bold mt-1 text-blue-600">{stats?.enProceso ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium">Resueltos</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{stats?.resuelto ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Rechazados</p>
            <p className="text-2xl font-bold mt-1 text-muted-foreground">{stats?.rechazado ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, nombre, email o DNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v: any) => {
            setStatusFilter(v);
            setPage(1);
          }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="PENDIENTE">Pendientes</SelectItem>
            <SelectItem value="EN_PROCESO">En proceso</SelectItem>
            <SelectItem value="RESUELTO">Resueltos</SelectItem>
            <SelectItem value="RECHAZADO">Rechazados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {data ? `${data.total} registro${data.total !== 1 ? "s" : ""}` : "Registros"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton className="p-4" />
          ) : error ? (
            <ErrorState title="No se pudieron cargar los registros" error={error} onRetry={() => refetch()} isRetrying={isRefetching} />
          ) : !data?.items.length ? (
            <EmptyState
              icon={BookOpen}
              title="No hay registros"
              description={debouncedSearch || statusFilter !== "ALL" ? "Prueba con otros filtros de búsqueda." : undefined}
            />
          ) : (
            <div className="divide-y">
              {data.items.map((c) => {
                const Icon = complaintStatusIcons[c.status as Status] ?? BookOpen;
                const daysAgo = Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                const overdue = c.status === "PENDIENTE" && daysAgo > 20;
                return (
                  <Link
                    key={c.id}
                    href={`/admin/reclamaciones/${c.id}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm font-medium">{c.code}</p>
                          <Badge variant="outline" className="text-xs">
                            {complaintTypeLabels[c.type] ?? c.type}
                          </Badge>
                          {overdue && (
                            <Badge variant="destructive" className="text-xs">
                              {daysAgo}d sin respuesta
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 truncate mt-1">{c.consumerName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.consumerEmail} · {formatTimestampDate(c.createdAt, { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <StatusBadge domain="complaint" status={c.status} />
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          {data && (
            <Pagination
              page={page}
              pages={totalPages}
              total={data.total}
              itemLabel="registros"
              onPageChange={setPage}
              className="border-t p-4"
            />
          )}
        </CardContent>
      </Card>

      {/* Info legal */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium mb-1">Plazo legal de respuesta</p>
        <p className="text-amber-800">
          Según el D.S. 011-2011-PCM, el proveedor debe responder al consumidor en un plazo no mayor a <strong>30 días calendario</strong>. Los registros con más de 20 días sin respuesta se marcan como urgentes.
        </p>
      </div>
    </div>
  );
}
