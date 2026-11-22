// Web familiar (familia.likeinhouseperu.com). Este archivo no usa nada de servidor
// para que lo puedan importar el middleware (edge), el servidor y el cliente.

export const FAMILY_HOSTNAME = process.env.NEXT_PUBLIC_FAMILY_HOSTNAME || "familia.likeinhouseperu.com";

/** Prefijo interno de las rutas familiares: `src/app/familia/[locale]/...`. */
export const FAMILY_ROUTE_PREFIX = "/familia";

/** Cookie que habilita la vista previa mientras la web familiar no está publicada. */
export const FAMILY_PREVIEW_COOKIE = "lih_family_preview";

/** Clave del Setting `{ published }` (público: lo usa la web general para el banner). */
export const FAMILY_SITE_SETTING_KEY = "familySite";

/** Categoría de FAQ que sólo se muestra en la web familiar. */
export const FAMILY_FAQ_CATEGORY = "familia";

/** ¿La FAQ es de la web familiar? Acepta "Familia", " familia ", etc. */
export function isFamilyFaq(category: string | null | undefined): boolean {
  return (category ?? "").trim().toLowerCase() === FAMILY_FAQ_CATEGORY;
}

/** Clave del Setting con el token de vista previa. Es secreta: nunca se envía al navegador. */
export const FAMILY_PREVIEW_TOKEN_KEY = "familySitePreviewToken";

/** `familia.likeinhouseperu.com` en producción y `familia.localhost` en desarrollo. */
export function isFamilyHost(hostname: string): boolean {
  const host = hostname.toLowerCase().split(":")[0];
  return host === FAMILY_HOSTNAME || host === "familia.localhost";
}

/** URL base pública de la web familiar, sin barra final. */
export function getFamilyBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_FAMILY_BASE_URL || `https://${FAMILY_HOSTNAME}`;
  return raw.replace(/\/$/, "");
}

export interface FamilySiteSetting {
  published: boolean;
  previewToken: string | null;
}

/** Lee los dos Settings de la web familiar desde el mapa `{ key: value }` de ajustes. */
export function parseFamilySiteSetting(settings: Record<string, unknown>): FamilySiteSetting {
  const site = settings[FAMILY_SITE_SETTING_KEY];
  const token = settings[FAMILY_PREVIEW_TOKEN_KEY];
  return {
    published: !!site && typeof site === "object" && (site as Record<string, unknown>).published === true,
    previewToken: typeof token === "string" && token.length >= 16 ? token : null,
  };
}

/** ¿La web familiar está publicada? Acepta el mapa de ajustes públicos. */
export function isFamilySitePublished(settings: Record<string, unknown> | null | undefined): boolean {
  return !!settings && parseFamilySiteSetting(settings).published;
}
