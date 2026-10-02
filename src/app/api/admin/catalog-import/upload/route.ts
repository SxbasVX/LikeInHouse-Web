import { NextResponse } from "next/server";
import { auth } from "@/server/lib/auth";
import { isCatalogImportEnabled } from "@/server/catalog-import/access";
import { verifyCatalogImportSecret } from "@/server/catalog-import/secret";
import { processCatalogPdf } from "@/server/catalog-import/service";

export const runtime = "nodejs";
export const maxDuration = 300;
const MAX_PDF_BYTES = 20 * 1024 * 1024;

function isAllowedCloudinaryUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "res.cloudinary.com" || url.hostname.endsWith(".cloudinary.com"));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isCatalogImportEnabled()) {
    return NextResponse.json({ error: "Importador deshabilitado." }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER") {
    return NextResponse.json({ error: "Sin permisos." }, { status: 403 });
  }

  const secret = request.headers.get("x-catalog-import-secret") ?? "";
  if (!verifyCatalogImportSecret(secret)) {
    return NextResponse.json({ error: "Código de acceso inválido." }, { status: 401 });
  }

  try {
    let filename: string;
    let pdf: Buffer;
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await request.json() as { fileUrl?: string; filename?: string };
      if (!body.fileUrl || !isAllowedCloudinaryUrl(body.fileUrl)) {
        return NextResponse.json({ error: "La URL del PDF no es válida." }, { status: 400 });
      }
      const response = await fetch(body.fileUrl);
      if (!response.ok) {
        return NextResponse.json({ error: "No se pudo descargar el PDF cargado." }, { status: 422 });
      }
      const length = Number(response.headers.get("content-length") ?? 0);
      if (length > MAX_PDF_BYTES) {
        return NextResponse.json({ error: "El PDF no puede superar 20 MB." }, { status: 413 });
      }
      filename = body.filename ?? "catalogo.pdf";
      pdf = Buffer.from(await response.arrayBuffer());
      if (!filename.toLowerCase().endsWith(".pdf") || pdf.subarray(0, 5).toString() !== "%PDF-") {
        return NextResponse.json({ error: "El archivo cargado no es un PDF válido." }, { status: 400 });
      }
    } else {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Debes adjuntar un PDF." }, { status: 400 });
      }
      if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json({ error: "Solo se permiten archivos PDF." }, { status: 400 });
      }
      if (file.size > MAX_PDF_BYTES) {
        return NextResponse.json({ error: "El PDF no puede superar 20 MB." }, { status: 413 });
      }
      filename = file.name;
      pdf = Buffer.from(await file.arrayBuffer());
    }

    if (pdf.length > MAX_PDF_BYTES) {
      return NextResponse.json({ error: "El PDF no puede superar 20 MB." }, { status: 413 });
    }
    const result = await processCatalogPdf(filename, pdf, session.user.id);
    return NextResponse.json({ import: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar el catálogo.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
