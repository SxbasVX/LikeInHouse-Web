import { z } from "zod";
import { router, roleProtectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createAuditLog } from "@/server/lib/audit";
import { sendWhatsAppAlert } from "@/server/lib/whatsapp";

const adminOrSales = roleProtectedProcedure(["ADMIN", "SALES"]);

const paymentListSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
  method: z.enum(["CULQI_CARD", "CULQI_YAPE", "PAYPAL", "BANK_TRANSFER", "CASH"]).optional(),
});

export const paymentRouter = router({
  list: adminOrSales
    .input(paymentListSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, status, method } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(status && { status }),
        ...(method && { method }),
      };

      const [payments, total] = await Promise.all([
        ctx.db.payment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            reservation: {
              select: {
                referenceCode: true,
                client: { select: { firstName: true, lastName: true, email: true } },
                tour: { select: { nameEs: true } },
              },
            },
          },
        }),
        ctx.db.payment.count({ where }),
      ]);

      return {
        payments,
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  getStats: adminOrSales.query(async ({ ctx }) => {
    const [totalCompleted, totalPending, totalRefunded] = await Promise.all([
      ctx.db.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
        _count: true,
      }),
      ctx.db.payment.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
        _count: true,
      }),
      ctx.db.payment.aggregate({
        where: { status: "REFUNDED" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      completed: {
        count: totalCompleted._count,
        total: totalCompleted._sum.amount ?? 0,
      },
      pending: {
        count: totalPending._count,
        total: totalPending._sum.amount ?? 0,
      },
      refunded: {
        count: totalRefunded._count,
        total: totalRefunded._sum.amount ?? 0,
      },
    };
  }),

  markAsVerified: adminOrSales
    .input(z.object({
      id: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;

      // M14: Use transaction to prevent double verification
      const payment = await ctx.db.$transaction(async (tx) => {
        const existing = await tx.payment.findUnique({ where: { id: input.id } });
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pago no encontrado" });
        }
        if (existing.status === "COMPLETED") {
          return existing; // Already verified, idempotent
        }

        return tx.payment.update({
          where: { id: input.id },
          data: {
            status: "COMPLETED",
            manualVerifiedBy: userId,
            manualVerifiedAt: new Date(),
            manualNotes: input.notes,
            processedAt: new Date(),
          },
        });
      });

      // Audit log
      createAuditLog({
        userId,
        action: "PAYMENT_VERIFIED",
        entity: "Payment",
        entityId: input.id,
        changes: { notes: input.notes, reservationId: payment.reservationId },
      });

      sendWhatsAppAlert(
        `✅ *Pago Verificado Manualmente*\nMonto: ${payment.amount}\nMétodo: ${payment.method}\nReserva ID: ${payment.reservationId}`
      ).catch(console.error);

      return payment;
    }),
});
