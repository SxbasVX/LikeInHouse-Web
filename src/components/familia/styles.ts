// Botones de la web familiar: los de la web principal, con un gesto más lúdico
// (se elevan al pasar el mouse y se hunden un poco al hacer clic).
const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 sm:text-base";

/** Acción principal (color de acento: turquesa en la web familiar). */
export const familyBtnPrimary = `${base} bg-brand-orange text-white shadow-[0_6px_16px_-8px_rgb(var(--brand-orange-rgb)/0.7)] hover:shadow-[0_12px_24px_-10px_rgb(var(--brand-orange-rgb)/0.8)] hover:bg-brand-darkRed`;
/** Acción secundaria sobre fondo claro. */
export const familyBtnSecondary = `${base} border border-gray-200 bg-white text-brand-darkRed hover:border-brand-darkRed`;
