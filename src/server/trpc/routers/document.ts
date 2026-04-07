import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure, protectedProcedure, roleProtectedProcedure } from "../trpc";
import { documentCreateSchema, documentUpdateSchema } from "@/lib/validators/document";

const adminOnly = roleProtectedProcedure(["ADMIN"]);

export const documentRouter = router({
  // Lista todos los documentos (admin)
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        type: z.enum(["PDF", "CONTENT"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input?.type) where.type = input.type;
      if (input?.search) {
        where.OR = [
          { titleEs: { contains: input.search, mode: "insensitive" } },
          { titleEn: { contains: input.search, mode: "insensitive" } },
          { slug: { contains: input.search, mode: "insensitive" } },
        ];
      }
      return ctx.db.document.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      });
    }),

  // Obtener por ID (admin)
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.db.document.findUnique({ where: { id: input.id } });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Documento no encontrado" });
      return doc;
    }),

  // Obtener por slug (público)
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.db.document.findUnique({
        where: { slug: input.slug, isPublished: true },
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Documento no encontrado" });
      return doc;
    }),

  // Crear documento (admin)
  create: adminOnly
    .input(documentCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.document.findUnique({ where: { slug: input.slug } });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Ya existe un documento con ese slug" });
      return ctx.db.document.create({ data: input });
    }),

  // Actualizar documento (admin)
  update: adminOnly
    .input(documentUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await ctx.db.document.findUnique({ where: { id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Documento no encontrado" });

      // Verificar slug único si cambió
      if (data.slug !== existing.slug) {
        const slugTaken = await ctx.db.document.findUnique({ where: { slug: data.slug } });
        if (slugTaken) throw new TRPCError({ code: "CONFLICT", message: "Ya existe un documento con ese slug" });
      }

      return ctx.db.document.update({ where: { id }, data });
    }),

  // Eliminar documento (admin)
  delete: adminOnly
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.document.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Documento no encontrado" });
      await ctx.db.document.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
