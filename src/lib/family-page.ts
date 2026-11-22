import "server-only";
import type { Metadata } from "next";
import { getFamilyBaseUrl } from "@/lib/family-site";
import { getFamilySiteAccess } from "@/server/lib/family-site";
import { buildMetadata, FAMILY_SITE_NAME, type BuildMetadataOptions } from "@/lib/seo";

// Metadatos de una página de la web familiar: URLs bajo el dominio familiar
// y noindex mientras la web no esté publicada.
export async function buildFamilyMetadata(
  opts: Omit<BuildMetadataOptions, "baseUrl" | "siteName">
): Promise<Metadata> {
  const access = await getFamilySiteAccess();
  return buildMetadata({
    ...opts,
    baseUrl: getFamilyBaseUrl(),
    siteName: FAMILY_SITE_NAME,
    noindex: opts.noindex || !access.published,
  });
}

/** Robots para páginas reutilizadas de la web general: noindex si la web familiar no está publicada. */
export async function withFamilyRobots(metadata: Metadata): Promise<Metadata> {
  const access = await getFamilySiteAccess();
  if (access.published) return metadata;
  return { ...metadata, robots: { index: false, follow: false, nocache: true } };
}

/** ¿Quien visita puede ver el contenido? Evita enviar datos de páginas cuando la web aún no es visible. */
export async function canViewFamilySite(): Promise<boolean> {
  return (await getFamilySiteAccess()).canView;
}
