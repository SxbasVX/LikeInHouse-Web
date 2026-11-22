import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getCachedSettings } from "./cache";
import {
  FAMILY_PREVIEW_COOKIE,
  parseFamilySiteSetting,
  type FamilySiteSetting,
} from "@/lib/family-site";

export async function getFamilySiteSetting(): Promise<FamilySiteSetting> {
  const settings = await getCachedSettings();
  return parseFamilySiteSetting(settings);
}

export function previewTokenMatches(expected: string | null, given: string | null | undefined): boolean {
  if (!expected || !given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface FamilySiteAccess {
  published: boolean;
  /** Puede ver la web: está publicada o trae la cookie de vista previa válida. */
  canView: boolean;
  /** Está viendo una vista previa de una web aún no publicada. */
  isPreview: boolean;
}

/** Decide si quien visita puede ver la web familiar. Mientras no se publique, sólo con el enlace de vista previa. */
export async function getFamilySiteAccess(): Promise<FamilySiteAccess> {
  const setting = await getFamilySiteSetting();
  if (setting.published) return { published: true, canView: true, isPreview: false };
  const cookieStore = await cookies();
  const ok = previewTokenMatches(setting.previewToken, cookieStore.get(FAMILY_PREVIEW_COOKIE)?.value);
  return { published: false, canView: ok, isPreview: ok };
}
