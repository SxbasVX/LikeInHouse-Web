/**
 * Etiquetas y colores de estado para el panel admin. Única fuente de verdad:
 * tablas, badges y calendario leen de aquí.
 *
 * Paleta (cada estado de un dominio tiene un color distinto):
 * - ámbar    → espera una acción (pendiente, en proceso)
 * - celeste  → en curso / enviado (confirmada, procesando, enviada)
 * - teal     → éxito de marca (pagada, completado, aceptada, resuelto, publicado)
 * - teal sólido → cierre comercial (cotización convertida)
 * - beige    → estados intermedios de marca (vista, archivado)
 * - pizarra  → neutro / terminado (completada, borrador, rechazado)
 * - rojo     → fallo que requiere atención (fallido, reclamo pendiente)
 * - violeta  → reembolsado
 * - granate  → cancelado / vencido
 */

export interface StatusStyle {
  label: string;
  /** Clases para el badge (fondo, texto, borde). */
  className: string;
  /** Clase de fondo para puntos/indicadores (p. ej. calendario). */
  dot: string;
}

const tone = {
  amber: { className: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  sky: { className: "bg-sky-100 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  teal: { className: "bg-brand-teal/15 text-brand-darkTeal border-brand-teal/30", dot: "bg-brand-teal" },
  tealSolid: { className: "bg-brand-darkTeal text-white border-brand-darkTeal", dot: "bg-brand-darkTeal" },
  beige: { className: "bg-brand-beige text-brand-darkRed border-brand-orange/25", dot: "bg-brand-orange" },
  slate: { className: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  red: { className: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
  violet: { className: "bg-violet-100 text-violet-800 border-violet-200", dot: "bg-violet-500" },
  maroon: { className: "bg-brand-darkRed/10 text-brand-darkRed border-brand-darkRed/20", dot: "bg-brand-darkRed" },
} as const;

export const STATUS = {
  reservation: {
    PENDING: { label: "Pendiente", ...tone.amber },
    CONFIRMED: { label: "Confirmada", ...tone.sky },
    PAID: { label: "Pagada", ...tone.teal },
    COMPLETED: { label: "Completada", ...tone.slate },
    CANCELLED: { label: "Cancelada", ...tone.maroon },
  },
  payment: {
    PENDING: { label: "Pendiente", ...tone.amber },
    PROCESSING: { label: "Procesando", ...tone.sky },
    COMPLETED: { label: "Completado", ...tone.teal },
    FAILED: { label: "Fallido", ...tone.red },
    REFUNDED: { label: "Reembolsado", ...tone.violet },
  },
  quotation: {
    DRAFT: { label: "Borrador", ...tone.slate },
    SENT: { label: "Enviada", ...tone.sky },
    VIEWED: { label: "Vista", ...tone.beige },
    ACCEPTED: { label: "Aceptada", ...tone.teal },
    CONVERTED: { label: "Convertida", ...tone.tealSolid },
    EXPIRED: { label: "Expirada", ...tone.maroon },
  },
  complaint: {
    PENDIENTE: { label: "Pendiente", ...tone.red },
    EN_PROCESO: { label: "En proceso", ...tone.amber },
    RESUELTO: { label: "Resuelto", ...tone.teal },
    RECHAZADO: { label: "Rechazado", ...tone.slate },
  },
  tour: {
    DRAFT: { label: "Borrador", ...tone.slate },
    PUBLISHED: { label: "Publicado", ...tone.teal },
    ARCHIVED: { label: "Archivado", ...tone.beige },
  },
} satisfies Record<string, Record<string, StatusStyle>>;

export type StatusDomain = keyof typeof STATUS;
export type StatusOf<D extends StatusDomain> = keyof (typeof STATUS)[D] & string;

/** Estilo de un estado; si no existe en el dominio, devuelve un estilo neutro con el valor crudo. */
export function getStatusStyle(domain: StatusDomain, status: string | null | undefined): StatusStyle {
  const map = STATUS[domain] as Record<string, StatusStyle>;
  if (status && map[status]) return map[status];
  return { label: status ?? "—", ...tone.slate };
}

export function statusLabel(domain: StatusDomain, status: string | null | undefined): string {
  return getStatusStyle(domain, status).label;
}

/** Lista [valor, etiqueta] en el orden declarado, para selects de filtro. */
export function statusOptions<D extends StatusDomain>(domain: D): { value: StatusOf<D>; label: string }[] {
  return Object.entries(STATUS[domain] as Record<string, StatusStyle>).map(([value, style]) => ({
    value: value as StatusOf<D>,
    label: style.label,
  }));
}
