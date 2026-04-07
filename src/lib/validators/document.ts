import { z } from "zod";

export const documentCreateSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones"),
  titleEs: z.string().min(2).max(200),
  titleEn: z.string().min(2).max(200),
  type: z.enum(["PDF", "CONTENT"]),
  pdfUrl: z.string().url().optional().nullable(),
  contentEs: z.string().optional().nullable(),
  contentEn: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const documentUpdateSchema = documentCreateSchema.extend({
  id: z.string(),
});

export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
