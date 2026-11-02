"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, CircleDashed, CloudCheck, Copy, Loader2, Sparkles, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import { ErrorState } from "@/components/admin/list-states";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { catalogTourCandidateSchema } from "@/server/catalog-import/schemas";
import type { RouterOutput } from "@/types";
import { CatalogClaudePanel } from "./catalog-claude-panel";
import { bucketOf, fieldLabel, groupPending, relativeTime, REVIEW_TABS, type PendingGroup, type ReviewTab } from "./catalog-fields";
import { AdvancedSection, GeneralSection, ItinerarySection, PricesSection, SeoSection, ServicesSection, type Draft, type SectionProps } from "./catalog-review-fields";

type Preview = RouterOutput["catalogImport"]["preview"];
const AUTOSAVE_DELAY_MS = 1200;
// Fields whose AI-proposed value only becomes official when the reviewer confirms it.
const ALWAYS_CONFIRMABLE = ["category", "difficulty", "durationDays", "durationNights"];

export function CatalogReview({ importTourId }: { importTourId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const preview = trpc.catalogImport.preview.useQuery({ importTourId }, { retry: false, refetchOnWindowFocus: false });
  const destinations = trpc.tour.destinations.useQuery();
  const categories = trpc.tour.categories.useQuery();
  const data = preview.data;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [version, setVersion] = useState(0);
  const loadedFor = useRef<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const editSeq = useRef(0);
  const [tab, setTab] = useState<ReviewTab>("general");
  const [dialog, setDialog] = useState<"approve" | "skip" | "discard" | null>(null);
  const [note, setNote] = useState("");
  const [, tick] = useState(0);

  // (Re)load the editor only on first load or after an approval/discard, never on background refetches mid-edit.
  useEffect(() => {
    if (!data || loadedFor.current === `${data.record.id}:${version}`) return;
    loadedFor.current = `${data.record.id}:${version}`;
    const initial = (data.draft ?? data.candidate ?? data.record.tourDataJson) as Draft;
    setDraft(initial); setDirty(false);
    setSavedAt(data.record.reviewDraftAt ? new Date(data.record.reviewDraftAt) : null);
    if (!data.candidate && !data.draft) setTab("advanced");
  }, [data, version]);
  useEffect(() => { const id = setInterval(() => tick((n) => n + 1), 15_000); return () => clearInterval(id); }, []);

  const save = trpc.catalogImport.saveReviewDraft.useMutation();
  useEffect(() => {
    if (!dirty || !draft) return;
    const seq = editSeq.current;
    const timer = setTimeout(() => {
      save.mutate({ importTourId, candidate: draft as unknown as Record<string, unknown> }, {
        onSuccess: (result) => { setSavedAt(new Date(result.savedAt)); if (editSeq.current === seq) setDirty(false); },
        onError: (error) => toast({ title: "No se pudo guardar el avance", description: error.message, variant: "destructive" }),
      });
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, dirty, importTourId]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty || save.isPending) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, save.isPending]);

  const reload = async () => { await preview.refetch(); setVersion((v) => v + 1); void utils.catalogImport.history.invalidate(); };
  const checkIssues = trpc.catalogImport.setIssueChecked.useMutation({
    onMutate: ({ issueIds, checked }) => utils.catalogImport.preview.setData({ importTourId }, (old) => old && {
      ...old, record: { ...old.record, issues: old.record.issues.map((i) => (issueIds.includes(i.id) ? { ...i, checkedAt: checked ? new Date() : null } : i)) },
    }),
    onError: (error) => { toast({ title: "No se guardó la marca", description: error.message, variant: "destructive" }); void preview.refetch(); },
  });
  const approve = trpc.catalogImport.updateCandidate.useMutation();
  const discard = trpc.catalogImport.discardReviewDraft.useMutation();
  const skip = trpc.catalogImport.skipCandidate.useMutation();
  const create = trpc.catalogImport.createDraft.useMutation();

  const groups = useMemo(() => groupPending(data?.record.issues ?? []), [data?.record.issues]);
  // Open issues highlight their field; a price card or itinerary activity also collects its sub-fields (amount, time…).
  const issuesFor = useMemo(() => {
    const open = (data?.record.issues ?? []).filter((i) => i.field && !i.checkedAt);
    return (field: string) => {
      const card = /^(prices\.\d+|itinerary\.\d+\.items\.\d+)$/.test(field);
      return open.filter((i) => i.field === field || (card && i.field!.startsWith(`${field}.`))).map((i) => i.reason);
    };
  }, [data?.record.issues]);

  if (preview.isLoading || (data && !draft)) return <div className="space-y-4"><Skeleton className="h-14 w-full rounded-xl" /><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><Skeleton className="h-[60vh] rounded-xl" /><Skeleton className="h-[60vh] rounded-xl" /></div></div>;
  if (preview.error || !data || !draft) return <ErrorState error={preview.error} onRetry={() => void preview.refetch()} />;

  const record = data.record;
  const created = record.status === "DRAFT_CREATED" || record.status === "VALIDATED" || Boolean(record.createdTourId);
  const readOnly = created;
  const hasDraft = dirty || savedAt !== null;
  const confirmable = new Set([...ALWAYS_CONFIRMABLE, ...Object.entries(data.candidate?.provenance ?? {}).filter(([, p]) => p.requiresReview || p.source === "inferred" || p.source === "suggested").map(([k]) => k)]);
  const confirmed = groups.filter((g) => g.checked && confirmable.has(g.field)).map((g) => g.field);
  const checkedCount = groups.filter((g) => g.checked).length;
  const canCreate = !hasDraft && record.status === "READY" && data.validation.length === 0;
  const index = data.siblings.findIndex((s) => s.id === record.id);
  const nextPending = [...data.siblings.slice(index + 1), ...data.siblings.slice(0, index)].find((s) => ["review", "ready"].includes(bucketOf(s.status)));
  const back = `/admin/dev/catalog-import?doc=${record.importId}`;
  const sectionProps: SectionProps = { draft, readOnly, issuesFor, update: (change) => { editSeq.current++; setDraft((d) => (d ? change(d) : d)); setDirty(true); } };
  const fail = (title: string) => (error: { message: string }) => toast({ title, description: error.message, variant: "destructive" });

  function submitApproval() {
    const parsed = catalogTourCandidateSchema.safeParse(draft);
    if (!parsed.success) { toast({ title: "Hay campos con formato inválido", description: parsed.error.issues.slice(0, 4).map((i) => `${fieldLabel(i.path.join("."))}: ${i.message}`).join(" · "), variant: "destructive" }); return; }
    approve.mutate({ importTourId, candidate: parsed.data, reviewNote: note, confirmedFields: confirmed }, {
      onSuccess: async (result) => {
        setDialog(null); setNote(""); await reload();
        toast(result.status === "READY" ? { title: "Cambios aprobados", description: "El tour está listo: ya puedes crearlo como borrador." }
          : { title: "Cambios aprobados", description: `Quedan ${result.issues.length + result.duplicateMatches.length} avisos por resolver.` });
      },
      onError: fail("No se pudieron aprobar los cambios"),
    });
  }

  return <div className="pb-24">
    <header className="sticky top-0 z-20 -mx-4 mb-6 border-b bg-[hsl(26,44%,97%)]/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link href={back}><ArrowLeft className="mr-1 h-4 w-4" />Bandeja</Link></Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-lg font-semibold text-brand-darkRed sm:text-xl">{draft.nameEs || draft.nameEn || "Tour sin nombre"}</h1>
          <p className="truncate text-xs text-muted-foreground">{record.import.filename}{record.sourcePages.length > 0 && ` · pág. ${record.sourcePages.join(", ")}`}</p>
        </div>
        <SaveIndicator saving={save.isPending} dirty={dirty} savedAt={savedAt} readOnly={readOnly} />
        <StatusBadge domain="catalogTour" status={record.status} />
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Tour anterior" disabled={index <= 0} onClick={() => router.push(`/admin/dev/catalog-import/${data.siblings[index - 1].id}`)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-muted-foreground">{index + 1} de {data.siblings.length}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Tour siguiente" disabled={index >= data.siblings.length - 1} onClick={() => router.push(`/admin/dev/catalog-import/${data.siblings[index + 1].id}`)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </header>

    {created && <Banner tone="teal">Este tour ya se creó como borrador en Tours{record.createdTourId && ` (ID ${record.createdTourId})`}. Las ediciones posteriores se hacen allí.</Banner>}
    {record.status === "BLOCKED" && <Banner tone="slate">Este tour está omitido. Si lo corriges y apruebas los cambios, vuelve a la revisión.</Banner>}
    {record.import.status === "PROCESSING" && record.import.batchStage === "enrichment" && !hasDraft && !created && <Banner tone="sky">Claude todavía puede estar mejorando este tour. Si empiezas a editarlo, su propuesta se descarta y se respeta lo tuyo.</Banner>}

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Tabs value={tab} onValueChange={(v) => setTab(v as ReviewTab)} className="min-w-0 space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-white p-1">
          {REVIEW_TABS.map((t) => { const open = groups.filter((g) => g.tab === t.value && !g.checked).length;
            return <TabsTrigger key={t.value} value={t.value} disabled={!data.candidate && !data.draft && t.value !== "advanced"} className="gap-1.5">{t.label}
              {open > 0 && <span className="rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-800">{open}</span>}</TabsTrigger>; })}
        </TabsList>
        {data.candidate || data.draft ? <>
          <TabsContent value="general"><GeneralSection {...sectionProps} destinations={destinations.data ?? []} categories={categories.data?.categories ?? []} /></TabsContent>
          <TabsContent value="prices"><PricesSection {...sectionProps} /></TabsContent>
          <TabsContent value="itinerary"><ItinerarySection {...sectionProps} /></TabsContent>
          <TabsContent value="services"><ServicesSection {...sectionProps} /></TabsContent>
          <TabsContent value="seo"><SeoSection {...sectionProps} /></TabsContent>
        </> : null}
        <TabsContent value="advanced"><AdvancedSection key={version} {...sectionProps} /></TabsContent>
      </Tabs>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
        <PendingPanel groups={groups} checkedCount={checkedCount} confirmable={confirmable} readOnly={readOnly} onGo={setTab}
          onToggle={(group, checked) => checkIssues.mutate({ issueIds: group.issues.map((i) => i.id), checked })} />
        {data.duplicateMatches.length > 0 && <DuplicatePanel matches={data.duplicateMatches} />}
        {data.candidate && <div className="space-y-2">
          <CatalogClaudePanel importTourId={importTourId} canEnrich={!created && record.status !== "BLOCKED" && !hasDraft} onChanged={reload} />
          {hasDraft && !created && <p className="px-1 text-xs text-muted-foreground">Para que Claude mejore el tour, primero aprueba o descarta tus cambios.</p>}
        </div>}
      </aside>
    </div>

    {!readOnly && <footer className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
        {record.status !== "BLOCKED" && <Button variant="ghost" className="text-muted-foreground" onClick={() => setDialog("skip")}>Omitir tour</Button>}
        <span className="hidden flex-1 text-xs text-muted-foreground sm:block">{hasDraft ? "Tus cambios se guardan solos. Apruébalos cuando termines." : groups.length ? `${checkedCount} de ${groups.length} pendientes revisados.` : "Sin pendientes."}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {savedAt && <Button variant="outline" onClick={() => setDialog("discard")}><Undo2 className="mr-1.5 h-4 w-4" />Descartar cambios</Button>}
          {nextPending && !hasDraft && !canCreate && <Button variant="outline" onClick={() => router.push(`/admin/dev/catalog-import/${nextPending.id}`)}>Siguiente por revisar<ChevronRight className="ml-1 h-4 w-4" /></Button>}
          {canCreate ? <Button disabled={create.isPending} onClick={() => create.mutate({ importTourId, previewToken: data.previewToken }, {
              onSuccess: async () => { toast({ title: "Tour creado como borrador", description: "Ya está en Tours para fotos, salidas y publicación." }); await reload(); if (nextPending) router.push(`/admin/dev/catalog-import/${nextPending.id}`); },
              onError: fail("No se pudo crear el tour"),
            })}>{create.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}Crear tour (borrador)</Button>
            : <Button disabled={(!hasDraft && !confirmed.length) || save.isPending} onClick={() => setDialog("approve")}>
              <Check className="mr-1.5 h-4 w-4" />Aprobar cambios{confirmed.length > 0 && ` (${confirmed.length} confirmados)`}</Button>}
        </div>
      </div>
    </footer>}

    <Dialog open={dialog === "approve"} onOpenChange={(open) => !open && !approve.isPending && setDialog(null)}>
      <DialogContent><DialogHeader><DialogTitle>Aprobar cambios</DialogTitle>
        <DialogDescription>Se aplican tus ediciones, se revalida el tour y se guarda la nota como evidencia de la revisión.</DialogDescription></DialogHeader>
        {confirmed.length > 0 && <p className="rounded-lg bg-brand-teal/10 p-3 text-sm text-brand-darkTeal">Confirmas como correctos: {confirmed.map(fieldLabel).join(", ")}.</p>}
        <label className="space-y-1.5 text-sm"><span className="font-medium">¿Qué corregiste o confirmaste, y dónde lo verificaste?</span>
          <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} autoFocus placeholder="Ej.: Corregí el precio infantil según la página 3 y confirmé la categoría." /></label>
        <DialogFooter><Button variant="ghost" onClick={() => setDialog(null)} disabled={approve.isPending}>Cancelar</Button>
          <Button onClick={submitApproval} disabled={note.trim().length < 10 || approve.isPending}>{approve.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Aprobar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={dialog === "skip"} onOpenChange={(open) => !open && !skip.isPending && setDialog(null)}>
      <DialogContent><DialogHeader><DialogTitle>Omitir este tour</DialogTitle><DialogDescription>No se creará. Queda en «Omitidos» con tu motivo y puedes corregirlo más tarde.</DialogDescription></DialogHeader>
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} autoFocus placeholder="Motivo, p. ej.: ya existe en la web con otro nombre." />
        <DialogFooter><Button variant="ghost" onClick={() => setDialog(null)}>Cancelar</Button>
          <Button variant="destructive" disabled={note.trim().length < 10 || skip.isPending} onClick={() => skip.mutate({ importTourId, reason: note }, {
            onSuccess: async () => { setDialog(null); setNote(""); await reload(); toast({ title: "Tour omitido" }); if (nextPending) router.push(`/admin/dev/catalog-import/${nextPending.id}`); },
            onError: fail("No se pudo omitir"),
          })}>Omitir</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={dialog === "discard"} onOpenChange={(open) => !open && setDialog(null)}>
      <DialogContent><DialogHeader><DialogTitle>¿Descartar tus cambios?</DialogTitle><DialogDescription>El tour vuelve a la última versión aprobada. Tus marcas de «revisado» se conservan.</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="ghost" onClick={() => setDialog(null)}>Seguir editando</Button>
          <Button variant="destructive" disabled={discard.isPending} onClick={() => discard.mutate({ importTourId }, {
            onSuccess: async () => { setDialog(null); await reload(); toast({ title: "Cambios descartados" }); }, onError: fail("No se pudo descartar"),
          })}>Descartar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

function SaveIndicator({ saving, dirty, savedAt, readOnly }: { saving: boolean; dirty: boolean; savedAt: Date | null; readOnly: boolean }) {
  if (readOnly) return null;
  const [icon, text, className] = saving ? [<Loader2 key="i" className="h-3.5 w-3.5 animate-spin" />, "Guardando…", "text-sky-700"]
    : dirty ? [<CircleDashed key="i" className="h-3.5 w-3.5" />, "Cambios sin guardar", "text-amber-700"]
    : savedAt ? [<CloudCheck key="i" className="h-3.5 w-3.5" />, `Avance guardado ${relativeTime(savedAt)}`, "text-brand-darkTeal"]
    : [<Check key="i" className="h-3.5 w-3.5" />, "Sin cambios pendientes", "text-muted-foreground"];
  return <span role="status" aria-live="polite" className={cn("hidden items-center gap-1.5 text-xs sm:inline-flex", className)}>{icon}{text}</span>;
}

function Banner({ tone, children }: { tone: "teal" | "slate" | "sky"; children: React.ReactNode }) {
  const tones = { teal: "border-brand-teal/30 bg-brand-teal/10 text-brand-darkTeal", slate: "border-slate-200 bg-slate-50 text-slate-700", sky: "border-sky-200 bg-sky-50 text-sky-900" };
  return <p className={cn("mb-4 rounded-xl border px-4 py-3 text-sm", tones[tone])}>{children}</p>;
}

function PendingPanel({ groups, checkedCount, confirmable, readOnly, onGo, onToggle }: {
  groups: PendingGroup[]; checkedCount: number; confirmable: Set<string>; readOnly: boolean; onGo: (tab: ReviewTab) => void; onToggle: (group: PendingGroup, checked: boolean) => void;
}) {
  return <section className="rounded-xl border bg-white p-4">
    <div className="flex items-center justify-between"><h2 className="font-medium">Pendientes</h2>
      <span className="text-xs tabular-nums text-muted-foreground">{checkedCount}/{groups.length} revisados</span></div>
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-brand-teal transition-all" style={{ width: `${groups.length ? (checkedCount / groups.length) * 100 : 100}%` }} /></div>
    {!groups.length ? <p className="mt-4 flex items-center gap-2 text-sm text-brand-darkTeal"><Check className="h-4 w-4" />Sin pendientes: el tour pasó todas las validaciones.</p>
      : <ul className="mt-3 space-y-2">{groups.map((group) => <li key={group.field} className={cn("rounded-lg border p-2.5 transition", group.checked ? "border-brand-teal/20 bg-brand-teal/5" : "border-amber-200 bg-amber-50/50")}>
        <div className="flex items-start gap-2.5">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#15A58E]" checked={group.checked} disabled={readOnly} aria-label={`Marcar ${group.label} como revisado`} onChange={(e) => onToggle(group, e.target.checked)} />
          <div className="min-w-0 flex-1">
            <button type="button" onClick={() => onGo(group.tab)} className={cn("text-left text-sm font-medium hover:underline", group.checked && "text-muted-foreground line-through decoration-1")}>{group.label}</button>
            {confirmable.has(group.field) && !group.checked && <span className="ml-1.5 text-[11px] text-amber-800">· marcar = confirmar dato</span>}
            {!group.checked && <p className="mt-0.5 text-xs text-muted-foreground">{group.issues.find((i) => !i.reason.startsWith("Sugerencia de Claude"))?.reason ?? group.issues[0].reason}</p>}
            {group.suggestion && !group.checked && <SuggestionDiff before={group.suggestion.valueA} after={group.suggestion.valueB} evidence={group.suggestion.reason} />}
          </div>
        </div>
      </li>)}</ul>}
  </section>;
}

function SuggestionDiff({ before, after, evidence }: { before: string | null; after: string | null; evidence: string }) {
  return <details className="mt-2 rounded-md border border-brand-teal/20 bg-white p-2 text-xs">
    <summary className="flex cursor-pointer items-center gap-1 font-medium text-brand-darkTeal"><Sparkles className="h-3.5 w-3.5" />Ver propuesta de Claude</summary>
    <div className="mt-2 space-y-2">
      <p className="line-clamp-4 rounded bg-red-50 p-1.5 text-red-900 line-through decoration-red-300">{before ?? "(vacío)"}</p>
      <p className="line-clamp-6 rounded bg-emerald-50 p-1.5 text-emerald-900">{after ?? "(vacío)"}</p>
      <p className="text-muted-foreground">{evidence.replace(/^Sugerencia de Claude:\s*/, "")}</p>
    </div>
  </details>;
}

function DuplicatePanel({ matches }: { matches: Preview["duplicateMatches"] }) {
  return <section className="rounded-xl border border-violet-200 bg-white p-4">
    <h2 className="flex items-center gap-2 font-medium"><Copy className="h-4 w-4 text-violet-700" />Parecido a tours existentes</h2>
    <ul className="mt-3 space-y-3">{matches.map((m) => <li key={m.tourId} className="rounded-lg bg-violet-50/60 p-3 text-xs">
      <p className="text-sm font-medium">{m.existing.nameEs}</p>
      <p className="text-muted-foreground">{Math.round(m.score * 100)}% de coincidencia · {m.existing.destination} · {m.existing.durationDays}D/{m.existing.durationNights}N</p>
      <p className="mt-1">{m.reasons.join(" ")}</p>
      <p className="mt-1 text-muted-foreground">{m.existing.prices.map((p) => `${p.label}: ${p.amount} USD`).join(" · ")}</p>
    </li>)}</ul>
    <p className="mt-3 text-xs text-muted-foreground">Si es el mismo tour, omítelo. Si es distinto, cambia nombre o datos para diferenciarlo y aprueba.</p>
  </section>;
}
