import { z } from "zod";

// ============================================================
// Schemas para queries (listado, filtros)
// ============================================================

export const tourListInputSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(10),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  search: z.string().optional(),
  isFeatured: z.boolean().optional(),
  tourType: z.enum(["BOOKABLE", "INFORMATIONAL"]).optional(),
});

export type TourListInput = z.infer<typeof tourListInputSchema>;

// ============================================================
// Schemas para mutaciones (crear/editar tour)
// ============================================================

const itineraryDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  titleEs: z.string().min(1, "Titulo requerido"),
  titleEn: z.string().min(1, "Title required"),
  descriptionEs: z.string().min(1, "Descripcion requerida"),
  descriptionEn: z.string().min(1, "Description required"),
});

const tourIncludeSchema = z.object({
  textEs: z.string().min(1, "Campo requerido"),
  textEn: z.string().min(1, "Field required"),
});

const conditionTypeEnum = z.enum(["HEALTH", "AGE", "BEHAVIOR", "GROUP_SIZE", "PHYSICAL", "GENERAL"]);

export const tourConditionSchema = z.object({
  type: conditionTypeEnum.default("GENERAL"),
  textEs: z.string().min(3, "Campo requerido"),
  textEn: z.string().min(3, "Field required"),
  isActive: z.boolean().default(true),
});

const tourImageSchema = z.object({
  cloudinaryId: z.string().min(1, "Se requiere la imagen"),
  url: z.string().url("URL de imagen inválida"),
  altEs: z.string().optional(),
  altEn: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

const tourDepartureSchema = z.object({
  departureDate: z.string().min(1, "Fecha requerida")
    .refine((s) => new Date(s) > new Date(), { message: "La fecha de salida debe ser futura" }),
  maxCapacity: z.number().int("Debe ser entero").positive("Debe ser mayor a 0"),
});

const pricingTierSchema = z.object({
  labelEs: z.string().min(1, "Etiqueta requerida"),
  labelEn: z.string().min(1, "Label required"),
  ageMin: z.number().int().min(0).optional().nullable(),
  ageMax: z.number().int().min(0).optional().nullable(),
  priceUsd: z.number().nonnegative("Precio no puede ser negativo"),
  isDefault: z.boolean().default(false),
});

const pricingSchema = z.object({
  tiers: z.array(pricingTierSchema).min(1, "Se requiere al menos una tarifa"),
  groupDiscountPercent: z.number().min(0, "Mínimo 0").max(100, "Máximo 100").optional(),
  groupMinPersons: z.number().int("Debe ser entero").positive("Debe ser al menos 1 persona").optional(),
  promoDiscountPercent: z.number().min(0, "Mínimo 0").max(100, "Máximo 100").optional(),
  promoStartDate: z.string().optional(),
  promoEndDate: z.string().optional(),
  promoLabelEs: z.string().optional(),
  promoLabelEn: z.string().optional(),
});

export const tourCreateSchema = z.object({
  nameEs: z.string().min(3, "Mínimo 3 caracteres"),
  nameEn: z.string().min(3, "Minimum 3 characters"),
  slug: z.string().min(3, "Mínimo 3 caracteres").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  tourType: z.enum(["BOOKABLE", "INFORMATIONAL"]).default("BOOKABLE"),
  bookingMode: z.enum(["CALENDAR", "DEPARTURES", "BOTH"]).default("CALENDAR"),
  category: z.string().min(1, "Categoría requerida"),
  difficulty: z.enum(["EASY", "MODERATE", "CHALLENGING"]).default("EASY"),
  durationDays: z.number().int("Debe ser un número entero").min(0, "No puede ser negativo"),
  durationNights: z.number().int("Debe ser un número entero").min(0, "No puede ser negativo"),
  durationHours: z.number().int("Debe ser un número entero").min(0).max(23).optional().nullable(),
  destination: z.string().min(1, "Destino requerido"),
  shortDescEs: z.string().min(10, "Mínimo 10 caracteres"),
  shortDescEn: z.string().min(10, "Minimum 10 characters"),
  longDescEs: z.string().min(20, "Mínimo 20 caracteres"),
  longDescEn: z.string().min(20, "Minimum 20 characters"),
  metaTitleEs: z.string().optional(),
  metaDescEs: z.string().optional(),
  metaTitleEn: z.string().optional(),
  metaDescEn: z.string().optional(),
  isFeatured: z.boolean().default(false),
  itinerary: z.array(itineraryDaySchema).default([]),
  pricing: pricingSchema.optional(),
  includes: z.array(tourIncludeSchema).default([]),
  excludes: z.array(tourIncludeSchema).default([]),
  conditions: z.array(tourConditionSchema).default([]),
  images: z.array(tourImageSchema).default([]),
  departures: z.array(tourDepartureSchema).default([]),
}).refine((data) => {
  if (data.tourType === "BOOKABLE" && !data.pricing) {
    return false;
  }
  return true;
}, {
  message: "Los tours comprables requieren precios",
  path: ["pricing"],
}).refine((data) => {
  if (data.durationDays === 0 && (!data.durationHours || data.durationHours <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Si duración en días es 0, debe especificar horas",
  path: ["durationHours"],
});

export type TourCreateInput = z.infer<typeof tourCreateSchema>;

export const tourUpdateSchema = z.object({
  id: z.string().min(1),
  nameEs: z.string().min(3).optional(),
  nameEn: z.string().min(3).optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
  tourType: z.enum(["BOOKABLE", "INFORMATIONAL"]).optional(),
  bookingMode: z.enum(["CALENDAR", "DEPARTURES", "BOTH"]).optional(),
  category: z.string().min(1).optional(),
  difficulty: z.enum(["EASY", "MODERATE", "CHALLENGING"]).optional(),
  durationDays: z.number().int().min(0).optional(),
  durationNights: z.number().int().min(0).optional(),
  durationHours: z.number().int().min(0).max(23).optional().nullable(),
  destination: z.string().min(1).optional(),
  shortDescEs: z.string().min(10).optional(),
  shortDescEn: z.string().min(10).optional(),
  longDescEs: z.string().min(20).optional(),
  longDescEn: z.string().min(20).optional(),
  metaTitleEs: z.string().optional(),
  metaDescEs: z.string().optional(),
  metaTitleEn: z.string().optional(),
  metaDescEn: z.string().optional(),
  isFeatured: z.boolean().optional(),
  itinerary: z.array(itineraryDaySchema).optional(),
  pricing: pricingSchema.optional().nullable(),
  includes: z.array(tourIncludeSchema).optional(),
  excludes: z.array(tourIncludeSchema).optional(),
  conditions: z.array(tourConditionSchema).optional(),
  images: z.array(tourImageSchema).optional(),
  departures: z.array(tourDepartureSchema).optional(),
});

export type TourUpdateInput = z.infer<typeof tourUpdateSchema>;
