"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, ChevronRight, ExternalLink, Loader2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/admin/list-states";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { cn, parseItineraryDescription } from "@/lib/utils";
import { GROUP_LABELS, REVIEW_GROUPS, type ReviewGroup, type TourContent } from "@/server/catalog-review/content";

const STATUS_TEXT: Record<string, string> = {
  PENDING: "Claude todavía está revisando este tour.", NO_CHANGES: "Este tour ya cumple el estándar: Claude no propone cambios.",
  APPLIED: "Cambios aplicados en la web.", DISMISSED: "Propuesta descartada.", FAILED: "Claude no pudo revisar este tour.",
};

function Column({ title, tone, children }: { title: string; tone: "before" | "after"; children: ReactNode }) {
  return <div className={cn("min-w-0 space-y-2 rounded-lg border p-3", tone === "after" ? "border-brand-teal/30 bg-brand-teal/5" : "bg-muted/20")}>
    <p className={cn("text-[11px] font-semibold uppercase tracking-wide", tone === "after" ? "text-brand-darkTeal" : "text-muted-foreground")}>{title}</p>
    {children}
  </div>;
}

const Lang = ({ code, children }: { code: string; children: ReactNode }) =>
  <div className="space-y-0.5"><span className="rounded bg-white px-1 text-[10px] font-semibold text-muted-foreground ring-1 ring-border">{code}</span><div className="whitespace-pre-wrap text-sm">{children}</div></div>;

function Itinerary({ content }: { content: TourContent }) {
  return <div className="space-y-3">{content.itinerary.map((day) => <div key={day.id} className="space-y-1.5">
    <p className="text-sm font-semibold">Día {day.dayNumber} · {day.titleEs}</p>
    {parseItineraryDescription(day.descriptionEs).map((block, i) => block.type === "heading"
      ? <p key={i} className="text-sm font-medium text-brand-darkRed">{block.text}</p>
      : <p key={i} className="text-sm text-muted-foreground">{block.text}</p>)}
  </div>)}</div>;
}

function GroupContent({ content, group }: { content: TourContent; group: ReviewGroup }) {
  switch (group) {
    case "name": return <><Lang code="ES">{content.nameEs}</Lang><Lang code="EN">{content.nameEn}</Lang></>;
    case "shortDesc": return <><Lang code="ES">{content.shortDescEs}</Lang><Lang code="EN">{content.shortDescEn}</Lang></>;
    case "longDesc": return <><Lang code="ES">{content.longDescEs}</Lang><Lang code="EN">{content.longDescEn}</Lang></>;
    case "seo": return <><Lang code="ES">{content.metaTitleEs || "—"}{"\n"}<span className="text-muted-foreground">{content.metaDescEs || "—"}</span></Lang>
      <Lang code="EN">{content.metaTitleEn || "—"}{"\n"}<span className="text-muted-foreground">{content.metaDescEn || "—"}</span></Lang></>;
    case "itinerary": return <Itinerary content={content} />;
    case "includes": return <>{(["INCLUDE", "EXCLUDE"] as const).map((type) => {
      const items = content.includes.filter((i) => i.type === type);
      return items.length ? <div key={type}><p className="text-xs font-medium">{type === "INCLUDE" ? "Incluye" : "No incluye"}</p>
        <ul className="list-disc space-y-0.5 pl-4 text-sm">{items.map((i) => <li key={i.id}>{i.textEs}</li>)}</ul></div> : null;
    })}</>;
    case "conditions": return <ul className="space-y-1 text-sm">{content.conditions.map((c) => <li key={c.id}><span className="mr-1 rounded bg-white px-1 text-[10px] text-muted-foreground ring-1 ring-border">{c.type}</span>{c.textEs}</li>)}</ul>;
  }
}

export function CatalogRevision({ revisionId }: { revisionId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const query = trpc.catalogReview.revision.useQuery({ revisionId }, { retry: false, refetchOnWindowFocus: false });
  const [selected, setSelected] = useState<ReviewGroup[]>([]);
  const data = query.data;
  useEffect(() => {
    if (data?.proposal) setSelected(data.proposal.groups.filter((g) => !data.editedSince.includes(g)));
  }, [data]);
  const done = async (title: string, goNext: boolean) => {
    toast({ title }); await utils.catalogReview.overview.invalidate();
    if (goNext && data?.nextPending) router.push(`/admin/dev/catalog-import/revision/${data.nextPending}`);
    else await query.refetch();
  };
  const fail = (title: string) => (error: { message: string }) => toast({ title, description: error.message, variant: "destructive" });
  const apply = trpc.catalogReview.applyChanges.useMutation({ onSuccess: () => done("Cambios aplicados en la web", true), onError: fail("No se pudo aplicar") });
  const undo = trpc.catalogReview.undo.useMutation({ onSuccess: () => done("Cambios deshechos", false), onError: fail("No se pudo deshacer") });
  const dismiss = trpc.catalogReview.dismiss.useMutation({ onSuccess: () => done("Propuesta descartada", true), onError: fail("No se pudo descartar") });
  const busy = apply.isPending || undo.isPending || dismiss.isPending;

  if (query.isLoading) return <div className="space-y-4"><Skeleton className="h-14 w-full rounded-xl" /><Skeleton className="h-[60vh] w-full rounded-xl" /></div>;
  if (query.error || !data) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const { proposal, before } = data;
  const shownGroups = REVIEW_GROUPS.filter((g) => proposal?.groups.includes(g) || proposal?.rejected[g]);
  const toggle = (g: ReviewGroup, on: boolean) => setSelected((current) => (on ? [...new Set([...current, g])] : current.filter((x) => x !== g)));

  return <div className="space-y-5 pb-24">
    <header className="flex flex-wrap items-center gap-3">
      <Button asChild variant="ghost" size="sm"><Link href="/admin/dev/catalog-import?view=review"><ArrowLeft className="mr-1 h-4 w-4" />Revisión del catálogo</Link></Button>
      <h1 className="min-w-0 flex-1 truncate font-heading text-xl font-semibold text-brand-darkRed">{data.tour.nameEs}</h1>
      <Button asChild variant="outline" size="sm"><a href={`/es/tours/${data.tour.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1 h-4 w-4" />Ver en la web</a></Button>
    </header>

    {data.status !== "PROPOSED" && <p className={cn("rounded-xl border px-4 py-3 text-sm", data.status === "APPLIED" ? "border-brand-teal/30 bg-brand-teal/10 text-brand-darkTeal" : data.status === "FAILED" ? "border-red-200 bg-red-50 text-red-800" : "bg-muted/40")}>
      {STATUS_TEXT[data.status]}{data.error && ` ${data.error}`}{data.status === "APPLIED" && data.appliedFields.length > 0 && ` Bloques: ${data.appliedFields.map((g) => GROUP_LABELS[g]).join(", ")}.`}</p>}

    {proposal?.notes?.length ? <section className="rounded-xl border bg-white p-4">
      <h2 className="text-sm font-medium">Notas de Claude</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{proposal.notes.map((n, i) => <li key={i}><span className="font-medium text-foreground">{n.field}:</span> {n.reason}</li>)}</ul>
    </section> : null}

    {proposal && shownGroups.map((group) => {
      const rejected = proposal.rejected[group], edited = data.editedSince.includes(group);
      const selectable = data.status === "PROPOSED" && !rejected && !edited && proposal.groups.includes(group);
      return <section key={group} className={cn("space-y-3 rounded-xl border bg-white p-4", selected.includes(group) && "ring-1 ring-brand-teal")}>
        <label className="flex items-center gap-2.5">
          <input type="checkbox" className="h-4 w-4 accent-[#15A58E]" disabled={!selectable} checked={selectable && selected.includes(group)} onChange={(e) => toggle(group, e.target.checked)} />
          <span className="font-medium">{GROUP_LABELS[group]}</span>
          {data.status === "APPLIED" && data.appliedFields.includes(group) && <span className="rounded-full bg-brand-teal/15 px-2 py-0.5 text-[11px] font-medium text-brand-darkTeal">Aplicado</span>}
        </label>
        {rejected && <p className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900"><AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />No se propone: {rejected}</p>}
        {edited && !rejected && data.status === "PROPOSED" && <p className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900"><AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />Este bloque se editó en Tours después de la revisión; no se aplica para no pisar ese cambio.</p>}
        {!rejected && <div className="grid gap-3 lg:grid-cols-2">
          <Column title="Actual" tone="before"><GroupContent content={before} group={group} /></Column>
          <Column title="Propuesta" tone="after"><GroupContent content={proposal.after} group={group} /></Column>
        </div>}
      </section>;
    })}

    <footer className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
        {data.status === "PROPOSED" && <Button variant="ghost" className="text-muted-foreground" disabled={busy} onClick={() => dismiss.mutate({ revisionId })}>Descartar propuesta</Button>}
        <span className="hidden flex-1 text-xs text-muted-foreground sm:block">Precios, duración, destino, fechas e imágenes no se modifican.</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {data.nextPending && <Button variant="outline" disabled={busy} onClick={() => router.push(`/admin/dev/catalog-import/revision/${data.nextPending}`)}>Siguiente tour<ChevronRight className="ml-1 h-4 w-4" /></Button>}
          {data.status === "APPLIED" && <Button variant="outline" disabled={busy} onClick={() => undo.mutate({ revisionId })}>{undo.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Undo2 className="mr-1.5 h-4 w-4" />}Deshacer</Button>}
          {data.status === "PROPOSED" && <Button disabled={busy || !selected.length} onClick={() => apply.mutate({ revisionId, groups: selected })}>
            {apply.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}Aplicar {selected.length} {selected.length === 1 ? "bloque" : "bloques"} en la web</Button>}
        </div>
      </div>
    </footer>
  </div>;
}
