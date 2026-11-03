"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Check, ChevronRight, FileText, Loader2, RotateCw, Search, Sparkles, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState, ErrorState } from "@/components/admin/list-states";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { RouterOutput } from "@/types";
import { ClaudeStatusChip, CatalogLogoutButton, type CatalogAccessStatus } from "./catalog-access-gate";
import { bucketOf, candidateSummary, isClaudeSuggestion, TOUR_BUCKETS, type TourBucket } from "./catalog-fields";

type Job = RouterOutput["catalogImport"]["history"][number];
type JobTour = Job["tours"][number];

const MAX_FILES = 5, MAX_BYTES = 5 * 1024 * 1024;
const OPERATION_LABELS: Record<string, string> = { catalog_extraction: "Lectura del PDF", candidate_enrichment: "Mejora con Claude", candidate_question: "Pregunta a Claude" };
const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// PARTIAL also covers documents whose only "blocked" tours are ones the reviewer skipped: that is a finished document.
function jobState(job: Job) {
  const incomplete = job.status === "FAILED" || (job.status === "PARTIAL" && (!job.totalTours || job.tours.length < job.totalTours || Boolean(job.lastError)));
  return { incomplete, shownStatus: job.status === "PARTIAL" && !incomplete ? "COMPLETED" : job.status, canResume: (job.status === "UPLOADED" || incomplete) && job.attempts < 3 };
}

function bucketCounts(job: Job) {
  const counts: Record<TourBucket, number> = { review: 0, ready: 0, created: 0, skipped: 0 };
  for (const tour of job.tours) counts[bucketOf(tour.status)]++;
  return counts;
}

export function CatalogInbox({ status }: { status: CatalogAccessStatus }) {
  const router = useRouter();
  const params = useSearchParams();
  const utils = trpc.useUtils();
  const history = trpc.catalogImport.history.useQuery({ limit: 30 }, {
    retry: false,
    // Each refresh also lets the server collect finished Claude batches, which it checks every 30 s.
    refetchInterval: (query) => query.state.data?.some((job) => job.status === "UPLOADED" || (job.status === "PROCESSING" && !job.batchStage)) ? 3000
      : query.state.data?.some((job) => job.status === "PROCESSING") ? 15_000 : false,
  });
  useEffect(() => { if (history.error?.data?.code === "UNAUTHORIZED") void utils.catalogImport.status.reset(); }, [history.error, utils]);
  const jobs = useMemo(() => history.data ?? [], [history.data]);
  const selected = jobs.find((job) => job.id === params.get("doc")) ?? jobs[0];
  const navigate = (doc: string, tab?: string) => router.replace(`?doc=${doc}${tab ? `&tab=${tab}` : ""}`, { scroll: false });
  const uploader = useUploader(jobs, status.userId, async (importId) => { await history.refetch(); if (importId) navigate(importId); });

  return <div className="space-y-6">
    <PageHeader title="Importador de catálogos" subtitle="Claude lee tus PDFs y prepara los tours; tú revisas y apruebas."
      actions={<><ClaudeStatusChip status={status} /><CatalogLogoutButton /></>} />
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <UploadCard uploader={uploader} />
        <DocumentList jobs={jobs} loading={history.isLoading} selectedId={selected?.id} onSelect={(id) => navigate(id)} />
      </aside>
      <section className="min-w-0">
        {history.isLoading ? <Skeleton className="h-96 w-full rounded-2xl" />
          : history.error ? <ErrorState error={history.error} onRetry={() => void history.refetch()} isRetrying={history.isFetching} />
          : selected ? <DocumentDetail key={selected.id} job={selected} tab={params.get("tab")} onTab={(tab) => navigate(selected.id, tab)}
              onResume={() => void uploader.resume(selected.id)} busy={uploader.busy} />
          : <div className="rounded-2xl border bg-white"><EmptyState icon={UploadCloud} title="Sube tu primer catálogo" description="Claude extraerá cada tour, mejorará los textos y te los dejará listos para revisar." /></div>}
      </section>
    </div>
  </div>;
}

function useUploader(jobs: Job[], userId: string, onStarted: (importId?: string) => Promise<void>) {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  async function send(body: FormData | object): Promise<{ importId: string }> {
    const response = await fetch("/api/admin/catalog-import/upload", {
      method: "POST", ...(body instanceof FormData ? { body } : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
    const data = await response.json().catch(() => ({ error: "El servidor rechazó la carga. Usa la carga directa de PDFs." }));
    if (!response.ok) throw new Error(data.error ?? "No se pudo iniciar la importación.");
    return data;
  }
  async function start() {
    setBusy(true);
    const failed: File[] = [];
    let lastId: string | undefined;
    for (const file of files) {
      try { const form = new FormData(); form.append("file", file); lastId = (await send(form)).importId; }
      catch (error) { failed.push(file); toast({ title: file.name, description: error instanceof Error ? error.message : String(error), variant: "destructive" }); }
    }
    setFiles(failed); setBusy(false);
    await onStarted(lastId);
    if (!failed.length) toast({ title: "Catálogos enviados a Claude", description: "Puedes cerrar esta página: el trabajo sigue y se guarda cuando vuelvas." });
  }
  async function resume(importId: string) {
    setBusy(true);
    try { await send({ importId }); await onStarted(); }
    catch (error) { toast({ title: "No se pudo reanudar", description: error instanceof Error ? error.message : String(error), variant: "destructive" }); }
    finally { setBusy(false); }
  }
  function pick(incoming: File[]) {
    const valid = incoming.filter((file) => file.name.toLowerCase().endsWith(".pdf") && file.size <= MAX_BYTES);
    if (valid.length !== incoming.length) toast({ title: "Solo PDFs de hasta 5 MB", variant: "destructive" });
    setFiles((current) => [...current, ...valid].slice(0, MAX_FILES));
  }
  // Documents left in the queue (claim refused) start as soon as the history shows them.
  useEffect(() => {
    if (busy) return;
    const queued = jobs.find((j) => j.status === "UPLOADED" && j.createdById === userId && j.attempts < 3);
    if (queued) void resume(queued.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, userId]);
  return { files, setFiles, busy, start, resume, pick };
}

function UploadCard({ uploader }: { uploader: ReturnType<typeof useUploader> }) {
  const [over, setOver] = useState(false);
  const { files, setFiles, busy, start, pick } = uploader;
  return <div className="space-y-3 rounded-2xl border bg-white p-4">
    <label onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!busy) pick(Array.from(e.dataTransfer.files)); }}
      className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition",
        over ? "border-brand-teal bg-brand-teal/5" : "border-muted-foreground/20 hover:border-brand-teal/50 hover:bg-muted/30", busy && "pointer-events-none opacity-60")}>
      <UploadCloud className="h-8 w-8 text-brand-teal" />
      <span className="text-sm font-medium">Arrastra tus catálogos o haz clic</span>
      <span className="text-xs text-muted-foreground">Hasta {MAX_FILES} PDFs, máximo 5 MB cada uno</span>
      <input type="file" multiple accept="application/pdf,.pdf" className="sr-only" disabled={busy} onChange={(e) => { pick(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
    </label>
    {files.length > 0 && <ul className="space-y-1.5">{files.map((file, i) => <li key={`${file.name}-${i}`} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-sm">
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate">{file.name}</span>
      <button type="button" aria-label={`Quitar ${file.name}`} disabled={busy} onClick={() => setFiles(files.filter((_, index) => index !== i))} className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
    </li>)}</ul>}
    <Button className="w-full" disabled={busy || !files.length} onClick={() => void start()}>
      {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando…</> : <><Sparkles className="mr-2 h-4 w-4" />Analizar con Claude{files.length > 1 ? ` (${files.length})` : ""}</>}
    </Button>
  </div>;
}

function SegmentBar({ job, className }: { job: Job; className?: string }) {
  const counts = bucketCounts(job), total = job.tours.length;
  if (!total) return <div className={cn("h-1.5 rounded-full bg-muted", className)} />;
  const segments: Array<[number, string]> = [[counts.created, "bg-brand-teal"], [counts.ready, "bg-sky-400"], [counts.review, "bg-amber-400"], [counts.skipped, "bg-slate-300"]];
  return <div className={cn("flex h-1.5 overflow-hidden rounded-full bg-muted", className)}>
    {segments.map(([n, color], i) => n > 0 && <div key={i} className={color} style={{ width: `${(n / total) * 100}%` }} />)}
  </div>;
}

const stageText = (job: Job) => job.status === "PROCESSING"
  ? job.batchStage === "enrichment" ? "Claude mejora los textos" : job.batchStage === "extraction" ? "Claude lee el PDF" : "Enviando a Claude"
  : null;

function DocumentList({ jobs, loading, selectedId, onSelect }: { jobs: Job[]; loading: boolean; selectedId?: string; onSelect: (id: string) => void }) {
  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>;
  if (!jobs.length) return null;
  return <nav aria-label="Documentos" className="space-y-2">
    <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documentos ({jobs.length})</h2>
    {jobs.map((job) => {
      const counts = bucketCounts(job), stage = stageText(job), active = job.id === selectedId;
      return <button key={job.id} type="button" onClick={() => onSelect(job.id)} aria-current={active ? "true" : undefined}
        className={cn("w-full space-y-2 rounded-xl border bg-white p-3 text-left transition hover:border-brand-teal/50", active && "border-brand-teal ring-2 ring-brand-teal/15")}>
        <div className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand-darkTeal" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{job.filename}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(job.createdAt)} · {job.tours.length} tours</p></div></div>
        <SegmentBar job={job} />
        <div className="flex items-center justify-between gap-2 text-xs">
          {stage ? <span className="inline-flex items-center gap-1.5 text-sky-700"><Loader2 className="h-3.5 w-3.5 animate-spin" />{stage}</span> : <StatusBadge domain="catalogImport" status={jobState(job).shownStatus} />}
          {counts.review > 0 && <span className="font-medium text-amber-700">{counts.review} por revisar</span>}
        </div>
      </button>;
    })}
  </nav>;
}

function PipelineSteps({ job }: { job: Job }) {
  const counts = bucketCounts(job);
  const failed = job.status === "FAILED" && !job.tours.length;
  const current = job.status === "UPLOADED" || (job.status === "PROCESSING" && job.batchStage !== "enrichment") || failed ? 0
    : job.status === "PROCESSING" ? 1 : counts.review + counts.ready > 0 ? 2 : 4;
  const steps = ["Lectura del PDF", "Mejora con Claude", "Tu revisión", "Tours creados"];
  return <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">{steps.map((label, i) => {
    const done = i < current || current === 4, active = i === current, error = failed && i === 0;
    const working = active && job.status === "PROCESSING";
    return <li key={label} className="flex items-center gap-2.5">
      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
        error ? "border-red-300 bg-red-50 text-red-700" : done ? "border-brand-teal bg-brand-teal text-white" : active ? "border-brand-teal bg-brand-teal/10 text-brand-darkTeal" : "border-muted-foreground/20 text-muted-foreground")}>
        {error ? <AlertTriangle className="h-3.5 w-3.5" /> : done ? <Check className="h-3.5 w-3.5" /> : working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : i + 1}
      </span>
      <span className={cn("text-xs leading-tight", active || done ? "font-medium text-foreground" : "text-muted-foreground")}>{label}</span>
    </li>;
  })}</ol>;
}

function DocumentDetail({ job, tab, onTab, onResume, busy }: { job: Job; tab: string | null; onTab: (tab: TourBucket) => void; onResume: () => void; busy: boolean }) {
  const counts = bucketCounts(job);
  const fallback = TOUR_BUCKETS.find((b) => counts[b.value] > 0)?.value ?? "review";
  const bucket = (TOUR_BUCKETS.some((b) => b.value === tab) ? tab : fallback) as TourBucket;
  const [query, setQuery] = useState("");
  const tours = job.tours.filter((tour) => bucketOf(tour.status) === bucket).filter((tour) => {
    if (!query.trim()) return true;
    const s = candidateSummary(tour.tourDataJson);
    return normalize(`${s.name} ${s.destination ?? ""}`).includes(normalize(query));
  });
  const { canResume, shownStatus } = jobState(job);
  const retrying = job.status === "PROCESSING" && job.lastError?.startsWith("Reintentando");

  return <div className="space-y-5">
    <div className="space-y-5 rounded-2xl border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><h2 className="truncate font-heading text-xl font-semibold text-brand-darkRed">{job.filename}</h2>
          <p className="text-sm text-muted-foreground">Subido {formatDateTime(job.createdAt)} · {job.tours.length} de {job.totalTours || "?"} tours · intento {job.attempts}/3</p></div>
        <div className="flex items-center gap-2"><StatusBadge domain="catalogImport" status={shownStatus} />
          {canResume && <Button size="sm" variant="outline" disabled={busy} onClick={onResume}><RotateCw className="mr-1.5 h-4 w-4" />Reanudar</Button>}</div>
      </div>
      <PipelineSteps job={job} />
      {job.status === "PROCESSING" && <p role="status" className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
        {job.batchStage === "enrichment" ? "Los tours ya están extraídos y puedes empezar a revisarlos. Claude sigue mejorando los textos; los que edites no se tocarán."
          : "Claude está leyendo el PDF. Suele tardar unos minutos; puedes cerrar esta página y volver luego."}
        {retrying && <span className="mt-1 block text-xs text-sky-700">{job.lastError}</span>}</p>}
      {job.lastError && !retrying && <p role="alert" className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{job.lastError}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{TOUR_BUCKETS.map((b) => <button key={b.value} type="button" onClick={() => onTab(b.value)}
        className={cn("rounded-xl border p-3 text-left transition hover:border-brand-teal/50", bucket === b.value && "border-brand-teal bg-brand-teal/5")}>
        <span className="block font-heading text-2xl font-bold text-brand-darkRed">{counts[b.value]}</span>
        <span className="text-xs text-muted-foreground">{b.label}</span>
      </button>)}</div>
    </div>

    <div className="overflow-hidden rounded-2xl border bg-white">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-medium">{TOUR_BUCKETS.find((b) => b.value === bucket)!.label} <span className="text-muted-foreground">({counts[bucket]})</span></h3>
        <div className="relative sm:w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o destino" className="pl-8" aria-label="Buscar tour" /></div>
      </div>
      {tours.length ? <ul className="divide-y">{tours.map((tour) => <TourRow key={tour.id} tour={tour} />)}</ul>
        : <EmptyState title={query ? "Ningún tour coincide con la búsqueda" : "No hay tours en esta sección"}
            description={bucket === "review" && job.status === "PROCESSING" ? "Aparecerán aquí en cuanto Claude termine de leer el PDF." : undefined} />}
    </div>

    <UsagePanel operations={job.operations} />
  </div>;
}

function TourRow({ tour }: { tour: JobTour }) {
  const summary = candidateSummary(tour.tourDataJson);
  const suggestions = tour.issues.filter((i) => isClaudeSuggestion(i.reason)).length;
  const checked = tour.issues.filter((i) => i.checkedAt).length;
  return <li><Link href={`/admin/dev/catalog-import/${tour.id}`} className="flex items-center gap-4 px-4 py-3 transition hover:bg-muted/40">
    <div className="min-w-0 flex-1">
      <p className="truncate font-medium">{summary.name}</p>
      <p className="truncate text-xs text-muted-foreground">{[summary.destination, summary.duration, tour.sourcePages.length ? `pág. ${tour.sourcePages.join(", ")}` : null].filter(Boolean).join(" · ")}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:hidden"><StatusBadge domain="catalogTour" status={tour.status} /></div>
    </div>
    <div className="hidden flex-wrap items-center justify-end gap-2 text-xs sm:flex">
      {(tour.tourDataJson as { informational?: boolean } | null)?.informational && <span className="rounded-full border border-brand-orange/30 bg-brand-orange/10 px-2 py-0.5 font-medium text-brand-orange">Informativo · desde</span>}
      {tour.reviewDraftAt && <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-800">Cambios sin aprobar</span>}
      {suggestions > 0 && <span className="inline-flex items-center gap-1 text-brand-darkTeal"><Sparkles className="h-3.5 w-3.5" />{suggestions}</span>}
      {tour.issues.length > 0 && <span className="text-muted-foreground">{checked}/{tour.issues.length} revisados</span>}
      <StatusBadge domain="catalogTour" status={tour.status} />
    </div>
    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
  </Link></li>;
}

function UsagePanel({ operations }: { operations: Job["operations"] }) {
  if (!operations.length) return null;
  const total = operations.reduce((sum, op) => sum + (op.estimatedCost == null ? 0 : Number(op.estimatedCost)), 0);
  return <details className="rounded-2xl border bg-white p-4 text-sm">
    <summary className="cursor-pointer font-medium">Uso de Claude <span className="font-normal text-muted-foreground">· {operations.length} operaciones · US$ {total.toFixed(4)} estimado</span></summary>
    <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs">
      <thead className="text-muted-foreground"><tr>{["Operación", "Modelo", "Tokens (entrada / salida)", "Tiempo", "Costo US$", "Resultado"].map((h) => <th key={h} className="p-2 font-medium">{h}</th>)}</tr></thead>
      <tbody className="divide-y">{operations.map((op, i) => <tr key={i}>
        <td className="p-2">{OPERATION_LABELS[op.operation] ?? op.operation}</td><td className="p-2">{op.model}</td>
        <td className="p-2">{op.inputTokens ?? "—"} / {op.outputTokens ?? "—"}</td>
        <td className="p-2">{op.latencyMs == null ? "Lote" : `${(op.latencyMs / 1000).toFixed(1)} s`}</td>
        <td className="p-2">{op.estimatedCost == null ? "—" : Number(op.estimatedCost).toFixed(4)}</td>
        <td className="p-2">{op.success ? <span className="text-brand-darkTeal">OK</span> : <span className="text-red-700">{op.error || "Error"}</span>}</td>
      </tr>)}</tbody>
    </table></div>
  </details>;
}
