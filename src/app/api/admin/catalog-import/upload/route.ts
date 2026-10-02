import { after, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/lib/auth";
import { db } from "@/server/lib/db";
import { assertCatalogImportGrant, isCatalogImportEnabled } from "@/server/catalog-import/access";
import { allowedDocumentUrl, assertPdf, MAX_PDF_BYTES } from "@/server/catalog-import/documents";
import { claimCatalogJob, runCatalogJob } from "@/server/catalog-import/jobs";
import { checkRateLimit } from "@/server/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;
const bodySchema = z.object({ fileUrl: z.string().url().max(2000), filename: z.string().trim().min(1).max(255) });
const retrySchema = z.object({ importId: z.string().cuid() });

export async function POST(request: Request) {
  if (!isCatalogImportEnabled()) return NextResponse.json({ error: "Importador deshabilitado." }, { status: 404 });
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true, isActive: true } });
  if (!user?.isActive || user.role !== "DEVELOPER") return NextResponse.json({ error: "Sin permisos." }, { status: 403 });
  try { await assertCatalogImportGrant(user.id); } catch { return NextResponse.json({ error: "Autoriza nuevamente la sesión con el código privado." }, { status: 401 }); }
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  if (!checkRateLimit(`catalog-upload:${user.id}`, { maxRequests: 10, windowSeconds: 900 }).allowed) return NextResponse.json({ error: "Demasiados documentos. Espera 15 minutos." }, { status: 429 });

  try {
    let importId: string;
    let pdf: Buffer | undefined;
    if ((request.headers.get("content-type") ?? "").includes("application/json")) {
      const raw = await request.json();
      const retry = retrySchema.safeParse(raw);
      if (retry.success) {
        const record = await db.catalogImport.findUnique({ where: { id: retry.data.importId } });
        if (!record || record.createdById !== user.id) return NextResponse.json({ error: "Importación no encontrada." }, { status: 404 });
        if (record.attempts >= 3) return NextResponse.json({ error: "Se alcanzó el límite de tres intentos." }, { status: 409 });
        importId = record.id;
      } else {
        const body = bodySchema.parse(raw);
        if (!allowedDocumentUrl(body.fileUrl) || !body.filename.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "La URL del PDF almacenado no es válida." }, { status: 400 });
        const pending = await db.catalogImport.count({ where: { createdById: user.id, status: { in: ["UPLOADED", "PROCESSING"] } } });
        if (pending >= 5) return NextResponse.json({ error: "Máximo cinco documentos pendientes." }, { status: 429 });
        const record = await db.catalogImport.create({ data: { filename: body.filename, sourceUrl: body.fileUrl, createdById: user.id, status: "UPLOADED" } });
        importId = record.id;
      }
    } else {
      const form = await request.formData(), file = form.get("file");
      if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".pdf") || file.type !== "application/pdf") return NextResponse.json({ error: "Adjunta un PDF válido." }, { status: 400 });
      if (file.size > MAX_PDF_BYTES) return NextResponse.json({ error: "El PDF no puede superar 5 MB." }, { status: 413 });
      pdf = Buffer.from(await file.arrayBuffer()); assertPdf(pdf);
      const record = await db.catalogImport.create({ data: { filename: file.name, createdById: user.id, status: "UPLOADED" } });
      importId = record.id;
    }
    const claimed = await claimCatalogJob(importId);
    if (claimed) after(async () => { await runCatalogJob(importId, pdf); });
    return NextResponse.json({ importId, status: claimed ? "PROCESSING" : "UPLOADED" }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo iniciar la importación. Comprueba el PDF y la configuración." }, { status: 422 });
  }
}
