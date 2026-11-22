// Textos opcionales para las secciones compartidas de la web principal.
// La web familiar los usa para mostrar su propio encabezado sin duplicar componentes.
export interface SectionCopy {
  eyebrow?: string;
  title?: string;
  /** Parte del título en cursiva. */
  accent?: string;
  description?: string;
  /** Texto del enlace o botón de la sección. */
  link?: string;
}
