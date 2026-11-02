import { z } from "zod";
import { router, roleProtectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createAuditLog } from "@/server/lib/audit";
import { sendWhatsAppAlert } from "@/server/lib/whatsapp";
import { serializeDecimals } from "@/server/lib/serialize";

const adminOrSales = roleProtectedProcedure(["ADMIN", "SALES"]);

const paymentListSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
  method: z.enum(["CULQI_CARD", "CULQI_YAPE", "PAYPAL", "BANK_TRANSFER", "CASH"]).optional(),
  search: z.string().trim().max(100).optional(),
});

export const paymentRouter = router({
  list: adminOrSales
    .input(paymentListSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, status, method, search } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(status && { status }),
        ...(method && { method }),
        // Búsqueda por código de reserva o nombre del cliente
        ...(search && {
          reservation: {
            OR: [
              { referenceCode: { contains: search, mode: "insensitive" as const } },
              { client: { firstName: { contains: search, mode: "insensitive" as const } } },
              { client: { lastName: { contains: search, mode: "insensitive" as const } } },
            ],
          },
        }),
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
        payments: serializeDecimals(payments),
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  getStats: adminOrSales.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const userRole = ctx.user.role;
    const isAdmin = userRole === "ADMIN";

    // Non-admin users only see stats for payments on their assigned reservations
    const ownershipFilter = isAdmin ? {} : { reservation: { assignedUserId: userId } };

    // Totales separados por moneda: sumar PEN y USD en un solo número sería incorrecto.
    const groups = await ctx.db.payment.groupBy({
      by: ["status", "currency"],
      where: { status: { in: ["COMPLETED", "PENDING", "REFUNDED"] }, ...ownershipFilter },
      _sum: { amount: true },
      _count: { _all: true },
    });

    const summarize = (status: "COMPLETED" | "PENDING" | "REFUNDED") => {
      const rows = groups.filter((g) => g.status === status);
      return {
        count: rows.reduce((n, g) => n + g._count._all, 0),
        totals: rows
          .map((g) => ({ currency: g.currency, amount: Number(g._sum.amount ?? 0) }))
          .sort((a, b) => a.currency.localeCompare(b.currency)),
      };
    };

    return serializeDecimals({
      completed: summarize("COMPLETED"),
      pending: summarize("PENDING"),
      refunded: summarize("REFUNDED"),
    });
  }),

  markAsVerified: adminOrSales
    .input(z.object({
      id: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

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

      return serializeDecimals(payment);
    }),
});
