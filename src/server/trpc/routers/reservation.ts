import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, roleProtectedProcedure, rateLimitedProcedure } from "../trpc";
import { RATE_LIMITS } from "@/server/lib/rate-limit";
import { createAuditLog } from "@/server/lib/audit";
import { sendWhatsAppAlert, sendWhatsAppToClient, sendBookingNotification } from "@/server/lib/whatsapp";
import { serializeDecimals } from "@/server/lib/serialize";
import { generateUniqueReservationRef } from "@/server/lib/references";
import { calculateTotalWithDiscount } from "@/lib/pricing";

// Valid status transitions
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PAID", "CANCELLED"],
  PAID: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

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
  currency: z.enum(["USD", "PEN"]).default("USD"),
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

// Reusable traffic source schema for attribution tracking
// Only allow safe characters to prevent stored XSS in admin dashboards
const safeTrafficString = z.string().max(100).regex(/^[a-zA-Z0-9_.:\-/()%+ ]*$/, "Caracteres no permitidos");
const trafficSourceSchema = z.object({
  firstSource: safeTrafficString.optional(),
  lastSource: safeTrafficString.optional(),
  utmSource: safeTrafficString.optional(),
  utmCampaign: safeTrafficString.optional(),
  utmMedium: safeTrafficString.optional(),
  utmContent: safeTrafficString.optional(),
}).optional();

const guestReservationSchema = z.object({
  tourId: z.string(),
  departureId: z.string().optional(),

  // Client info
  firstName: z.string().min(2, "Nombre muy corto"),
  lastName: z.string().min(2, "Apellido muy corto"),
  email: z.string().email("Correo inválido"),
  phone: z.string().optional(),
  country: z.string().optional(),

  // Reservation details
  adults: z.number().min(1).default(1),
  children: z.number().min(0).default(0),
  currency: z.enum(["USD", "PEN"]).default("USD"),
  totalAmount: z.number().min(0),

  // Internal notes (tier breakdown, requested date for open-calendar tours)
  internalNotes: z.string().max(500).optional(),

  // Traffic source attribution
  trafficSource: trafficSourceSchema,
});

export const reservationRouter = router({
  list: protectedProcedure
    .input(reservationListSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, status, search } = input;
      const skip = (page - 1) * limit;
      const userId = ctx.user.id;
      const userRole = ctx.user.role;
      const isAdmin = userRole === "ADMIN";

      const where = {
        ...(status && { status }),
        // Non-admin users only see their assigned reservations
        ...(!isAdmin && { assignedUserId: userId }),
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
            tour: { select: { nameEs: true, slug: true, shortDescEs: true } },
            departure: { select: { departureDate: true } },
            assignedUser: { select: { name: true } },
            _count: { select: { payments: true } },
          },
        }),
        ctx.db.reservation.count({ where }),
      ]);

      // Note: firstSource, lastSource, utmCampaign are already included
      // in the reservation object via findMany (no need for explicit select)

      return {
        reservations: reservations.map(r => serializeDecimals({
          ...r,
          referenceCode: isAdmin ? r.referenceCode : r.referenceCode.slice(0, 9) + "****",
        })),
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

      const userId = ctx.user.id;
      const userRole = ctx.user.role;

      // Non-admin can only view their assigned reservations
      if (userRole !== "ADMIN" && reservation.assignedUserId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes acceso a esta reserva" });
      }

      if (userRole !== "ADMIN") {
        reservation.referenceCode = reservation.referenceCode.slice(0, 9) + "****";
      }

      return serializeDecimals(reservation);
    }),

  // Calendar view: lightweight list of reservations in a date range
  listForCalendar: adminOrSales
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      tourId: z.string().optional(),
      status: z.enum(["PENDING", "CONFIRMED", "PAID", "COMPLETED", "CANCELLED"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const userRole = ctx.user.role;
      const isAdmin = userRole === "ADMIN";

      const where: any = {
        createdAt: {
          gte: new Date(input.startDate),
          lte: new Date(input.endDate),
        },
        ...(!isAdmin && { assignedUserId: userId }),
        ...(input.tourId && { tourId: input.tourId }),
        ...(input.status && { status: input.status }),
      };

      const reservations = await ctx.db.reservation.findMany({
        where,
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          referenceCode: true,
          status: true,
          createdAt: true,
          adults: true,
          children: true,
          totalAmount: true,
          currency: true,
          origin: true,
          departure: { select: { departureDate: true } },
          tour: { select: { nameEs: true, destination: true } },
          client: { select: { firstName: true, lastName: true } },
        },
      });

      return reservations.map((r) => ({
        ...r,
        totalAmount: Number(r.totalAmount),
      }));
    }),

  create: adminOrSales
    .input(reservationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Validate tour exists and is bookable
      const tour = await ctx.db.tour.findUnique({
        where: { id: input.tourId },
        include: { pricing: { include: { tiers: { orderBy: { sortOrder: "asc" } } } } },
      });
      if (!tour) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tour no encontrado" });
      }
      if (tour.tourType !== "BOOKABLE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este tour es solo informativo y no permite reservas" });
      }

      // Server-side price validation: recalculate from tour pricing (with discounts)
      if (tour.pricing) {
        // Use tiers if available, fallback to legacy fields
        const defaultTier = tour.pricing.tiers.find((t) => t.isDefault) || tour.pricing.tiers[0];
        const childTier = tour.pricing.tiers.find((t) => !t.isDefault && t.ageMax != null);
        const adultPrice = defaultTier ? Number(defaultTier.priceUsd) : Number(tour.pricing.basePriceUsdAdult);
        const childPrice = childTier ? Number(childTier.priceUsd) : Number(tour.pricing.basePriceUsdChild);

        const pricingData = {
          basePriceUsdAdult: adultPrice,
          basePriceUsdChild: childPrice,
          promoDiscountPercent: tour.pricing.promoDiscountPercent ? Number(tour.pricing.promoDiscountPercent) : null,
          promoStartDate: tour.pricing.promoStartDate,
          promoEndDate: tour.pricing.promoEndDate,
          groupDiscountPercent: tour.pricing.groupDiscountPercent ? Number(tour.pricing.groupDiscountPercent) : null,
          groupMinPersons: tour.pricing.groupMinPersons,
        };
        const { total: serverTotal } = calculateTotalWithDiscount(pricingData, input.adults, input.children);

        if (Math.abs(serverTotal - input.totalAmount) > 0.01) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `El monto (${input.totalAmount}) no coincide con el precio calculado (${serverTotal})`,
          });
        }
      }

      // Use transaction to prevent race conditions and ensure atomicity
      const reservation = await ctx.db.$transaction(async (tx) => {
        // Validate departure capacity and increment bookedCount
        if (input.departureId) {
          const departure = await tx.tourDeparture.findUnique({
            where: { id: input.departureId },
          });
          if (!departure) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Fecha de salida no encontrada" });
          }
          const totalPassengers = input.adults + input.children;
          const available = departure.maxCapacity - departure.bookedCount;
          if (totalPassengers > available) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Solo quedan ${available} cupos disponibles para esta fecha`,
            });
          }
          await tx.tourDeparture.update({
            where: { id: input.departureId },
            data: { bookedCount: { increment: totalPassengers } },
          });
        }

        const referenceCode = await generateUniqueReservationRef(tx);

        const reservation = await tx.reservation.create({
          data: {
            ...input,
            referenceCode,
            totalAmount: input.totalAmount,
            depositAmount: input.depositAmount,
            balanceAmount: input.depositAmount
              ? input.totalAmount - input.depositAmount
              : undefined,
            assignedUserId: userId,
          },
        });

        return reservation;
      }, { isolationLevel: "Serializable" });

      // Enviar alerta al admin por la creación manual / por ventas
      sendBookingNotification({
        type: "NEW_BOOKING",
        referenceCode: reservation.referenceCode,
        tourName: tour.nameEs,
        clientName: `Client ${input.clientId.slice(0, 8)}`,
        people: input.adults + input.children,
        totalAmount: Number(reservation.totalAmount),
        currency: reservation.currency,
        origin: (input.origin as "WEB" | "MANUAL" | "QUOTATION" | "PAYMENT_LINK") || "MANUAL",
        paymentStatus: "pending",
      });

      return serializeDecimals(reservation);
    }),

  createGuestReservation: rateLimitedProcedure(RATE_LIMITS.guestReservation)
    .input(guestReservationSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate tour exists and is bookable
      const tour = await ctx.db.tour.findUnique({
        where: { id: input.tourId },
        include: { pricing: { include: { tiers: { orderBy: { sortOrder: "asc" } } } } },
      });

      if (!tour || tour.status !== "PUBLISHED" || tour.tourType !== "BOOKABLE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Tour no disponible para reserva" });
      }

      if (!tour.pricing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Tour sin precios configurados" });
      }

      // Use tiers if available, fallback to legacy fields
      const defaultTier = tour.pricing.tiers.find((t) => t.isDefault) || tour.pricing.tiers[0];
      const childTier = tour.pricing.tiers.find((t) => !t.isDefault && t.ageMax != null);
      const adultPrice = defaultTier ? Number(defaultTier.priceUsd) : Number(tour.pricing.basePriceUsdAdult);
      const childPrice = childTier ? Number(childTier.priceUsd) : Number(tour.pricing.basePriceUsdChild);

      // Calculate price server-side with discounts (never trust client amount)
      const pricingData = {
        basePriceUsdAdult: adultPrice,
        basePriceUsdChild: childPrice,
        promoDiscountPercent: tour.pricing.promoDiscountPercent ? Number(tour.pricing.promoDiscountPercent) : null,
        promoStartDate: tour.pricing.promoStartDate,
        promoEndDate: tour.pricing.promoEndDate,
        groupDiscountPercent: tour.pricing.groupDiscountPercent ? Number(tour.pricing.groupDiscountPercent) : null,
        groupMinPersons: tour.pricing.groupMinPersons,
      };
      const { total: serverTotal } = calculateTotalWithDiscount(pricingData, input.adults, input.children);

      // Allow small rounding tolerance (1 cent)
      if (Math.abs(serverTotal - input.totalAmount) > 0.01) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El monto no coincide con los precios del tour",
        });
      }

      // Use serializable transaction to prevent race conditions on departure capacity
      const reservation = await ctx.db.$transaction(async (tx) => {
        // Validate departure capacity inside transaction
        if (input.departureId) {
          const departure = await tx.tourDeparture.findUnique({
            where: { id: input.departureId },
          });
          if (!departure) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Fecha de salida no encontrada" });
          }
          const totalPassengers = input.adults + input.children;
          const available = departure.maxCapacity - departure.bookedCount;
          if (totalPassengers > available) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Solo quedan ${available} cupos disponibles para esta fecha`,
            });
          }

          // Increment bookedCount atomically
          await tx.tourDeparture.update({
            where: { id: input.departureId },
            data: { bookedCount: { increment: totalPassengers } },
          });
        }

        const referenceCode = await generateUniqueReservationRef(tx);

        // Upsert client based on email
        const client = await tx.client.upsert({
          where: { email: input.email },
          update: {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            country: input.country,
          },
          create: {
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            country: input.country,
            language: "es",
          },
        });

        const newReservation = await tx.reservation.create({
          data: {
            referenceCode,
            origin: "WEB",
            status: "PENDING",
            clientId: client.id,
            tourId: input.tourId,
            departureId: input.departureId,
            adults: input.adults,
            children: input.children,
            currency: input.currency,
            totalAmount: serverTotal,
            internalNotes: input.internalNotes || null,
            // Traffic source attribution
            firstSource: input.trafficSource?.firstSource || "direct",
            lastSource: input.trafficSource?.lastSource || "direct",
            utmSource: input.trafficSource?.utmSource || null,
            utmCampaign: input.trafficSource?.utmCampaign || null,
            utmMedium: input.trafficSource?.utmMedium || null,
            utmContent: input.trafficSource?.utmContent || null,
          },
        });

        return newReservation;
      }, { isolationLevel: "Serializable" });

      // Enviar alerta por WhatsApp en segundo plano (Fire and forget)
      sendBookingNotification({
        type: "NEW_BOOKING",
        referenceCode: reservation.referenceCode,
        tourName: tour.nameEs,
        clientName: `${input.firstName} ${input.lastName}`,
        people: input.adults + input.children,
        totalAmount: Number(reservation.totalAmount),
        currency: reservation.currency,
        origin: "WEB",
        paymentStatus: "pending",
      });

      if (input.phone) {
        sendWhatsAppToClient(
          input.phone,
          `¡Hola ${input.firstName}! 🎉 Hemos recibido tu solicitud de reserva en Like In House.\n\nTour: ${tour!.nameEs}\nReferencia: ${reservation.referenceCode}\nPasajeros: ${input.adults + input.children}\n\nRevisa tu correo para continuar con el pago.`
        ).catch(console.error);
      }

      return serializeDecimals(reservation);
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

      // Non-admin can only update their assigned reservations
      const userId = ctx.user.id;
      const userRole = ctx.user.role;
      if (userRole !== "ADMIN" && reservation.assignedUserId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes acceso a esta reserva" });
      }

      // Validate status transition
      const allowed = VALID_STATUS_TRANSITIONS[reservation.status];
      if (!allowed || !allowed.includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `No se puede cambiar de ${reservation.status} a ${input.status}`,
        });
      }

      // If cancelling, decrement bookedCount to free up capacity (inside transaction)
      let updated;
      if (input.status === "CANCELLED" && reservation.departureId) {
        const totalPassengers = reservation.adults + reservation.children;
        updated = await ctx.db.$transaction(async (tx) => {
          await tx.tourDeparture.update({
            where: { id: reservation.departureId! },
            data: { bookedCount: { decrement: totalPassengers } },
          });
          return tx.reservation.update({
            where: { id: input.id },
            data: { status: input.status },
          });
        });
      } else {
        updated = await ctx.db.reservation.update({
          where: { id: input.id },
          data: { status: input.status },
        });
      }

      // Audit status change
      createAuditLog({
        userId,
        action: "STATUS_CHANGE",
        entity: "Reservation",
        entityId: input.id,
        changes: { from: reservation.status, to: input.status, referenceCode: reservation.referenceCode },
      });

      if (input.status === "CANCELLED") {
        sendWhatsAppAlert(
          `⚠️ *Reserva Cancelada*\nRef: ${reservation.referenceCode}\nEl sistema ha registrado una cancelación manual. Los cupos han sido liberados.`
        ).catch(console.error);
      }

      return serializeDecimals(updated);
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

      // Atomic: decrement bookedCount + delete in one transaction
      await ctx.db.$transaction(async (tx) => {
        if (reservation.departureId && reservation.status !== "CANCELLED") {
          const totalPassengers = reservation.adults + reservation.children;
          await tx.tourDeparture.update({
            where: { id: reservation.departureId },
            data: { bookedCount: { decrement: totalPassengers } },
          });
        }
        await tx.reservation.delete({ where: { id: input.id } });
      });

      // Audit deletion
      const userId = ctx.user.id;
      createAuditLog({
        userId,
        action: "DELETE",
        entity: "Reservation",
        entityId: input.id,
        changes: { referenceCode: reservation.referenceCode },
      });

      sendWhatsAppAlert(
        `🚨 *Aviso de Seguridad*\nUn Administrador eliminó por completo la reserva ${reservation.referenceCode} de la base de datos.`
      ).catch(console.error);

      return { success: true };
    }),
});
