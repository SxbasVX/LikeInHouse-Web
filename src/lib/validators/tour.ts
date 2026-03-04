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
  textEs: z.string().min(1),
  textEn: z.string().min(1),
});

const tourImageSchema = z.object({
  cloudinaryId: z.string().min(1),
  url: z.string().url(),
  altEs: z.string().optional(),
  altEn: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

const tourDepartureSchema = z.object({
  departureDate: z.string().min(1),
  maxCapacity: z.number().int().positive(),
});

const pricingSchema = z.object({
  basePricePenAdult: z.number().positive("Precio requerido"),
  basePriceUsdAdult: z.number().positive("Precio requerido"),
  basePricePenChild: z.number().positive("Precio requerido"),
  basePriceUsdChild: z.number().positive("Precio requerido"),
  groupDiscountPercent: z.number().min(0).max(100).optional(),
  groupMinPersons: z.number().int().positive().optional(),
  promoDiscountPercent: z.number().min(0).max(100).optional(),
  promoStartDate: z.string().optional(),
  promoEndDate: z.string().optional(),
  promoLabelEs: z.string().optional(),
  promoLabelEn: z.string().optional(),
});

export const tourCreateSchema = z.object({
  nameEs: z.string().min(3, "Minimo 3 caracteres"),
  nameEn: z.string().min(3, "Minimum 3 characters"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Solo letras minusculas, numeros y guiones"),
  category: z.string().min(1, "Categoria requerida"),
  difficulty: z.enum(["EASY", "MODERATE", "CHALLENGING"]),
  durationDays: z.number().int().positive(),
  durationNights: z.number().int().min(0),
  destination: z.string().min(1, "Destino requerido"),
  shortDescEs: z.string().min(10, "Minimo 10 caracteres"),
  shortDescEn: z.string().min(10, "Minimum 10 characters"),
  longDescEs: z.string().min(20, "Minimo 20 caracteres"),
  longDescEn: z.string().min(20, "Minimum 20 characters"),
  metaTitleEs: z.string().optional(),
  metaDescEs: z.string().optional(),
  metaTitleEn: z.string().optional(),
  metaDescEn: z.string().optional(),
  isFeatured: z.boolean().default(false),
  itinerary: z.array(itineraryDaySchema).min(1, "Minimo 1 dia de itinerario"),
  pricing: pricingSchema,
  includes: z.array(tourIncludeSchema).default([]),
  excludes: z.array(tourIncludeSchema).default([]),
  images: z.array(tourImageSchema).default([]),
  departures: z.array(tourDepartureSchema).default([]),
});

export type TourCreateInput = z.infer<typeof tourCreateSchema>;

export const tourUpdateSchema = tourCreateSchema.partial().extend({
  id: z.string().min(1),
});

export type TourUpdateInput = z.infer<typeof tourUpdateSchema>;
