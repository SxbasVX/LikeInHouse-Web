// Botones de la web familiar: sobrios y legibles, sin sombras de caricatura.
const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-bold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fam-maiz focus-visible:ring-offset-2";

/** Acción principal sobre fondo claro. */
export const familyBtnPrimary = `${base} bg-fam-valle text-white hover:bg-[#0A4F3E] focus-visible:ring-offset-white`;
/** Acción secundaria sobre fondo claro. */
export const familyBtnSecondary = `${base} border border-fam-tinta/25 bg-white text-fam-tinta hover:border-fam-tinta focus-visible:ring-offset-white`;
/** Acción principal sobre el verde valle. */
export const familyBtnOnDark = `${base} bg-fam-maiz text-fam-tinta hover:bg-[#F6C565] focus-visible:ring-offset-fam-valle`;
/** Acción secundaria sobre el verde valle. */
export const familyBtnGhostOnDark = `${base} border border-white/40 text-white hover:border-white focus-visible:ring-offset-fam-valle`;
