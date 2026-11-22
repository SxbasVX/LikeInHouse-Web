// Clases compartidas de botones de la web familiar (trazo grueso y sombra sólida).
const base =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand-darkRed px-6 py-3 font-heading text-sm font-extrabold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 sm:text-base";

export const familyBtnPrimary = `${base} bg-brand-darkTeal text-white shadow-[4px_4px_0_0_#441514]`;
export const familyBtnSecondary = `${base} bg-white text-brand-darkRed shadow-[4px_4px_0_0_#441514]`;
export const familyBtnAccent = `${base} bg-[#FFC93C] text-brand-darkRed shadow-[4px_4px_0_0_#441514]`;
