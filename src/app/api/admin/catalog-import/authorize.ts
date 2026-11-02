import { NextResponse } from "next/server";
import { auth } from "@/server/lib/auth";
import { db } from "@/server/lib/db";
import { assertCatalogImportGrant, isCatalogImportEnabled } from "@/server/catalog-import/access";

// Same checks as the tRPC importer procedures: active DEVELOPER, private-code grant and same-origin request.
export async function authorizeCatalogRequest(request: Request): Promise<{ userId: string } | NextResponse> {
  if (!isCatalogImportEnabled()) return NextResponse.json({ error: "Importador deshabilitado." }, { status: 404 });
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true, isActive: true } });
  if (!user?.isActive || user.role !== "DEVELOPER") return NextResponse.json({ error: "Sin permisos." }, { status: 403 });
  try { await assertCatalogImportGrant(user.id); } catch { return NextResponse.json({ error: "Autoriza nuevamente la sesión con el código privado." }, { status: 401 }); }
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  return { userId: user.id };
}
