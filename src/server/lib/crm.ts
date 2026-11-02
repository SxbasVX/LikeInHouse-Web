import "server-only";

/**
 * Envía solicitudes de cotización de la web como Lead al CRM.
 *
 * El CRM recibe un POST en `api_publica.php?action=lead_create` con la llave en
 * el header `X-Api-Key`. Sólo `nombre` es obligatorio; cualquier campo que el CRM
 * no reconozca se agrega a las Observaciones del lead.
 *
 * Nunca lanza: la solicitud ya quedó guardada en la base de datos, así que un
 * CRM caído no puede hacer fallar el formulario del cliente.
 */
export interface CrmLead {
  nombre: string;
  telefono?: string;
  correo?: string;
  destino?: string;
  ciudad_origen?: string;
  fecha_salida?: string; // YYYY-MM-DD
  fecha_retorno?: string; // YYYY-MM-DD
  adultos?: number;
  ninos?: number;
  infantes?: number;
  mensaje?: string;
  // Extras: el CRM los agrega a Observaciones
  tour?: string;
  idioma?: string;
}

const TIMEOUT_MS = 8_000;

export function isCrmConfigured() {
  return Boolean(process.env.CRM_LEADS_URL && process.env.CRM_API_KEY);
}

export type CrmResult = { ok: true } | { ok: false; disabled?: boolean; error: string };

export async function sendCrmLead(lead: CrmLead): Promise<CrmResult> {
  const url = process.env.CRM_LEADS_URL;
  const apiKey = process.env.CRM_API_KEY;
  if (!url || !apiKey) return { ok: false, disabled: true, error: "Integración no configurada (CRM_LEADS_URL / CRM_API_KEY)" };

  const body = Object.fromEntries(
    Object.entries(lead).filter(([, value]) => value !== undefined && value !== "")
  );

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // El CRM responde {"ok": boolean, "msg": string}, a veces con HTTP 200 aunque falle
    const text = await res.text().catch(() => "");
    let data: { ok?: boolean; msg?: string } | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      /* respuesta no JSON */
    }
    if (!res.ok || data?.ok === false) {
      const reason = `HTTP ${res.status}: ${data?.msg ?? text.slice(0, 300)}`;
      console.error(`[CRM] lead_create respondió ${reason}`);
      return { ok: false, error: reason };
    }
    return { ok: true };
  } catch (error) {
    console.error("[CRM] No se pudo enviar el lead:", error);
    const reason = error instanceof Error && error.name === "TimeoutError" ? "El CRM no respondió a tiempo" : "No se pudo conectar con el CRM";
    return { ok: false, error: reason };
  }
}
