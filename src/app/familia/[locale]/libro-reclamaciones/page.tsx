import type { Metadata } from "next";
import { generateMetadata as generalMetadata } from "@/app/[locale]/libro-reclamaciones/page";
import { withFamilyRobots } from "@/lib/family-page";

// Mismo contenido legal que la web general; el canonical apunta a la web principal.
export { default } from "@/app/[locale]/libro-reclamaciones/page";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return withFamilyRobots(await generalMetadata(props));
}
