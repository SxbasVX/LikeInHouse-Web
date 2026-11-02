"use client";

import { useEffect, useState } from "react";
import { Calendar, Loader2, Mail, MapPin, MessageCircle, Plug, RotateCw, Search, UserCheck, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/admin/status-badge";
import { Pagination } from "@/components/admin/pagination";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/admin/list-states";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatDateTime } from "@/lib/format";
import { statusOptions } from "@/lib/status";
import { formatTrpcError } from "@/lib/trpc-error";

const TRAVEL_WINDOW_LABELS: Record<string, string> = {
  this_month: "Este mes",
  "1_3_months": "En 1 a 3 meses",
  "3_6_months": "En 3 a 6 meses",
  undecided: "Aún no lo sabe",
};

type QuoteRequestStatus = "NEW" | "CONTACTED" | "QUOTED" | "CLOSED";

/** Aviso de integración con hubdeviajes.com, visible en la página de cotizaciones. */
export function CrmIntegrationBanner() {
  const { data } = trpc.quoteRequest.integrationStatus.useQuery();
  if (!data) return null;
  return data.configured ? (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-brand-teal/30 bg-brand-teal/10 px-4 py-3 text-sm">
      <span className="flex items-center gap-2 font-semibold text-brand-darkTeal">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-teal opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-teal" />
        </span>
        Conectado a {data.provider}
      </span>
      <span className="text-brand-darkTeal/80">
        Cada solicitud web se guarda aquí y se envía como Lead (etiqueta Web) a tu CRM.
        {data.lastSentAt && ` Último envío: ${formatDateTime(data.lastSentAt)}.`}
      </span>
      {data.failed > 0 && (
        <span className="font-medium text-red-700">{data.failed} pendiente(s) de enviar: usa «Reenviar».</span>
      )}
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <Plug className="h-4 w-4" />
      <span className="font-semibold">Integración con {data.provider} sin configurar.</span>
      <span>Las solicitudes se guardan aquí igual; configura CRM_LEADS_URL y CRM_API_KEY en Vercel para enviarlas al CRM.</span>
    </div>
  );
}

export function QuoteRequestsPanel() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<QuoteRequestStatus | undefined>(undefined);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, error, refetch, isRefetching } = trpc.quoteRequest.list.useQuery({
    page,
    limit: 10,
    status,
    search: search || undefined,
  });

  const refresh = () => Promise.all([utils.quoteRequest.list.invalidate(), utils.quoteRequest.integrationStatus.invalidate()]);

  const updateStatus = trpc.quoteRequest.updateStatus.useMutation({
    onSuccess: () => refresh(),
    onError: (e) => toast({ title: "No se pudo actualizar", description: formatTrpcError(e), variant: "destructive" }),
  });
  const resend = trpc.quoteRequest.resendToCrm.useMutation({
    onSuccess: () => {
      toast({ title: "Enviada a hubdeviajes.com" });
      refresh();
    },
    onError: (e) => {
      toast({ title: "No se pudo reenviar", description: formatTrpcError(e), variant: "destructive" });
      refresh();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitudes web</CardTitle>
        <CardDescription>
          {data ? `${data.total} solicitudes · ${data.newCount} nuevas sin atender` : error ? "—" : "Cargando..."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative min-w-0 flex-1 sm:min-w-[240px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, contacto, destino o tour..."
              aria-label="Buscar solicitudes"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={status ?? "all"}
            onValueChange={(v) => {
              setStatus(v === "all" ? undefined : (v as QuoteRequestStatus));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {statusOptions("quoteRequest").map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <TableSkeleton rows={3} rowClassName="h-32" />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} isRetrying={isRefetching} />
        ) : !data || data.requests.length === 0 ? (
          <EmptyState
            title={search || status ? "No hay solicitudes con esos filtros" : "Aún no hay solicitudes"}
            description="Aparecen aquí cuando alguien usa «Solicitar cotización» en la web."
          />
        ) : (
          <div className="space-y-3">
            {data.requests.map((r) => {
              const phoneDigits = r.phone?.replace(/[^\d]/g, "");
              const when = r.departureDate
                ? `${formatDate(r.departureDate)}${r.returnDate ? ` → ${formatDate(r.returnDate)}` : ""}`
                : r.travelWindow
                  ? TRAVEL_WINDOW_LABELS[r.travelWindow] ?? r.travelWindow
                  : "No indicó";
              return (
                <div key={r.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{r.name}</p>
                        <StatusBadge domain="quoteRequest" status={r.status} />
                        {r.client && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Guardado en Clientes">
                            <UserCheck className="h-3.5 w-3.5" /> Cliente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Recibida {formatDateTime(r.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {phoneDigits && (
                        <Button asChild size="sm" variant="outline">
                          <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="mr-1.5 h-4 w-4" /> {r.phone}
                          </a>
                        </Button>
                      )}
                      {r.email && (
                        <Button asChild size="sm" variant="outline">
                          <a href={`mailto:${r.email}`}>
                            <Mail className="mr-1.5 h-4 w-4" /> {r.email}
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>
                        {r.tourName ? <><span className="font-medium">{r.tourName}</span> · {r.destination}</> : r.destination ?? "Destino por definir"}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" /> {when}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {r.adults} adulto{r.adults === 1 ? "" : "s"}
                      {r.children > 0 && ` · ${r.children} niño${r.children === 1 ? "" : "s"}`}
                      {r.infants > 0 && ` · ${r.infants} infante${r.infants === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  {r.message && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm">{r.message}</p>}

                  <div className="mt-3 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-muted-foreground">hubdeviajes.com:</span>
                      <StatusBadge domain="crm" status={r.crmStatus} />
                      {r.crmStatus === "SENT" && r.crmSyncedAt && <span className="text-muted-foreground">{formatDateTime(r.crmSyncedAt)}</span>}
                      {r.crmStatus !== "SENT" && r.crmError && <span className="text-red-700">{r.crmError}</span>}
                      {(r.crmStatus === "FAILED" || r.crmStatus === "DISABLED") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          disabled={resend.isPending}
                          onClick={() => resend.mutate({ id: r.id })}
                        >
                          {resend.isPending && resend.variables?.id === r.id ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCw className="mr-1 h-3.5 w-3.5" />
                          )}
                          Reenviar
                        </Button>
                      )}
                    </div>
                    <Select
                      value={r.status}
                      onValueChange={(v) => updateStatus.mutate({ id: r.id, status: v as QuoteRequestStatus })}
                    >
                      <SelectTrigger className="h-8 w-full sm:w-40" aria-label={`Estado de la solicitud de ${r.name}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions("quoteRequest").map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {data && <Pagination page={data.page} pages={data.pages} total={data.total} itemLabel="solicitudes" onPageChange={setPage} className="mt-6" />}
      </CardContent>
    </Card>
  );
}
