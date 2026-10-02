"use client";

import { useEffect, useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { CatalogPreview } from "./catalog-preview";

const statusLabels: Record<string, string> = { NEEDS_REVIEW: "DATA_REVIEW", DUPLICATE: "DUPLICATE_REVIEW" };
export const displayStatus = (status: string) => statusLabels[status] ?? status;

export function CatalogImportAccess() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [secret, setSecret] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [remoteFiles, setRemoteFiles] = useState<Array<{ url: string; filename: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const status = trpc.catalogImport.status.useQuery(undefined, { retry: false });
  useEffect(() => { if (status.data) setAuthorized(true); }, [status.data]);
  const access = trpc.catalogImport.access.useMutation({
    onSuccess: async () => { setSecret(""); setAuthorized(true); await utils.catalogImport.status.invalidate(); },
    onError: (error) => { setSecret(""); toast({ title: "Acceso denegado", description: error.message, variant: "destructive" }); },
  });
  const logout = trpc.catalogImport.logout.useMutation({ onSuccess: () => { setAuthorized(false); utils.catalogImport.history.reset(); utils.catalogImport.preview.reset(); utils.catalogImport.status.reset(); } });
  const history = trpc.catalogImport.history.useQuery({ limit: 20 }, {
    enabled: authorized, retry: false,
    refetchInterval: (query) => query.state.data?.some((job) => ["UPLOADED", "PROCESSING"].includes(job.status)) ? 3000 : false,
  });
  useEffect(() => { if (history.error?.data?.code === "UNAUTHORIZED") { setAuthorized(false); setSelected(null); } }, [history.error]);
  useEffect(() => {
    if (busy || !history.data || !authorized) return;
    const active = history.data.filter((j) => j.status === "PROCESSING").length;
    const queued = history.data.find((j) => j.status === "UPLOADED" && j.createdById === status.data?.userId && j.attempts < 3);
    if (active < 2 && queued) void resume(queued.id);
    // The history refresh advances queued documents as processing slots become free.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.data, authorized, status.data?.userId]);

  async function send(body: FormData | object) {
    const response = await fetch("/api/admin/catalog-import/upload", {
      method: "POST", ...(body instanceof FormData ? { body } : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
    const data = await response.json().catch(() => ({ error: "El servidor rechazó la carga. Usa la carga directa de PDFs." }));
    if (!response.ok) throw new Error(data.error ?? "No se pudo iniciar la importación.");
    return data;
  }
  async function start() {
    if (files.length + remoteFiles.length > 5) { toast({ title: "Selecciona hasta cinco PDFs", variant: "destructive" }); return; }
    setBusy(true);
    let failed = 0;
    const failedLocal: File[] = [], failedRemote: typeof remoteFiles = [];
    for (const file of files) {
      try {
        const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        if (!cloud) throw new Error("La carga directa no está configurada.");
        const form = new FormData(); form.append("file", file);
        form.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "agencia_tours_dev");
        form.append("folder", "likesinhouse/catalog-imports");
        const uploaded = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/raw/upload`, { method: "POST", body: form });
        const data = await uploaded.json();
        if (!uploaded.ok || !data.secure_url) throw new Error("No se pudo cargar el PDF. Comprueba el preset de Cloudinary.");
        await send({ fileUrl: data.secure_url, filename: file.name });
      }
      catch (error) { failed++; failedLocal.push(file); toast({ title: file.name, description: String(error), variant: "destructive" }); }
    }
    for (const file of remoteFiles) {
      try { await send({ fileUrl: file.url, filename: file.filename }); }
      catch (error) { failed++; failedRemote.push(file); toast({ title: file.filename, description: String(error), variant: "destructive" }); }
    }
    setFiles(failedLocal); setRemoteFiles(failedRemote); setBusy(false);
    await history.refetch();
    if (!failed) toast({ title: "Importación iniciada", description: "Cada documento se procesa de forma independiente. Los resultados aparecerán aquí." });
  }
  async function resume(importId: string) {
    setBusy(true);
    try { await send({ importId }); await history.refetch(); }
    catch (error) { toast({ title: "No se pudo iniciar", description: String(error), variant: "destructive" }); }
    finally { setBusy(false); }
  }
  function pick(incoming: File[]) {
    const valid = incoming.filter((file) => file.name.toLowerCase().endsWith(".pdf") && file.size <= 20 * 1024 * 1024);
    if (valid.length !== incoming.length) toast({ title: "Solo PDFs de hasta 20 MB", variant: "destructive" });
    setFiles((current) => [...current, ...valid].slice(0, Math.max(0, 5 - remoteFiles.length)));
  }

  if (!authorized) return <Card className="max-w-md"><CardHeader><CardTitle>Verificación adicional</CardTitle></CardHeader><CardContent>
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); access.mutate({ secret }); }}>
      <label className="block space-y-2"><span>Código privado</span><Input type="password" autoComplete="off" value={secret} onChange={(e) => setSecret(e.target.value)} required maxLength={256} /></label>
      <Button disabled={access.isPending || !secret}>{access.isPending ? "Verificando…" : "Ingresar"}</Button>
    </form>
  </CardContent></Card>;

  const jobs = history.data ?? [];
  const counts = jobs.flatMap((job) => job.tours).reduce<Record<string, number>>((acc, tour) => { const s = displayStatus(tour.status); acc[s] = (acc[s] ?? 0) + 1; return acc; }, {});
  return <div className="space-y-6">
    <div className="flex justify-between gap-3"><p className="text-sm text-muted-foreground">{status.data?.providers.map((p) => `${p.name} (${p.model})`).join(" · ") || "Configura un proveedor IA antes de analizar."}</p><Button variant="outline" onClick={() => logout.mutate()}>Cerrar acceso</Button></div>
    <Card><CardHeader><CardTitle>Seleccionar catálogos PDF</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="rounded-lg border-2 border-dashed p-6 text-center" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (!busy) pick(Array.from(e.dataTransfer.files)); }}>
        <p className="mb-3 text-sm">Arrastra hasta cinco PDFs. Máximo 20 MB por documento.</p>
        <Input aria-label="Seleccionar PDFs" type="file" multiple accept="application/pdf,.pdf" disabled={busy} onChange={(e) => { pick(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        <p className="mt-2 text-xs text-muted-foreground">Los PDFs se cargan directamente para admitir archivos grandes.</p>
      </div>
      <CldUploadWidget uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "agencia_tours_dev"}
        options={{ maxFiles: 5, multiple: true, sources: ["local"], clientAllowedFormats: ["pdf"], maxFileSize: 20 * 1024 * 1024, resourceType: "raw", folder: "likesinhouse/catalog-imports" }}
        onSuccess={(result) => { const info = result.info as { secure_url?: string; original_filename?: string }; if (info.secure_url) setRemoteFiles((current) => [...current, { url: info.secure_url!, filename: `${(info.original_filename ?? "catalogo").replace(/\.pdf$/i, "")}.pdf` }].slice(0, Math.max(0, 5 - files.length))); }}>
        {({ open }) => <Button variant="outline" disabled={busy} onClick={() => open()}>Carga directa de PDFs</Button>}
      </CldUploadWidget>
      {[...files.map((f) => f.name), ...remoteFiles.map((f) => f.filename)].map((name, i) => <div key={`${name}-${i}`} className="flex items-center justify-between text-sm"><span>{name}</span><Button size="sm" variant="ghost" disabled={busy} onClick={() => { if (i < files.length) setFiles(files.filter((_, index) => index !== i)); else setRemoteFiles(remoteFiles.filter((_, index) => index !== i - files.length)); }}>Quitar</Button></div>)}
      <Button disabled={busy || !files.length && !remoteFiles.length} onClick={start}>{busy ? "Iniciando…" : "Analizar catálogos"}</Button>
    </CardContent></Card>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">{[["Documentos", jobs.length], ["Tours", jobs.reduce((n, j) => n + j.totalTours, 0)], ...["READY", "DUPLICATE_REVIEW", "DATA_REVIEW", "BLOCKED", "DRAFT_CREATED"].map((s) => [s, counts[s] ?? 0])].map(([label, count]) => <div key={String(label)} className="rounded-lg border p-3"><strong className="text-xl">{count}</strong><p className="break-words text-xs text-muted-foreground">{label}</p></div>)}</div>
    {history.isLoading && <p>Cargando historial…</p>}
    {history.error && <p role="alert" className="text-destructive">{history.error.message}</p>}
    {jobs.map((job) => <Card key={job.id}><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-lg">{job.filename}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{job.status} · {job.totalTours} tours · intento {job.attempts}/3</p></div>
      {["UPLOADED", "FAILED", "PARTIAL"].includes(job.status) && job.attempts < 3 && <Button variant="outline" size="sm" disabled={busy} onClick={() => resume(job.id)}>{job.status === "UPLOADED" ? "Procesar" : "Reanudar"}</Button>}
    </div></CardHeader><CardContent className="space-y-4">
      {job.lastError && <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{job.lastError}</p>}
      {job.status === "PROCESSING" && <p className="text-sm" role="status">Analizando y validando. Puedes cerrar esta página y volver al historial.</p>}
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b">{["Tour", "Fuente", "Estado", "Coincidencia", "Incidencias", "Acción"].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>
        {job.tours.map((tour) => { const raw = tour.tourDataJson as Record<string, unknown>; return <tr key={tour.id} className="border-b"><td className="p-2">{String(raw?.nameEs ?? "Candidato sin nombre")}</td><td className="p-2 text-xs">{tour.sourceDocument}<br />Páginas {tour.sourcePages.join(", ") || "por revisar"}</td><td className="p-2 text-xs">{displayStatus(tour.status)}</td><td className="p-2">{tour.confidence == null ? "—" : `${Math.round(Number(tour.confidence) * 100)}%`}</td><td className="p-2">{tour.issues.length}</td><td className="p-2"><Button size="sm" variant="outline" onClick={() => setSelected(tour.id)}>Ver / revisar</Button></td></tr>; })}
      </tbody></table></div>
      {job.operations.length > 0 && <details><summary className="cursor-pointer text-sm">Uso de IA y operaciones</summary><div className="mt-2 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr>{["Proveedor / modelo", "Operación", "Entrada", "Salida", "Total", "Tiempo", "Fallback", "Costo estimado USD"].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{job.operations.map((op, i) => <tr key={i}><td className="p-2">{op.provider} / {op.model}</td><td className="p-2">{op.operation} · {op.success ? "OK" : op.error || "Error"}</td><td className="p-2">{op.inputTokens ?? "—"}</td><td className="p-2">{op.outputTokens ?? "—"}</td><td className="p-2">{op.inputTokens != null && op.outputTokens != null ? op.inputTokens + op.outputTokens : "—"}</td><td className="p-2">{op.latencyMs == null ? "—" : `${(op.latencyMs / 1000).toFixed(1)} s`}</td><td className="p-2">{op.fallbackUsed ? "Sí" : "No"}</td><td className="p-2">{op.estimatedCost == null ? "Sin tarifa configurada" : Number(op.estimatedCost).toFixed(6)}</td></tr>)}</tbody></table></div></details>}
    </CardContent></Card>)}
    {!history.isLoading && !jobs.length && <p className="text-sm text-muted-foreground">Todavía no hay importaciones.</p>}
    {selected && <CatalogPreview importTourId={selected} onClose={() => setSelected(null)} onChanged={() => { void history.refetch(); }} />}
  </div>;
}
