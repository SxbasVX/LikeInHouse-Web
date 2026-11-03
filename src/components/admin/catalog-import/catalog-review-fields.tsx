"use client";

import { useState, type ReactNode } from "react";
import { AlertCircle, ArrowRight, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { publishedPrice, type PriceAdjustment } from "@/server/catalog-import/pricing";
import { formatItineraryTime } from "@/server/catalog-import/editorial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { catalogTourCandidateSchema, type CatalogTourCandidate } from "@/server/catalog-import/schemas";
import { MAX_CATEGORIES_PER_TOUR, joinCategories, splitCategories } from "@/lib/tour-categories";

export type Draft = CatalogTourCandidate;
export interface SectionProps {
  draft: Draft;
  update: (change: (draft: Draft) => Draft) => void;
  issuesFor: (field: string) => string[];
  readOnly: boolean;
}

const set = <K extends keyof Draft>(update: SectionProps["update"], key: K, value: Draft[K]) => update((d) => ({ ...d, [key]: value }));
const orNull = (value: string) => (value.trim() ? value : null);
const lines = (value: string) => value.split("\n").map((v) => v.trim()).filter(Boolean);

function Field({ label, issues = [], counter, children, className }: { label: ReactNode; issues?: string[]; counter?: { value: number; max: number }; children: ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}>
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs font-medium text-foreground/80">{label}</span>
      {counter && <span className={cn("text-[11px] tabular-nums", counter.value > counter.max ? "font-semibold text-red-700" : "text-muted-foreground")}>{counter.value}/{counter.max}</span>}
    </div>
    <div className={cn(issues.length > 0 && "rounded-md ring-2 ring-amber-300 ring-offset-1")}>{children}</div>
    {issues.slice(0, 2).map((reason, i) => <p key={i} className="flex gap-1 text-[11px] text-amber-800"><AlertCircle className="mt-px h-3 w-3 shrink-0" />{reason}</p>)}
  </div>;
}

function Text({ label, value, onChange, multiline, rows = 3, max, issues, readOnly, placeholder }: {
  label: ReactNode; value: string | null | undefined; onChange: (value: string | null) => void; multiline?: boolean; rows?: number; max?: number; issues?: string[]; readOnly: boolean; placeholder?: string;
}) {
  const text = value ?? "";
  return <Field label={label} issues={issues} counter={max ? { value: text.length, max } : undefined}>
    {multiline ? <Textarea rows={rows} value={text} readOnly={readOnly} placeholder={placeholder} onChange={(e) => onChange(orNull(e.target.value))} />
      : <Input value={text} readOnly={readOnly} placeholder={placeholder} onChange={(e) => onChange(orNull(e.target.value))} />}
  </Field>;
}

type BilingualKey = "name" | "shortDesc" | "longDesc" | "metaTitle" | "metaDesc";
function Bilingual({ base, label, props, multiline, rows, max }: { base: BilingualKey; label: string; props: SectionProps; multiline?: boolean; rows?: number; max?: number }) {
  const { draft, update, issuesFor, readOnly } = props;
  return <div className="grid gap-3 sm:grid-cols-2">{(["Es", "En"] as const).map((locale) => {
    const key = `${base}${locale}` as const;
    return <Text key={key} label={<>{label} <span className="rounded bg-muted px-1 text-[10px] font-semibold">{locale.toUpperCase()}</span></>}
      value={draft[key]} onChange={(v) => set(update, key, v)} multiline={multiline} rows={rows} max={max} issues={issuesFor(key)} readOnly={readOnly} />;
  })}</div>;
}

function Card({ title, description, children, action }: { title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="space-y-4 rounded-xl border bg-white p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3"><div><h3 className="font-medium">{title}</h3>{description && <p className="text-xs text-muted-foreground">{description}</p>}</div>{action}</div>
    {children}
  </section>;
}

const selectClass = "block h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60";

export function GeneralSection(props: SectionProps & { destinations: string[]; categories: string[] }) {
  const { draft, update, issuesFor, readOnly, destinations, categories } = props;
  const selected = splitCategories(draft.category);
  return <div className="space-y-4">
    <Card title="Identidad del tour">
      <Bilingual base="name" label="Nombre" props={props} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Text label="Slug (URL)" value={draft.slug} onChange={(v) => set(update, "slug", v)} issues={issuesFor("slug")} readOnly={readOnly} placeholder="city-tour-cusco" />
        <Field label="Destino" issues={issuesFor("destination")}>
          <select className={selectClass} disabled={readOnly} value={draft.destination ?? ""} onChange={(e) => set(update, "destination", orNull(e.target.value))}>
            <option value="">Elegir ciudad</option>
            {draft.destination && !destinations.includes(draft.destination) && <option value={draft.destination}>{draft.destination} (fuera de la lista)</option>}
            {destinations.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Dificultad" issues={issuesFor("difficulty")}>
          <select className={selectClass} disabled={readOnly} value={draft.difficulty ?? ""} onChange={(e) => set(update, "difficulty", (e.target.value || null) as Draft["difficulty"])}>
            <option value="">Sin indicar</option><option value="EASY">Fácil</option><option value="MODERATE">Moderada</option><option value="CHALLENGING">Exigente</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">{(["durationDays", "durationNights", "durationHours"] as const).map((key) =>
        <Field key={key} label={{ durationDays: "Días", durationNights: "Noches", durationHours: "Horas" }[key]} issues={issuesFor(key)}>
          <Input type="number" min={0} readOnly={readOnly} value={draft[key] ?? ""} onChange={(e) => set(update, key, e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value))))} />
        </Field>)}</div>
      <Field label={`Categorías (máximo ${MAX_CATEGORIES_PER_TOUR})`} issues={issuesFor("category")}>
        <div className="flex flex-wrap gap-1.5 p-0.5">{categories.map((cat) => {
          const on = selected.includes(cat);
          return <button key={cat} type="button" role="checkbox" aria-checked={on} disabled={readOnly}
            onClick={() => { const current = selected.filter((x) => categories.includes(x)); const next = on ? current.filter((x) => x !== cat) : [...current, cat].slice(0, MAX_CATEGORIES_PER_TOUR); set(update, "category", next.length ? joinCategories(next, categories) : null); }}
            className={cn("rounded-full border px-3 py-1 text-xs transition", on ? "border-brand-teal bg-brand-teal text-white" : "hover:bg-muted")}>{cat}</button>;
        })}</div>
        {draft.category && !selected.every((c) => categories.includes(c)) && <p className="text-[11px] text-amber-800">Categoría propuesta fuera de la lista: «{draft.category}». Elige las oficiales.</p>}
      </Field>
    </Card>
    <Card title="Descripciones" description="La corta aparece en tarjetas y buscadores; la completa en la página del tour.">
      <Bilingual base="shortDesc" label="Descripción corta" props={props} multiline rows={3} max={160} />
      <Bilingual base="longDesc" label="Descripción completa" props={props} multiline rows={9} />
    </Card>
    {Object.keys(draft.provenance ?? {}).length > 0 && <details className="rounded-xl border bg-white p-4 text-sm">
      <summary className="cursor-pointer font-medium">De dónde sale cada dato</summary>
      <ul className="mt-3 space-y-2">{Object.entries(draft.provenance ?? {}).map(([key, proof]) => <li key={key} className="rounded-lg bg-muted/40 p-2.5 text-xs">
        <span className="font-medium">{key}</span> · {{ document: "PDF", derived: "calculado del PDF", inferred: "deducido", suggested: "sugerencia de Claude", manual: "confirmado por ti" }[proof.source]}
        {proof.sourcePages.length > 0 && ` · pág. ${proof.sourcePages.join(", ")}`}
        {proof.evidence && <p className="mt-1 text-muted-foreground">{proof.evidence}</p>}
      </li>)}</ul>
    </details>}
  </div>;
}

const money = (currency: string, value: number) => `${currency === "PEN" ? "S/" : "US$"} ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function PriceBreakdown({ price, adjustment }: { price: Draft["prices"][number]; adjustment: PriceAdjustment | undefined }) {
  const result = publishedPrice(price, adjustment);
  if (!result || !adjustment || price.amount === null) return null;
  return <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-brand-teal/5 px-3 py-2 text-xs">
    <span>PDF: <strong>{money(price.currency!, price.amount)}</strong></span>
    {price.currency === "PEN" && <><ArrowRight className="h-3 w-3 text-muted-foreground" /><span>al TC: <strong>{money("USD", result.usdAtRate)}</strong></span></>}
    <ArrowRight className="h-3 w-3 text-muted-foreground" />
    <span className="text-brand-darkTeal">publicado (+{adjustment.markupPercent} %): <strong className="text-sm">{money("USD", result.final)}</strong></span>
  </div>;
}

export function PricesSection({ draft, update, issuesFor, readOnly, onRefreshRate, refreshingRate, refreshHint }: SectionProps & { onRefreshRate?: () => void; refreshingRate?: boolean; refreshHint?: string }) {
  const setPrice = (index: number, change: Partial<Draft["prices"][number]>) => set(update, "prices", draft.prices.map((p, i) => (i === index ? { ...p, ...change } : p)));
  const num = (value: string) => (value === "" ? null : Number(value));
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const adjustment = draft.priceAdjustment;
  const lowest = Math.min(...draft.prices.map((p) => publishedPrice(p, adjustment)?.final ?? Infinity));
  return <div className="space-y-4">
    <Card title="Cómo se publica" description="Los tours con muchas tarifas (hotel, habitación, temporada) se publican como informativos: sin reserva online, con «Adquiérelo desde» y el botón de cotizar.">
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Cómo se publica">
        {([[false, "Comprable", "Reserva y pago online con estas tarifas."], [true, "Informativo", "«Adquiérelo desde» la tarifa más baja + cotizar."]] as const).map(([value, title, hint]) => {
          const on = Boolean(draft.informational) === value;
          return <button key={title} type="button" role="radio" aria-checked={on} disabled={readOnly} onClick={() => set(update, "informational", value)}
            className={cn("rounded-lg border p-3 text-left transition", on ? "border-brand-teal bg-brand-teal/10 ring-1 ring-brand-teal" : "hover:bg-muted/40")}>
            <span className="block text-sm font-medium">{title}</span><span className="text-xs text-muted-foreground">{hint}</span>
          </button>;
        })}
      </div>
      {draft.informational && isFinite(lowest) && <p className="rounded-lg bg-brand-orange/10 px-3 py-2 text-sm">
        En la web: <span className="font-semibold text-brand-orange">Adquiérelo desde US$ {lowest.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> por persona</p>}
    </Card>
    <Card title="Tipo de cambio y margen" description="Los precios se publican en USD: los soles se convierten al tipo de cambio SUNAT (venta) y a todo se le suma el margen."
      action={onRefreshRate && <Button size="sm" variant="outline" disabled={refreshingRate || Boolean(refreshHint)} title={refreshHint} onClick={onRefreshRate}>
        {refreshingRate ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}Actualizar tipo de cambio</Button>}>
      {adjustment ? <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>TC SUNAT (venta): <strong>S/ {adjustment.penPerUsd.toFixed(3)}</strong> por US$ 1</span>
        <span>Fecha: <strong>{adjustment.rateDate}</strong>{adjustment.rateSource === "fallback" && <span className="ml-1 text-amber-700">(de emergencia: SUNAT no respondió)</span>}</span>
        <span>Margen: <strong>+{adjustment.markupPercent} %</strong></span>
      </div> : <p className="text-sm text-amber-800">Sin tipo de cambio todavía: pulsa «Actualizar tipo de cambio».</p>}
      {issuesFor("priceAdjustment").map((reason, i) => <p key={i} className="flex gap-1 text-[11px] text-amber-800"><AlertCircle className="mt-px h-3 w-3 shrink-0" />{reason}</p>)}
      {refreshHint && <p className="text-[11px] text-muted-foreground">{refreshHint}</p>}
    </Card>
    <Card title="Tarifas" description="Tarifas por persona tal como figuran en el PDF. Si había muchas combinaciones, aquí va la opción estándar y el resto queda en Condiciones › «Otras tarifas»."
      action={!readOnly && <Button size="sm" variant="outline" onClick={() => set(update, "prices", [...draft.prices, { labelEs: null, labelEn: null, ageMin: null, ageMax: null, amount: null, currency: "USD", priceType: "per_person", source: "document" }])}><Plus className="mr-1 h-4 w-4" />Tarifa</Button>}>
      {!draft.prices.length && <p className="text-sm text-muted-foreground">El PDF no indica tarifas.</p>}
      {draft.prices.map((price, index) => <div key={index} className={cn("space-y-3 rounded-lg border p-3", issuesFor(`prices.${index}`).length > 0 && "border-amber-300 bg-amber-50/40")}>
        <div className="flex items-center justify-between"><span className="text-sm font-medium">Tarifa {index + 1}{price.source === "derived" && <span className="ml-2 text-xs font-normal text-muted-foreground">calculada: {price.calculation?.expression}</span>}</span>
          {!readOnly && <button type="button" aria-label="Quitar tarifa" onClick={() => set(update, "prices", draft.prices.filter((_, i) => i !== index))} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-700"><Trash2 className="h-4 w-4" /></button>}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Text label="Etiqueta ES" value={price.labelEs} onChange={(v) => setPrice(index, { labelEs: v })} readOnly={readOnly} placeholder="Adulto" />
          <Text label="Etiqueta EN" value={price.labelEn} onChange={(v) => setPrice(index, { labelEn: v })} readOnly={readOnly} placeholder="Adult" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Field label="Importe"><Input type="number" min={0} step="0.01" readOnly={readOnly} value={price.amount ?? ""} onChange={(e) => setPrice(index, { amount: num(e.target.value) })} /></Field>
          <Field label="Moneda del PDF"><select className={selectClass} disabled={readOnly} value={price.currency ?? ""} onChange={(e) => setPrice(index, { currency: orNull(e.target.value) })}>
            {price.currency && !["USD", "PEN"].includes(price.currency) && <option value={price.currency}>{price.currency} (no soportada)</option>}
            <option value="">Sin indicar</option><option value="PEN">Soles (S/)</option><option value="USD">Dólares (US$)</option></select></Field>
          <Field label="Unidad"><select className={selectClass} disabled={readOnly} value={price.priceType ?? "unknown"} onChange={(e) => setPrice(index, { priceType: e.target.value as "per_person" })}>
            <option value="per_person">Por persona</option><option value="per_group">Por grupo</option><option value="unknown">Sin definir</option></select></Field>
          <Field label="Edad mín."><Input type="number" min={0} readOnly={readOnly} value={price.ageMin ?? ""} onChange={(e) => setPrice(index, { ageMin: num(e.target.value) })} /></Field>
          <Field label="Edad máx."><Input type="number" min={0} readOnly={readOnly} value={price.ageMax ?? ""} onChange={(e) => setPrice(index, { ageMax: num(e.target.value) })} /></Field>
        </div>
        <PriceBreakdown price={price} adjustment={adjustment} />
        {issuesFor(`prices.${index}`).map((reason, i) => <p key={i} className="flex gap-1 text-[11px] text-amber-800"><AlertCircle className="mt-px h-3 w-3 shrink-0" />{reason}</p>)}
      </div>)}
    </Card>
    <Card title="Salidas y horarios" description="Se editan en «Avanzado». Las fechas y cupos se configuran en Tours después de crear el borrador.">
      {draft.schedule ? <div className="space-y-1 text-sm">
        <p><span className="font-medium">{{ daily: "Todos los días", selected_days: "Días seleccionados", on_request: "Previa solicitud", unknown: "Frecuencia sin definir" }[draft.schedule.frequency]}</span>
          {draft.schedule.days.length > 0 && ` · ${draft.schedule.days.map((d) => days[d]).join(", ")}`}</p>
        {draft.schedule.times.length > 0 && <p>Horas: {draft.schedule.times.join(", ")}</p>}
        {draft.schedule.dates.length > 0 && <p>Fechas: {draft.schedule.dates.join(", ")}</p>}
        {(draft.schedule.notesEs || draft.schedule.notesEn) && <p className="text-muted-foreground">{draft.schedule.notesEs} {draft.schedule.notesEn && `/ ${draft.schedule.notesEn}`}</p>}
      </div> : <p className="text-sm text-muted-foreground">El PDF no indica horarios de salida.</p>}
    </Card>
  </div>;
}

export function ItinerarySection({ draft, update, issuesFor, readOnly }: SectionProps) {
  type Day = Draft["itinerary"][number]; type Item = NonNullable<Day["items"]>[number];
  const setDay = (d: number, change: Partial<Day>) => set(update, "itinerary", draft.itinerary.map((day, i) => (i === d ? { ...day, ...change } : day)));
  const setItem = (d: number, it: number, change: Partial<Item>) => setDay(d, { items: draft.itinerary[d].items?.map((item, i) => (i === it ? { ...item, ...change } : item)) });
  if (!draft.itinerary.length) return <Card title="Itinerario"><p className="text-sm text-muted-foreground">El PDF no incluye itinerario. Puedes agregarlo en «Avanzado».</p></Card>;
  return <div className="space-y-4">{draft.itinerary.map((day, d) => <Card key={d} title={`Día ${day.dayNumber}`}
    action={!readOnly && <Button size="sm" variant="outline" onClick={() => setDay(d, { items: [...(day.items ?? []), { time: null, labelEs: null, labelEn: null, titleEs: null, titleEn: null, descriptionEs: null, descriptionEn: null }] })}><Plus className="mr-1 h-4 w-4" />Actividad</Button>}>
    <div className="grid gap-3 sm:grid-cols-2">
      <Text label="Título del día ES" value={day.titleEs} onChange={(v) => setDay(d, { titleEs: v })} readOnly={readOnly} issues={issuesFor(`itinerary.${d}`)} />
      <Text label="Título del día EN" value={day.titleEn} onChange={(v) => setDay(d, { titleEn: v })} readOnly={readOnly} />
    </div>
    <ol className="space-y-3">{(day.items ?? []).map((item, it) => <li key={it} className={cn("space-y-3 rounded-lg border-l-4 border-brand-teal/40 bg-muted/20 p-3", issuesFor(`itinerary.${d}.items.${it}`).length > 0 && "border-amber-400 bg-amber-50/40")}>
      <div className="flex items-center gap-2">
        <Input aria-label="Hora" placeholder="HH:mm" className="w-28" readOnly={readOnly} value={item.time ?? ""} onChange={(e) => setItem(d, it, { time: orNull(e.target.value) })} />
        {!item.time && <>
          <Input aria-label="Momento o lugar ES" placeholder="Tarde / Uros" className="w-32" readOnly={readOnly} value={item.labelEs ?? ""} onChange={(e) => setItem(d, it, { labelEs: orNull(e.target.value) })} />
          <Input aria-label="Momento o lugar EN" placeholder="Afternoon" className="w-32" readOnly={readOnly} value={item.labelEn ?? ""} onChange={(e) => setItem(d, it, { labelEn: orNull(e.target.value) })} />
        </>}
        <span className="flex-1 truncate text-xs text-muted-foreground" title="Así se verá en la web">
          Se verá: <strong className="text-foreground">{[item.time ? formatItineraryTime(item.time, "Es") : item.labelEs, item.titleEs].filter(Boolean).join(" | ") || `Actividad ${it + 1}`}</strong>
        </span>
        {!readOnly && <button type="button" aria-label="Quitar actividad" onClick={() => setDay(d, { items: day.items?.filter((_, i) => i !== it) })} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-700"><Trash2 className="h-4 w-4" /></button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Text label="Título ES" value={item.titleEs} onChange={(v) => setItem(d, it, { titleEs: v })} readOnly={readOnly} />
        <Text label="Título EN" value={item.titleEn} onChange={(v) => setItem(d, it, { titleEn: v })} readOnly={readOnly} />
        <Text label="Descripción ES" value={item.descriptionEs} onChange={(v) => setItem(d, it, { descriptionEs: v })} multiline readOnly={readOnly} />
        <Text label="Descripción EN" value={item.descriptionEn} onChange={(v) => setItem(d, it, { descriptionEn: v })} multiline readOnly={readOnly} />
      </div>
      {issuesFor(`itinerary.${d}.items.${it}`).map((reason, i) => <p key={i} className="flex gap-1 text-[11px] text-amber-800"><AlertCircle className="mt-px h-3 w-3 shrink-0" />{reason}</p>)}
    </li>)}</ol>
  </Card>)}</div>;
}

type ListKey = "includesEs" | "includesEn" | "excludesEs" | "excludesEn" | "conditionsEs" | "conditionsEn" | "attractions";
function ListPair({ title, es, en, props }: { title: string; es: ListKey; en: ListKey; props: SectionProps }) {
  const { draft, update, issuesFor, readOnly } = props;
  return <div className="grid gap-3 sm:grid-cols-2">{[es, en].map((key, i) => <Field key={key} label={`${title} ${i ? "EN" : "ES"} · uno por línea`} issues={issuesFor(key)}>
    <Textarea rows={5} readOnly={readOnly} value={(draft[key] ?? []).join("\n")} onChange={(e) => set(update, key, lines(e.target.value))} />
  </Field>)}</div>;
}

export function ServicesSection(props: SectionProps) {
  const { draft, update, issuesFor, readOnly } = props;
  type Condition = NonNullable<Draft["conditions"]>[number];
  const setCondition = (index: number, change: Partial<Condition>) => set(update, "conditions", draft.conditions?.map((c, i) => (i === index ? { ...c, ...change } : c)));
  return <div className="space-y-4">
    <Card title="Qué incluye"><ListPair title="Incluye" es="includesEs" en="includesEn" props={props} /><ListPair title="No incluye" es="excludesEs" en="excludesEn" props={props} /></Card>
    <Card title="Condiciones" description="Políticas, edades y requisitos tal como figuran en el PDF.">
      {(draft.conditions ?? []).map((condition, index) => <div key={index} className={cn("grid gap-3 rounded-lg border p-3 sm:grid-cols-2", issuesFor(`conditions.${index}`).length > 0 && "border-amber-300 bg-amber-50/40")}>
        <Text label="Título ES" value={condition.titleEs} onChange={(v) => setCondition(index, { titleEs: v })} readOnly={readOnly} />
        <Text label="Título EN" value={condition.titleEn} onChange={(v) => setCondition(index, { titleEn: v })} readOnly={readOnly} />
        <Text label="Descripción ES" value={condition.descriptionEs} onChange={(v) => setCondition(index, { descriptionEs: v })} multiline readOnly={readOnly} />
        <Text label="Descripción EN" value={condition.descriptionEn} onChange={(v) => setCondition(index, { descriptionEn: v })} multiline readOnly={readOnly} />
      </div>)}
      <ListPair title="Otras condiciones" es="conditionsEs" en="conditionsEn" props={props} />
    </Card>
  </div>;
}

export function SeoSection(props: SectionProps) {
  const { draft, update, issuesFor, readOnly } = props;
  return <div className="space-y-4">
    <Card title="Buscadores (SEO)" description="Título hasta 60 caracteres y descripción hasta 160 para que Google no los corte.">
      <Bilingual base="metaTitle" label="Título SEO" props={props} max={60} />
      <Bilingual base="metaDesc" label="Descripción SEO" props={props} multiline max={160} />
    </Card>
    <Card title="Atractivos">
      <Field label="Uno por línea" issues={issuesFor("attractions")}><Textarea rows={4} readOnly={readOnly} value={(draft.attractions ?? []).join("\n")} onChange={(e) => set(update, "attractions", lines(e.target.value))} /></Field>
    </Card>
    <Card title="Imágenes sugeridas" description="Sube las fotos desde Tours después de crear el borrador.">
      {draft.imageSuggestions?.length ? <ol className="space-y-2">{draft.imageSuggestions.map((s, i) => <li key={i} className="rounded-lg bg-muted/30 p-3 text-sm">
        <span className="font-medium">{s.order}. {s.subject}</span>{s.recommendedForCover && <span className="ml-2 rounded-full bg-brand-teal/15 px-2 py-0.5 text-[11px] font-medium text-brand-darkTeal">Portada</span>}
        <p className="text-xs text-muted-foreground">{s.reason}</p>
      </li>)}</ol> : <p className="text-sm text-muted-foreground">Sin sugerencias.</p>}
    </Card>
  </div>;
}

export function AdvancedSection({ draft, update, readOnly }: SectionProps) {
  const [raw, setRaw] = useState(() => JSON.stringify(draft, null, 2));
  const [error, setError] = useState<string | null>(null);
  function apply() {
    try {
      const parsed = catalogTourCandidateSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) { setError(parsed.error.issues.slice(0, 6).map((i) => `${i.path.join(".")}: ${i.message}`).join("\n")); return; }
      setError(null); update(() => parsed.data);
    } catch { setError("El texto no es JSON válido."); }
  }
  return <Card title="Estructura completa" description="Para horarios, salidas o cualquier dato sin formulario. Se aplica al borrador; nada se publica hasta aprobar.">
    <Textarea rows={22} className="font-mono text-xs" readOnly={readOnly} value={raw} onChange={(e) => setRaw(e.target.value)} />
    {error && <pre className="whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-xs text-red-800">{error}</pre>}
    {!readOnly && <div className="flex gap-2"><Button size="sm" onClick={apply}>Aplicar al borrador</Button><Button size="sm" variant="ghost" onClick={() => { setRaw(JSON.stringify(draft, null, 2)); setError(null); }}>Recargar desde el formulario</Button></div>}
  </Card>;
}
