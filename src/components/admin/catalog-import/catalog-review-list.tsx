"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight, Loader2, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState, ErrorState } from "@/components/admin/list-states";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { GROUP_LABELS, type ReviewGroup } from "@/server/catalog-review/content";
import { ClaudeStatusChip, CatalogLogoutButton, type CatalogAccessStatus } from "./catalog-access-gate";

const BUCKETS = [
  { value: "PROPOSED", label: "Por revisar" },
  { value: "APPLIED", label: "Aplicados" },
  { value: "NO_CHANGES", label: "Ya cumplen" },
  { value: "DISMISSED", label: "Descartados" },
  { value: "FAILED", label: "Con error" },
  { value: "PENDING", label: "Claude trabajando" },
] as const;
type Bucket = (typeof BUCKETS)[number]["value"];
// Opus 5.5 in a batch, per tour: rewriting the whole text (~10k tokens in, ~6k out). A rough guide for the confirmation dialog.
const COST_PER_TOUR_USD = 0.08;
const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function CatalogReviewList({ status }: { status: CatalogAccessStatus }) {
  const { toast } = useToast();
  const overview = trpc.catalogReview.overview.useQuery(undefined, {
    retry: false, refetchInterval: (query) => (query.state.data?.run?.status === "PROCESSING" ? 15_000 : false),
  });
  const start = trpc.catalogReview.start.useMutation({
    onSuccess: async ({ tours }) => { setConfirm(false); await overview.refetch(); toast({ title: `Claude está revisando ${tours} tours`, description: "Suele tardar entre 15 minutos y 1 hora. Puedes cerrar esta página." }); },
    onError: (error) => toast({ title: "No se pudo iniciar", description: error.message, variant: "destructive" }),
  });
  const [confirm, setConfirm] = useState(false);
  const [bucket, setBucket] = useState<Bucket | null>(null);
  const [query, setQuery] = useState("");

  if (overview.isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (overview.error || !overview.data) return <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />;
  const { run, activeTours, claudeReady } = overview.data;
  const counts = Object.fromEntries(BUCKETS.map((b) => [b.value, run?.revisions.filter((r) => r.status === b.value).length ?? 0])) as Record<Bucket, number>;
  const shown = bucket ?? BUCKETS.find((b) => counts[b.value] > 0)?.value ?? "PROPOSED";
  const rows = (run?.revisions ?? []).filter((r) => r.status === shown && normalize(`${r.tour.nameEs} ${r.tour.destination}`).includes(normalize(query)));
  const processing = run?.status === "PROCESSING";
  const cost = (run?.revisions ?? []).reduce((sum, r) => sum + (r.estimatedCost ?? 0), 0);

  return <div className="space-y-6">
    <PageHeader title="Revisión del catálogo" subtitle="Claude deja todos los tours con el mismo nivel de venta, texto y presentación; tú apruebas cada cambio."
      actions={<><ClaudeStatusChip status={status} /><CatalogLogoutButton /></>} />

    <section className="flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1 text-sm">
        <p className="font-medium">Estándar: «Tour Uros, Amantaní y Taquile 2D/1N»</p>
        <p className="text-muted-foreground">Revisa nombre, descripciones, SEO, itinerario, incluye y condiciones. Nunca cambia precios, duración, destino, fechas ni imágenes.</p>
        {run && <p className="text-xs text-muted-foreground">Última revisión: {formatDateTime(run.createdAt)} · {run.revisions.length} tours{cost > 0 && ` · US$ ${cost.toFixed(2)} estimado`}</p>}
      </div>
      <Button disabled={processing || !claudeReady || start.isPending} onClick={() => setConfirm(true)} className="shrink-0">
        {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Claude está revisando…</> : <><Sparkles className="mr-2 h-4 w-4" />{run ? "Revisar de nuevo" : "Revisar todo el catálogo"}</>}
      </Button>
    </section>

    {processing && <p role="status" className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">Claude está revisando {run!.revisions.length} tours en segundo plano (normalmente de 15 minutos a 1 hora). Las propuestas aparecen aquí cuando terminan; puedes cerrar la página.</p>}
    {run?.lastError && !processing && <p role="alert" className="flex gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{run.lastError}</p>}

    {run ? <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{BUCKETS.map((b) => <button key={b.value} type="button" onClick={() => setBucket(b.value)}
        className={cn("rounded-xl border bg-white p-3 text-left transition hover:border-brand-teal/50", shown === b.value && "border-brand-teal bg-brand-teal/5")}>
        <span className="block font-heading text-2xl font-bold text-brand-darkRed">{counts[b.value]}</span><span className="text-xs text-muted-foreground">{b.label}</span>
      </button>)}</div>
      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-medium">{BUCKETS.find((b) => b.value === shown)!.label} <span className="text-muted-foreground">({counts[shown]})</span></h2>
          <div className="relative sm:w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar tour o destino" className="pl-8" aria-label="Buscar tour" /></div>
        </div>
        {rows.length ? <ul className="divide-y">{rows.map((r) => <li key={r.id}><Link href={`/admin/dev/catalog-import/revision/${r.id}`} className="flex items-center gap-4 px-4 py-3 transition hover:bg-muted/40">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{r.tour.nameEs}</p>
            <p className="truncate text-xs text-muted-foreground">{r.tour.destination} · {r.tour.status === "PUBLISHED" ? "Publicado" : r.tour.status === "DRAFT" ? "Borrador" : "Archivado"}{r.error && ` · ${r.error}`}</p>
          </div>
          <div className="hidden flex-wrap justify-end gap-1.5 sm:flex">{(r.status === "APPLIED" ? r.appliedFields as ReviewGroup[] : r.groups).map((g) =>
            <span key={g} className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", r.status === "APPLIED" ? "bg-brand-teal/15 text-brand-darkTeal" : "bg-muted text-foreground/70")}>{GROUP_LABELS[g]}</span>)}</div>
          {r.status === "APPLIED" && <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-teal" />}
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link></li>)}</ul> : <EmptyState title={query ? "Ningún tour coincide" : "No hay tours en esta sección"} />}
      </div>
    </> : <div className="rounded-2xl border bg-white"><EmptyState icon={Sparkles} title="Todavía no hay revisiones" description={`Claude revisará los ${activeTours} tours activos y te propondrá mejoras para aprobar una por una.`} /></div>}

    <Dialog open={confirm} onOpenChange={(open) => !start.isPending && setConfirm(open)}>
      <DialogContent><DialogHeader><DialogTitle>¿Revisar los {activeTours} tours activos?</DialogTitle>
        <DialogDescription>Claude propondrá mejoras de texto y presentación para cada tour. Nada cambia en la web hasta que lo apruebes.</DialogDescription></DialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Costo estimado: <strong>~US$ {(activeTours * COST_PER_TOUR_USD).toFixed(2)}</strong> (lote a mitad de precio).</li>
          <li>Tiempo habitual: 15 minutos a 1 hora.</li>
          {run && <li>Las propuestas pendientes de la revisión anterior se descartan.</li>}
        </ul>
        <DialogFooter><Button variant="ghost" onClick={() => setConfirm(false)} disabled={start.isPending}>Cancelar</Button>
          <Button onClick={() => start.mutate()} disabled={start.isPending}>{start.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Empezar revisión</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
