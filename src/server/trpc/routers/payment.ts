import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const paymentListSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
  method: z.enum(["CULQI_CARD", "CULQI_YAPE", "PAYPAL", "BANK_TRANSFER", "CASH"]).optional(),
});

export const paymentRouter = router({
  list: protectedProcedure
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

  getStats: protectedProcedure.query(async ({ ctx }) => {
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

  markAsVerified: protectedProcedure
    .input(z.object({
      id: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;

      return ctx.db.payment.update({
        where: { id: input.id },
        data: {
          status: "COMPLETED",
          manualVerifiedBy: userId,
          manualVerifiedAt: new Date(),
          manualNotes: input.notes,
          processedAt: new Date(),
        },
      });
    }),
});
