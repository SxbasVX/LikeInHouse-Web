import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { router, roleProtectedProcedure } from "../trpc";

const adminOnly = roleProtectedProcedure(["ADMIN"]);

const userListSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "SALES", "MARKETING"]).default("SALES"),
});

const userUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "SALES", "MARKETING"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export const userRouter = router({
  list: adminOnly
    .input(userListSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            _count: { select: { reservations: true, quotations: true } },
          },
        }),
        ctx.db.user.count(),
      ]);

      return {
        users,
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  create: adminOnly
    .input(userCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya existe un usuario con ese email",
        });
      }

      const passwordHash = await hash(input.password, 12);

      return ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
    }),

  update: adminOnly
    .input(userUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, password, ...data } = input;

      const user = await ctx.db.user.findUnique({ where: { id } });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });
      }

      const updateData: Record<string, unknown> = { ...data };

      if (password) {
        updateData.passwordHash = await hash(password, 12);
      }

      if (data.email && data.email !== user.email) {
        const exists = await ctx.db.user.findUnique({
          where: { email: data.email },
        });
        if (exists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ya existe un usuario con ese email",
          });
        }
      }

      return ctx.db.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
    }),

  toggleActive: adminOnly
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({ where: { id: input.id } });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });
      }

      return ctx.db.user.update({
        where: { id: input.id },
        data: { isActive: !user.isActive },
      });
    }),

  delete: adminOnly
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;

      if (input.id === userId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No puedes eliminar tu propia cuenta",
        });
      }

      return ctx.db.user.delete({ where: { id: input.id } });
    }),
});
