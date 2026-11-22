import { NextResponse, type NextRequest } from "next/server";
import { FAMILY_PREVIEW_COOKIE } from "@/lib/family-site";
import { getFamilySiteSetting, previewTokenMatches } from "@/server/lib/family-site";

export const dynamic = "force-dynamic";

// Enlace de vista previa de la web familiar: /api/familia/preview?token=...
// Con el token correcto guarda la cookie y abre la web; `?exit=1` cierra la vista previa.
export async function GET(request: NextRequest) {
  const home = new URL("/es", request.url);

  if (request.nextUrl.searchParams.get("exit") === "1") {
    const res = NextResponse.redirect(home);
    res.cookies.delete(FAMILY_PREVIEW_COOKIE);
    return res;
  }

  const token = request.nextUrl.searchParams.get("token");
  const setting = await getFamilySiteSetting();
  if (!previewTokenMatches(setting.previewToken, token)) {
    return new NextResponse("Enlace de vista previa no válido o vencido.", {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const res = NextResponse.redirect(home);
  res.cookies.set(FAMILY_PREVIEW_COOKIE, token!, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
