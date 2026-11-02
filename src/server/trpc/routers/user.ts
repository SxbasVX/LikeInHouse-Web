import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, roleProtectedProcedure } from "../trpc";
import { createAuditLog } from "@/server/lib/audit";
import { revokeUserSessions, setCredentialPassword } from "@/server/lib/auth";

const adminOnly = roleProtectedProcedure(["ADMIN"]);

const userListSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

const passwordSchema = z.string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
  .regex(/[a-z]/, "Debe contener al menos una minúscula")
  .regex(/[0-9]/, "Debe contener al menos un número");

const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
  role: z.enum(["ADMIN", "SALES", "MARKETING", "DEVELOPER"]).default("SALES"),
});

const userUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  role: z.enum(["ADMIN", "SALES", "MARKETING", "DEVELOPER"]).optional(),
  isActive: z.boolean().optional(),
  password: passwordSchema.optional(),
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
            _count: { select: { reservations: true, quotations: true, sessions: { where: { expiresAt: { gt: new Date() } } } } },
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

      return ctx.db.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: { name: input.name, email: input.email, role: input.role },
          select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        });
        await setCredentialPassword(tx, created.id, input.password);
        return created;
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

      const updated = await ctx.db.$transaction(async (tx) => {
        if (password) await setCredentialPassword(tx, id, password);
        return tx.user.update({
          where: { id },
          data,
          select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        });
      });
      // A new password or a deactivation must end every open session right away; role changes apply on the next request anyway.
      if (password || data.isActive === false) await revokeUserSessions(id);
      if (password) createAuditLog({ userId: ctx.user.id, action: "UPDATE", entity: "User", entityId: id, changes: { passwordReset: true } });
      return updated;
    }),

  revokeSessions: adminOnly
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { count } = await revokeUserSessions(input.id);
      createAuditLog({ userId: ctx.user.id, action: "UPDATE", entity: "User", entityId: input.id, changes: { sessionsRevoked: count } });
      return { revoked: count };
    }),

  toggleActive: adminOnly
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({ where: { id: input.id } });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });
      }

      const updated = await ctx.db.user.update({
        where: { id: input.id },
        data: { isActive: !user.isActive },
      });
      if (!updated.isActive) await revokeUserSessions(input.id);

      // Audit user activation/deactivation
      const adminId = ctx.user.id;
      createAuditLog({
        userId: adminId,
        action: updated.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        entity: "User",
        entityId: input.id,
        changes: { targetEmail: user.email, isActive: updated.isActive },
      });

      return updated;
    }),

  delete: adminOnly
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      if (input.id === userId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No puedes eliminar tu propia cuenta",
        });
      }

      // Verify no assigned reservations (FK Restrict would crash)
      const reservationCount = await ctx.db.reservation.count({
        where: { assignedUserId: input.id },
      });
      if (reservationCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `No se puede eliminar: tiene ${reservationCount} reserva(s) asignada(s). Reasígnalas primero o desactiva la cuenta.`,
        });
      }

      // Verify no created quotations (FK Restrict would crash)
      const quotationCount = await ctx.db.quotation.count({
        where: { createdByUserId: input.id },
      });
      if (quotationCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `No se puede eliminar: ha creado ${quotationCount} cotización(es). Desactiva la cuenta en su lugar.`,
        });
      }

      // Verify no created payment links (FK Restrict would crash)
      const paymentLinkCount = await ctx.db.paymentLink.count({
        where: { createdByUserId: input.id },
      });
      if (paymentLinkCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `No se puede eliminar: ha creado ${paymentLinkCount} link(s) de pago. Desactiva la cuenta en su lugar.`,
        });
      }

      await ctx.db.user.delete({ where: { id: input.id } });

      // Audit user deletion
      createAuditLog({
        userId,
        action: "DELETE",
        entity: "User",
        entityId: input.id,
      });

      return { success: true };
    }),
});
