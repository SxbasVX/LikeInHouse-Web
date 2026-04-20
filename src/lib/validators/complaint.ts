import { z } from "zod";

export const complaintCreateSchema = z.object({
  consumerName: z.string().min(2, "Nombre requerido").max(200),
  consumerDocType: z.enum(["DNI", "CE", "PASAPORTE", "RUC"]),
  consumerDocNum: z.string().min(5).max(20),
  consumerAddress: z.string().min(5).max(300),
  consumerPhone: z.string().max(30).optional().nullable(),
  consumerEmail: z.string().email("Email inválido").max(200),
  isMinor: z.boolean().default(false),
  guardianName: z.string().max(200).optional().nullable(),
  guardianDocNum: z.string().max(20).optional().nullable(),
  itemType: z.enum(["PRODUCTO", "SERVICIO"]),
  itemDescription: z.string().min(5, "Describe el bien o servicio").max(2000),
  amountClaimed: z.number().nonnegative().optional().nullable(),
  currency: z.enum(["PEN", "USD"]).default("PEN"),
  type: z.enum(["RECLAMO", "QUEJA"]),
  detail: z.string().min(10, "Detalla tu reclamo o queja").max(5000),
  request: z.string().min(5, "Indica tu pedido").max(2000),
  locale: z.enum(["es", "en"]).default("es"),
}).refine(
  (data) => !data.isMinor || (!!data.guardianName && !!data.guardianDocNum),
  { message: "Si el consumidor es menor de edad, debe indicar el padre/madre/tutor", path: ["guardianName"] }
);

export const complaintRespondSchema = z.object({
  id: z.string(),
  status: z.enum(["PENDIENTE", "EN_PROCESO", "RESUELTO", "RECHAZADO"]),
  response: z.string().min(5).max(5000),
});

export const complaintListFilterSchema = z.object({
  status: z.enum(["PENDIENTE", "EN_PROCESO", "RESUELTO", "RECHAZADO"]).optional(),
  type: z.enum(["RECLAMO", "QUEJA"]).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
}).optional();

export type ComplaintCreateInput = z.infer<typeof complaintCreateSchema>;
export type ComplaintRespondInput = z.infer<typeof complaintRespondSchema>;
