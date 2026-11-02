import { AlertTriangle, Clock, CheckCircle2, XCircle, type LucideIcon } from "lucide-react";

// Etiquetas y colores de estado: ver `STATUS.complaint` en src/lib/status.ts.
export type ComplaintStatus = "PENDIENTE" | "EN_PROCESO" | "RESUELTO" | "RECHAZADO";

export const complaintStatusIcons: Record<ComplaintStatus, LucideIcon> = {
  PENDIENTE: AlertTriangle,
  EN_PROCESO: Clock,
  RESUELTO: CheckCircle2,
  RECHAZADO: XCircle,
};

export const complaintTypeLabels: Record<string, string> = {
  RECLAMO: "Reclamo",
  QUEJA: "Queja",
};

export const complaintItemTypeLabels: Record<string, string> = {
  PRODUCTO: "Producto",
  SERVICIO: "Servicio",
};
