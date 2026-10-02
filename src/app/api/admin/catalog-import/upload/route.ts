import { NextResponse } from "next/server";
import { auth } from "@/server/lib/auth";
import { isCatalogImportEnabled } from "@/server/catalog-import/access";
import { verifyCatalogImportSecret } from "@/server/catalog-import/secret";
import { processCatalogPdf } from "@/server/catalog-import/service";

export const runtime = "nodejs";
export const maxDuration = 300;

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

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Debes adjuntar un PDF." }, { status: 400 });
  }
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Solo se permiten archivos PDF." }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "El PDF no puede superar 20 MB." }, { status: 413 });
  }

  try {
    const result = await processCatalogPdf(file.name, Buffer.from(await file.arrayBuffer()), session.user.id);
    return NextResponse.json({ import: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar el catálogo.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
