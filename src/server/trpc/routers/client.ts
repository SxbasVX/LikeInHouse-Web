import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, roleProtectedProcedure } from "../trpc";

const adminOnly = roleProtectedProcedure(["ADMIN"]);

const clientListSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

const clientCreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  country: z.string().optional(),
  language: z.enum(["es", "en"]).default("es"),
  notes: z.string().optional(),
});

const clientUpdateSchema = clientCreateSchema.partial().extend({
  id: z.string(),
});

export const clientRouter = router({
  list: protectedProcedure
    .input(clientListSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input;
      const skip = (page - 1) * limit;

      const where = search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const [clients, total] = await Promise.all([
        ctx.db.client.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { reservations: true, quotations: true } },
          },
        }),
        ctx.db.client.count({ where }),
      ]);

      return {
        clients,
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const client = await ctx.db.client.findUnique({
        where: { id: input.id },
        include: {
          reservations: {
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
              tour: { select: { nameEs: true, slug: true } },
            },
          },
          quotations: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!client) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
      }

      return client;
    }),

  create: protectedProcedure
    .input(clientCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.db.client.findUnique({
        where: { email: input.email },
      });

      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya existe un cliente con ese email",
        });
      }

      return ctx.db.client.create({ data: input });
    }),

  update: protectedProcedure
    .input(clientUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const client = await ctx.db.client.findUnique({ where: { id } });
      if (!client) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
      }

      if (data.email && data.email !== client.email) {
        const exists = await ctx.db.client.findUnique({
          where: { email: data.email },
        });
        if (exists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ya existe un cliente con ese email",
          });
        }
      }

      return ctx.db.client.update({ where: { id }, data });
    }),

  delete: adminOnly
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const client = await ctx.db.client.findUnique({
        where: { id: input.id },
        include: { _count: { select: { reservations: true } } },
      });

      if (!client) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
      }

      if (client._count.reservations > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No se puede eliminar un cliente con reservas",
        });
      }

      return ctx.db.client.delete({ where: { id: input.id } });
    }),
});
