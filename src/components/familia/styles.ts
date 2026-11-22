// Botones de la web familiar: los mismos de la web principal.
const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 sm:text-base";

/** Acción principal (naranja de la marca). */
export const familyBtnPrimary = `${base} bg-brand-orange text-white hover:bg-brand-darkRed`;
/** Acción secundaria sobre fondo claro. */
export const familyBtnSecondary = `${base} border border-gray-200 bg-white text-brand-darkRed hover:border-brand-darkRed`;
