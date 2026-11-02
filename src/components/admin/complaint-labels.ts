import { AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";

export type ComplaintStatus = "PENDIENTE" | "EN_PROCESO" | "RESUELTO" | "RECHAZADO";

export const complaintStatusConfig: Record<ComplaintStatus, { label: string; variant: any; icon: any }> = {
  PENDIENTE: { label: "Pendiente", variant: "destructive", icon: AlertTriangle },
  EN_PROCESO: { label: "En Proceso", variant: "default", icon: Clock },
  RESUELTO: { label: "Resuelto", variant: "secondary", icon: CheckCircle2 },
  RECHAZADO: { label: "Rechazado", variant: "outline", icon: XCircle },
};

export const complaintTypeLabels: Record<string, string> = {
  RECLAMO: "Reclamo",
  QUEJA: "Queja",
};

export const complaintItemTypeLabels: Record<string, string> = {
  PRODUCTO: "Producto",
  SERVICIO: "Servicio",
};
