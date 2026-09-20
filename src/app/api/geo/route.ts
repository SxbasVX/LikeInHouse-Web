import { NextRequest, NextResponse } from "next/server";
import { currencyForCountry } from "@/lib/currency";

/**
 * País aproximado del visitante → moneda SUGERIDA.
 *
 * Sólo sirve para preseleccionar la moneda de visualización la primera vez.
 * La elección manual del pasajero siempre gana y, si no se puede determinar
 * el país, se responde USD.
 */
export const runtime = "edge";

export function GET(req: NextRequest) {
  // Vercel y Cloudflare inyectan el país en cabeceras. En local no existen.
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    null;

  return NextResponse.json(
    { country, currency: currencyForCountry(country) },
    // Cacheable por CDN por país; nunca contiene datos personales.
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
