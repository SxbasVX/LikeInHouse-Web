import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, roleProtectedProcedure } from "../trpc";

const adminOrSales = roleProtectedProcedure(["ADMIN", "SALES"]);

const reservationListSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  status: z.enum(["PENDING", "CONFIRMED", "PAID", "COMPLETED", "CANCELLED"]).optional(),
  search: z.string().optional(),
});

const reservationCreateSchema = z.object({
  clientId: z.string(),
  tourId: z.string(),
  departureId: z.string().optional(),
  adults: z.number().min(1).default(1),
  children: z.number().min(0).default(0),
  currency: z.enum(["PEN", "USD"]).default("PEN"),
  totalAmount: z.number().min(0),
  depositAmount: z.number().min(0).optional(),
  origin: z.enum(["WEB", "MANUAL", "QUOTATION", "PAYMENT_LINK"]).default("MANUAL"),
  internalNotes: z.string().optional(),
  customDescEs: z.string().optional(),
  customDescEn: z.string().optional(),
});

const reservationUpdateStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "CONFIRMED", "PAID", "COMPLETED", "CANCELLED"]),
});

export const reservationRouter = router({
  list: protectedProcedure
    .input(reservationListSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, status, search } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(status && { status }),
        ...(search && {
          OR: [
            { referenceCode: { contains: search, mode: "insensitive" as const } },
            { client: { firstName: { contains: search, mode: "insensitive" as const } } },
            { client: { lastName: { contains: search, mode: "insensitive" as const } } },
            { client: { email: { contains: search, mode: "insensitive" as const } } },
            { tour: { nameEs: { contains: search, mode: "insensitive" as const } } },
          ],
        }),
      };

      const [reservations, total] = await Promise.all([
        ctx.db.reservation.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            client: { select: { firstName: true, lastName: true, email: true } },
            tour: { select: { nameEs: true, slug: true } },
            departure: { select: { departureDate: true } },
            assignedUser: { select: { name: true } },
            _count: { select: { payments: true } },
          },
        }),
        ctx.db.reservation.count({ where }),
      ]);

      return {
        reservations,
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const reservation = await ctx.db.reservation.findUnique({
        where: { id: input.id },
        include: {
          client: true,
          tour: {
            select: {
              id: true,
              nameEs: true,
              slug: true,
              destination: true,
              durationDays: true,
              durationNights: true,
            },
          },
          departure: true,
          assignedUser: { select: { id: true, name: true, email: true } },
          payments: { orderBy: { createdAt: "desc" } },
        },
      });

      if (!reservation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva no encontrada" });
      }

      return reservation;
    }),

  create: adminOrSales
    .input(reservationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;

      return ctx.db.reservation.create({
        data: {
          ...input,
          totalAmount: input.totalAmount,
          depositAmount: input.depositAmount,
          balanceAmount: input.depositAmount
            ? input.totalAmount - input.depositAmount
            : undefined,
          assignedUserId: userId,
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(reservationUpdateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const reservation = await ctx.db.reservation.findUnique({
        where: { id: input.id },
      });

      if (!reservation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva no encontrada" });
      }

      return ctx.db.reservation.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  delete: roleProtectedProcedure(["ADMIN"])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const reservation = await ctx.db.reservation.findUnique({
        where: { id: input.id },
        include: { _count: { select: { payments: true } } },
      });

      if (!reservation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva no encontrada" });
      }

      if (reservation._count.payments > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No se puede eliminar una reserva con pagos registrados",
        });
      }

      return ctx.db.reservation.delete({ where: { id: input.id } });
    }),
});
