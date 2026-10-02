"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { catalogTourCandidateSchema, type CatalogTourCandidate } from "@/server/catalog-import/schemas";

export function CatalogPreview({ importTourId, onClose, onChanged }: { importTourId: string; onClose: () => void; onChanged: () => void }) {
  const { toast } = useToast();
  const preview = trpc.catalogImport.preview.useQuery({ importTourId }, { retry: false, staleTime: 0 });
  const [locale, setLocale] = useState<"Es" | "En">("Es");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CatalogTourCandidate | null>(null);
  const [raw, setRaw] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState<string[]>([]);
  useEffect(() => {
    if (preview.data) {
      setDraft(preview.data.candidate);
      setRaw(JSON.stringify(preview.data.candidate ?? preview.data.record.tourDataJson, null, 2));
      setNote(""); setConfirmed([]);
    }
  }, [preview.data]);
  const changed = async () => { setEditing(false); setAdvanced(false); onChanged(); await preview.refetch(); };
  const update = trpc.catalogImport.updateCandidate.useMutation({ onSuccess: changed, onError: (e) => toast({ title: "Revisión pendiente", description: e.message, variant: "destructive" }) });
  const create = trpc.catalogImport.createDraft.useMutation({ onSuccess: async () => { toast({ title: "Borrador creado", description: "Disponible en Tours del admin para revisión y publicación manual." }); await changed(); }, onError: (e) => toast({ title: "No se pudo crear", description: e.message, variant: "destructive" }) });
  const skip = trpc.catalogImport.skipCandidate.useMutation({ onSuccess: changed, onError: (e) => toast({ title: "No se pudo omitir", description: e.message, variant: "destructive" }) });
  const busy = update.isPending || create.isPending || skip.isPending;
  const data = preview.data;
  const c = editing ? draft : data?.candidate;
  function field(key: keyof CatalogTourCandidate, value: unknown) { setDraft((current) => current ? { ...current, [key]: value } as CatalogTourCandidate : current); }
  function save() {
    try {
      const value = advanced || !draft ? JSON.parse(raw) : draft;
      const parsed = catalogTourCandidateSchema.safeParse(value);
      if (!parsed.success) throw new Error(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
      update.mutate({ importTourId, candidate: parsed.data, reviewNote: note, confirmedFields: confirmed });
    } catch (e) { toast({ title: "Revisa los campos", description: String(e).slice(0, 1500), variant: "destructive" }); }
  }
  const text = (key: keyof CatalogTourCandidate, label: string, long = false) => <label className="block space-y-1" key={String(key)}><span className="text-xs font-medium">{label}</span>{editing
    ? long ? <Textarea rows={5} value={String(c?.[key] ?? "")} onChange={(e) => field(key, e.target.value || null)} /> : <Input value={String(c?.[key] ?? "")} onChange={(e) => field(key, e.target.value || null)} />
    : <p className="whitespace-pre-wrap rounded-md bg-muted/30 p-2 text-sm">{String(c?.[key] ?? "No indicado")}</p>}</label>;
  const list = (key: "includesEs" | "includesEn" | "excludesEs" | "excludesEn" | "conditionsEs" | "conditionsEn", label: string) => <div className="space-y-2"><h4 className="font-medium">{label}</h4>{editing ? <Textarea rows={4} value={c?.[key].join("\n") ?? ""} onChange={(e) => field(key, e.target.value.split("\n").filter((v) => v.trim()))} placeholder="Un servicio por línea" /> : <ul className="list-disc space-y-1 pl-5 text-sm">{c?.[key].map((v, i) => <li key={i}>{v}</li>)}</ul>}</div>;
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto"><DialogHeader><DialogTitle>Vista previa y revisión del tour</DialogTitle></DialogHeader>
    {preview.isLoading && <p>Cargando…</p>}{preview.error && <p role="alert" className="text-destructive">{preview.error.message}</p>}
    {data && <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-semibold">{data.candidate?.nameEs ?? "Candidato por revisar"}</h3><p className="text-sm text-muted-foreground">{data.record.sourceDocument} · páginas {data.record.sourcePages.join(", ") || "por revisar"} · {({ DUPLICATE: "DUPLICATE_REVIEW", NEEDS_REVIEW: "DATA_REVIEW" } as Record<string, string>)[data.record.status] ?? data.record.status}</p></div><div className="flex gap-2"><Button size="sm" variant={locale === "Es" ? "default" : "outline"} onClick={() => setLocale("Es")}>ES</Button><Button size="sm" variant={locale === "En" ? "default" : "outline"} onClick={() => setLocale("En")}>EN</Button></div></div>
      {(data.record.issues.length > 0 || data.validation.length > 0) && <details open className="rounded-md border border-amber-200 bg-amber-50 p-3"><summary className="cursor-pointer font-medium">Incidencias ({data.record.issues.length || data.validation.length})</summary><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr>{["Campo", "Valor A", "Valor B", "Páginas", "Motivo"].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{(data.record.issues.length ? data.record.issues : data.validation).map((issue, i) => <tr key={i}><td className="p-2">{issue.field}</td><td className="p-2">{issue.valueA ?? "—"}</td><td className="p-2">{issue.valueB ?? "—"}</td><td className="p-2">{issue.sourcePages.join(", ")}</td><td className="p-2">{issue.reason}</td></tr>)}</tbody></table></div></details>}
      {data.duplicateMatches.length > 0 && <details open className="rounded-md border p-3"><summary className="cursor-pointer font-medium">Comparación con tours existentes</summary>{data.duplicateMatches.map((match) => <div key={match.tourId} className="mt-3 space-y-3 border-t pt-3"><p className="text-sm">{Math.round(match.score * 100)}% de coincidencia · {match.reasons.join(" ")} · Campos: {match.matchingFields.join(", ")}</p><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-md bg-muted/30 p-3"><strong>Nuevo tour</strong><p>{data.candidate?.nameEs}</p><p className="text-sm">{data.candidate?.destination} · {data.candidate?.durationDays}D / {data.candidate?.durationNights}N</p><p className="text-sm">{data.candidate?.attractions?.join(", ")}</p><p className="text-sm">{data.candidate?.schedule?.times.join(", ")}</p><p className="text-sm">{data.candidate?.prices.map((p) => `${p.labelEs}: ${p.amount ?? "—"} ${p.currency ?? "—"} (${p.priceType ?? "sin unidad"})`).join("; ")}</p></div><div className="rounded-md bg-muted/30 p-3"><strong>Tour existente</strong><p>{match.existing.nameEs}</p><p className="text-sm">{match.existing.destination} · {match.existing.durationDays}D / {match.existing.durationNights}N · {match.existing.durationHours ?? "—"}h</p><p className="text-xs">ID: {match.tourId} · {match.existing.slug}</p><p className="text-sm">{match.existing.prices.map((p) => `${p.label}: ${p.amount} USD`).join("; ")}</p><p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm">{match.existing.itinerary}</p></div></div></div>)}</details>}
      {c && <Tabs defaultValue="general"><TabsList className="flex h-auto flex-wrap justify-start"><TabsTrigger value="general">Información General</TabsTrigger><TabsTrigger value="images">Imágenes sugeridas</TabsTrigger><TabsTrigger value="prices">Precios y Fechas</TabsTrigger><TabsTrigger value="itinerary">Itinerario y Otros</TabsTrigger></TabsList>
        <TabsContent value="general" className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">{text(`name${locale}`, "Nombre")}{text("slug", "Slug")}{text("destination", "Destino")}{text("category", "Categoría")}
          <label className="space-y-1 text-xs">Dificultad{editing ? <select className="block w-full rounded border p-2" value={c.difficulty ?? ""} onChange={(e) => field("difficulty", e.target.value || null)}><option value="">No indicada</option><option value="EASY">Fácil</option><option value="MODERATE">Moderada</option><option value="CHALLENGING">Exigente</option></select> : <p className="p-2">{c.difficulty ?? "No indicada"}</p>}</label>
          {(["durationDays", "durationNights", "durationHours"] as const).map((key) => <label key={key} className="space-y-1 text-xs">{{ durationDays: "Días", durationNights: "Noches", durationHours: "Horas" }[key]}{editing ? <Input type="number" min={0} value={c[key] ?? ""} onChange={(e) => field(key, e.target.value === "" ? null : Number(e.target.value))} /> : <p className="p-2">{c[key] ?? "No indicado"}</p>}</label>)}</div>
          {text(`shortDesc${locale}`, "Descripción corta (máximo 160 caracteres)", true)}{text(`longDesc${locale}`, "Descripción completa", true)}
          <details open><summary className="cursor-pointer text-sm font-medium">Procedencia de los datos</summary><div className="mt-2 space-y-2">{Object.entries(c.provenance ?? {}).map(([key, proof]) => <div key={key} className="rounded border p-2 text-xs"><strong>{key}</strong> · {proof.source} · páginas {proof.sourcePages.join(", ")}<p>{proof.evidence || "Sin evidencia textual"}</p>{proof.requiresReview && <p className="text-amber-800">Requiere confirmación</p>}</div>)}</div></details>
        </TabsContent>
        <TabsContent value="images"><p className="mb-3 text-sm text-muted-foreground">Sube las imágenes manualmente desde el formulario habitual del tour.</p><ol className="space-y-3">{c.imageSuggestions?.map((s, i) => <li key={i} className="rounded-md border p-3"><strong>{s.order}. {s.subject}</strong>{s.recommendedForCover && <span className="ml-2 text-xs text-teal-700">Portada sugerida</span>}<p className="text-sm">{s.reason}</p></li>)}</ol></TabsContent>
        <TabsContent value="prices" className="space-y-4">{c.prices.map((p, index) => <div key={index} className="space-y-2 rounded-md border p-3"><strong>{locale === "Es" ? p.labelEs : p.labelEn}</strong><p className="text-sm">{p.amount ?? "—"} {p.currency ?? "Moneda ausente"} · {p.priceType ?? "Unidad no definida"} · {p.source ?? "Origen ausente"}</p><p className="text-xs">Pasajeros: {p.minPassengers ?? "—"} a {p.maxPassengers ?? "—"} · Edad: {p.ageMin ?? "—"} a {p.ageMax ?? "—"} · Modalidad: {p.serviceMode ?? "—"}</p>{p.calculation && <p className="text-sm">Derivado: {p.calculation.expression} = {p.amount}</p>}{p.notes && <p className="text-sm">{p.notes}</p>}
          {editing && <div className="grid gap-2 sm:grid-cols-3">{(["labelEs", "labelEn", "amount", "currency", "ageMin", "ageMax"] as const).map((key) => <label key={key} className="text-xs">{key}<Input type={["amount", "ageMin", "ageMax"].includes(key) ? "number" : "text"} value={p[key] ?? ""} onChange={(e) => field("prices", c.prices.map((row, i) => i === index ? { ...row, [key]: e.target.value === "" ? null : ["amount", "ageMin", "ageMax"].includes(key) ? Number(e.target.value) : e.target.value } : row))} /></label>)}</div>}
        </div>)}
          {c.schedule ? <div className="rounded-md border p-3"><h4 className="font-medium">Salidas</h4><p className="text-sm">{c.schedule.frequency} · días {c.schedule.days.join(", ")} · {c.schedule.times.join(", ")}</p><p className="text-sm">{locale === "Es" ? c.schedule.notesEs : c.schedule.notesEn}</p><p>{c.schedule.dates.join(", ")}</p></div> : <p className="text-sm">Horarios no indicados.</p>}
        </TabsContent>
        <TabsContent value="itinerary" className="space-y-5">{c.itinerary.map((day, dayIndex) => <div key={dayIndex} className="space-y-3 rounded-md border p-4"><h4 className="font-semibold">Día {day.dayNumber} · {locale === "Es" ? day.titleEs : day.titleEn}</h4>
          {day.items?.map((item, itemIndex) => <div key={itemIndex} className="space-y-2 border-l-2 pl-4">{editing ? <><Input aria-label="Hora documentada" placeholder="HH:mm o sin hora" value={item.time ?? ""} onChange={(e) => field("itinerary", c.itinerary.map((d, di) => di === dayIndex ? { ...d, items: d.items?.map((it, ii) => ii === itemIndex ? { ...it, time: e.target.value || null } : it) } : d))} /><Input aria-label={`Título ${locale}`} value={item[`title${locale}`] ?? ""} onChange={(e) => field("itinerary", c.itinerary.map((d, di) => di === dayIndex ? { ...d, items: d.items?.map((it, ii) => ii === itemIndex ? { ...it, [`title${locale}`]: e.target.value || null } : it) } : d))} /><Textarea aria-label={`Descripción ${locale}`} value={item[`description${locale}`] ?? ""} onChange={(e) => field("itinerary", c.itinerary.map((d, di) => di === dayIndex ? { ...d, items: d.items?.map((it, ii) => ii === itemIndex ? { ...it, [`description${locale}`]: e.target.value || null } : it) } : d))} /></> : <>{item.time && <p className="text-xs font-medium text-teal-700">{item.time}</p>}<h5 className="font-medium">{item[`title${locale}`]}</h5><p className="whitespace-pre-wrap text-sm">{item[`description${locale}`]}</p></>}</div>)}
          {!day.items?.length && <p className="whitespace-pre-wrap text-sm">{day[`description${locale}`]}</p>}
        </div>)}
          <div className="grid gap-5 sm:grid-cols-2">{list(`includes${locale}`, "Incluye")}{list(`excludes${locale}`, "No incluye")}</div>
          <div className="space-y-2"><h4 className="font-medium">Condiciones</h4>{c.conditions?.map((condition, i) => <div key={i} className="rounded border p-3"><strong>{condition[`title${locale}`]}</strong><p className="text-sm">{condition[`description${locale}`]}</p></div>)}{list(`conditions${locale}`, "Otras condiciones")}</div>
          {text(`metaTitle${locale}`, "Título SEO")}{text(`metaDesc${locale}`, "Descripción SEO", true)}
        </TabsContent>
      </Tabs>}
      {editing && <div className="space-y-3 rounded-md border p-4">
        <Button variant="outline" size="sm" onClick={() => { if (!advanced) setRaw(JSON.stringify(draft ?? data.record.tourDataJson, null, 2)); else { try { setDraft(catalogTourCandidateSchema.parse(JSON.parse(raw))); } catch { toast({ title: "Corrige el JSON antes de volver al formulario", variant: "destructive" }); return; } } setAdvanced(!advanced); }}>{advanced ? "Volver al formulario" : "Editar estructura completa"}</Button>
        {(advanced || !draft) && <label className="block space-y-1 text-xs">Estructura completa del candidato<Textarea rows={18} className="font-mono text-xs" value={raw} onChange={(e) => setRaw(e.target.value)} /></label>}
        <p className="text-sm">Confirma las propuestas después de contrastarlas con el PDF:</p>
        {[...new Set(["category", "difficulty", "durationDays", "durationNights", ...Object.entries(c?.provenance ?? {}).filter(([, p]) => p.requiresReview || p.source === "inferred" || p.source === "suggested").map(([key]) => key)])].map((key) => <label key={key} className="mr-4 inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={confirmed.includes(key)} onChange={(e) => setConfirmed(e.target.checked ? [...confirmed, key] : confirmed.filter((f) => f !== key))} />{key}</label>)}
        <label className="block space-y-1 text-sm">Motivo y evidencia de la revisión (mínimo 10 caracteres)<Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Qué corregiste o confirmaste, y en qué página aparece." /></label>
        <Button disabled={busy || note.trim().length < 10} onClick={save}>{update.isPending ? "Validando…" : "Guardar y revalidar"}</Button>
        {data.record.status !== "DRAFT_CREATED" && <Button variant="outline" className="ml-2" disabled={busy || note.trim().length < 10} onClick={() => skip.mutate({ importTourId, reason: note })}>Omitir este candidato</Button>}
      </div>}
      <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
        <Button variant="outline" onClick={onClose} disabled={busy}>Cerrar</Button>
        {data.record.status !== "DRAFT_CREATED" && <Button variant="outline" disabled={busy} onClick={() => setEditing(!editing)}>{editing ? "Cancelar edición" : "Editar / revisar"}</Button>}
        {!editing && data.record.status === "READY" && data.validation.length === 0 && <Button disabled={busy} onClick={() => create.mutate({ importTourId, previewToken: data.previewToken })}>{create.isPending ? "Creando…" : "Crear borrador revisado"}</Button>}
        {data.record.createdTourId && <p className="text-sm">DRAFT creado · ID {data.record.createdTourId}</p>}
      </div>
    </div>}
  </DialogContent></Dialog>;
}
