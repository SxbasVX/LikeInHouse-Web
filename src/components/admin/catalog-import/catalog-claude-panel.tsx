"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Source = { url: string; title: string | null };
type Answer = { question: string; answer: string; sources: Source[] };

async function assist<T>(body: object): Promise<T> {
  const response = await fetch("/api/admin/catalog-import/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({ error: "El servidor no respondió a tiempo." }));
  if (!response.ok) throw new Error(data.error ?? "No se pudo consultar a Claude.");
  return data as T;
}

const SourceList = ({ sources }: { sources: Source[] }) => sources.length > 0 && <ul className="mt-2 space-y-1 text-xs">{sources.filter((s) => /^https?:\/\//i.test(s.url)).map((s) => <li key={s.url}><a className="text-brand-teal underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.title || s.url}</a></li>)}</ul>;

export function CatalogClaudePanel({ importTourId, canEnrich, onChanged }: { importTourId: string; canEnrich: boolean; onChanged: () => Promise<void> }) {
  const { toast } = useToast();
  const [instructions, setInstructions] = useState("");
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [working, setWorking] = useState<"enrich" | "ask" | null>(null);
  const [enrichSources, setEnrichSources] = useState<Source[]>([]);

  async function enrich() {
    setWorking("enrich");
    try {
      const result = await assist<{ changes: Array<{ field: string }>; sources: Source[] }>({ action: "enrich", importTourId, instructions: instructions || undefined });
      setEnrichSources(result.sources);
      toast(result.changes.length
        ? { title: `Claude propuso ${result.changes.length} cambios`, description: `Campos: ${result.changes.map((c) => c.field).join(", ")}. Revísalos en Incidencias y confírmalos en "Editar / revisar".` }
        : { title: "Claude no encontró mejoras", description: "El candidato quedó igual." });
      if (result.changes.length) await onChanged();
    } catch (e) { toast({ title: "Claude no pudo completar la propuesta", description: String(e instanceof Error ? e.message : e), variant: "destructive" }); }
    finally { setWorking(null); }
  }
  async function ask() {
    const asked = question.trim();
    setWorking("ask");
    try {
      const result = await assist<{ answer: string; sources: Source[] }>({ action: "ask", importTourId, question: asked });
      setAnswers((current) => [{ question: asked, ...result }, ...current]); setQuestion("");
    } catch (e) { toast({ title: "Claude no pudo responder", description: String(e instanceof Error ? e.message : e), variant: "destructive" }); }
    finally { setWorking(null); }
  }

  return <details className="rounded-md border border-brand-teal/30 p-3"><summary className="cursor-pointer font-medium">Asistente Claude</summary><div className="mt-3 space-y-5">
    {canEnrich && <div className="space-y-2">
      <h4 className="text-sm font-medium">Mejorar textos y completar con la web</h4>
      <p className="text-xs text-muted-foreground">Claude mejora la redacción ES/EN y busca en internet datos no críticos. Precios, horarios, duración y destino siempre se conservan del PDF. Cada cambio queda como sugerencia hasta que lo confirmes.</p>
      <Textarea rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={2000} placeholder="Indicaciones opcionales, p. ej. «enfatiza la gastronomía» o «completa los atractivos»." disabled={working !== null} />
      <Button size="sm" disabled={working !== null} onClick={enrich}>{working === "enrich" ? "Claude está trabajando… (puede tardar 1–3 min)" : "Mejorar y completar con Claude"}</Button>
      <SourceList sources={enrichSources} />
    </div>}
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Preguntar sobre este tour</h4>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (question.trim().length >= 3) void ask(); }}>
        <Input value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={2000} placeholder="¿La categoría es correcta? ¿Qué atractivos faltan?" disabled={working !== null} />
        <Button size="sm" type="submit" disabled={working !== null || question.trim().length < 3}>{working === "ask" ? "Pensando…" : "Preguntar"}</Button>
      </form>
      {answers.map((a, i) => <div key={i} className="rounded-md bg-muted/30 p-3 text-sm"><p className="font-medium">{a.question}</p><p className="mt-1 whitespace-pre-wrap">{a.answer}</p><SourceList sources={a.sources} /></div>)}
    </div>
  </div></details>;
}
