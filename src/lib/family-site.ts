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

/** Clave del Setting con las fotos de la web familiar `{ hero, gallery }` (público). */
export const FAMILY_IMAGES_SETTING_KEY = "familySiteImages";

/** Máximo de fotos en "Momentos en familia". */
export const FAMILY_GALLERY_MAX = 8;

export interface FamilyGalleryItem {
  url: string;
  /** Leyenda opcional, por ejemplo "Familia Rodríguez · Cusco 2025". */
  caption: string;
}

export interface FamilySiteImages {
  hero: string | null;
  gallery: FamilyGalleryItem[];
}

/** Largo máximo de la leyenda de una foto. */
export const FAMILY_CAPTION_MAX = 80;

// Sólo URLs https (las sube el panel a Cloudinary).
const isHttpsUrl = (v: unknown): v is string => typeof v === "string" && /^https:\/\/\S+$/.test(v);

// Acepta el formato anterior (sólo la URL) y el nuevo ({ url, caption }).
function toGalleryItem(v: unknown): FamilyGalleryItem | null {
  if (isHttpsUrl(v)) return { url: v, caption: "" };
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (!isHttpsUrl(o.url)) return null;
    const caption = typeof o.caption === "string" ? o.caption.trim().slice(0, FAMILY_CAPTION_MAX) : "";
    return { url: o.url, caption };
  }
  return null;
}

/** Lee las fotos de la web familiar desde el mapa de ajustes; ignora valores inválidos. */
export function parseFamilySiteImages(settings: Record<string, unknown> | null | undefined): FamilySiteImages {
  const raw = settings?.[FAMILY_IMAGES_SETTING_KEY];
  if (!raw || typeof raw !== "object") return { hero: null, gallery: [] };
  const v = raw as Record<string, unknown>;
  const gallery = Array.isArray(v.gallery)
    ? v.gallery.map(toGalleryItem).filter((g): g is FamilyGalleryItem => g !== null).slice(0, FAMILY_GALLERY_MAX)
    : [];
  return { hero: isHttpsUrl(v.hero) ? v.hero : null, gallery };
}
