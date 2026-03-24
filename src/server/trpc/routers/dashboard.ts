import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, roleProtectedProcedure } from "../trpc";

const adminOnly = roleProtectedProcedure(["ADMIN"]);

export const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const userRole = ctx.user.role;
    const isAdmin = userRole === "ADMIN";

    // Non-admin users only see stats for their own reservations/quotations
    const reservationFilter = isAdmin ? {} : { assignedUserId: userId };
    const quotationFilter = isAdmin ? {} : { createdByUserId: userId };

    const [
      totalTours,
      publishedTours,
      totalReservations,
      pendingReservations,
      pendingPayments,
      totalClients,
      openQuotations,
    ] = await Promise.all([
      ctx.db.tour.count({ where: { isActive: true } }),
      ctx.db.tour.count({ where: { status: "PUBLISHED", isActive: true } }),
      ctx.db.reservation.count({ where: reservationFilter }),
      ctx.db.reservation.count({ where: { status: "PENDING", ...reservationFilter } }),
      isAdmin
        ? ctx.db.payment.count({ where: { status: "PENDING" } })
        : ctx.db.payment.count({ where: { status: "PENDING", reservation: { assignedUserId: userId } } }),
      isAdmin ? ctx.db.client.count() : 0,
      ctx.db.quotation.count({
        where: { status: { in: ["DRAFT", "SENT", "VIEWED"] }, ...quotationFilter },
      }),
    ]);

    const recentReservations = await ctx.db.reservation.findMany({
      where: reservationFilter,
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { firstName: true, lastName: true, email: true } },
        tour: { select: { nameEs: true, slug: true } },
      },
    });

    return {
      totalTours,
      publishedTours,
      totalReservations,
      pendingReservations,
      pendingPayments,
      totalClients,
      openQuotations,
      recentReservations,
    };
  }),

  // Analytics: traffic source attribution data (admin only)
  getSourceAnalytics: adminOnly
    .input(z.object({
      days: z.number().min(1).max(365).default(30),
    }).optional())
    .query(async ({ ctx, input }) => {
      const days = input?.days ?? 30;
      const since = new Date();
      since.setDate(since.getDate() - days);

      // Get all reservations with source data in the period
      const reservations = await ctx.db.reservation.findMany({
        where: {
          createdAt: { gte: since },
          status: { not: "CANCELLED" },
        },
        select: {
          firstSource: true,
          lastSource: true,
          utmCampaign: true,
          utmSource: true,
          utmMedium: true,
          totalAmount: true,
          currency: true,
          createdAt: true,
        },
      });

      // Aggregate by first source (split by currency)
      const byFirstSource: Record<string, { orders: number; revenueUSD: number; revenuePEN: number }> = {};
      // Aggregate by last source
      const byLastSource: Record<string, { orders: number; revenueUSD: number; revenuePEN: number }> = {};
      // Aggregate by campaign
      const byCampaign: Record<string, { orders: number; revenueUSD: number; revenuePEN: number }> = {};

      for (const r of reservations) {
        const amount = Number(r.totalAmount);
        const currency = r.currency || "USD";
        const first = r.firstSource || "direct";
        const last = r.lastSource || "direct";
        const campaign = r.utmCampaign || "organic";

        // First source
        if (!byFirstSource[first]) byFirstSource[first] = { orders: 0, revenueUSD: 0, revenuePEN: 0 };
        byFirstSource[first].orders++;
        if (currency === "USD") byFirstSource[first].revenueUSD += amount;
        else byFirstSource[first].revenuePEN += amount;

        // Last source
        if (!byLastSource[last]) byLastSource[last] = { orders: 0, revenueUSD: 0, revenuePEN: 0 };
        byLastSource[last].orders++;
        if (currency === "USD") byLastSource[last].revenueUSD += amount;
        else byLastSource[last].revenuePEN += amount;

        // Campaign
        if (!byCampaign[campaign]) byCampaign[campaign] = { orders: 0, revenueUSD: 0, revenuePEN: 0 };
        byCampaign[campaign].orders++;
        if (currency === "USD") byCampaign[campaign].revenueUSD += amount;
        else byCampaign[campaign].revenuePEN += amount;
      }

      // Convert to sorted arrays (sort by USD revenue, fallback to PEN)
      const sortByRevenue = (a: { revenueUSD: number; revenuePEN: number }, b: { revenueUSD: number; revenuePEN: number }) =>
        (b.revenueUSD + b.revenuePEN) - (a.revenueUSD + a.revenuePEN);

      const firstSourceStats = Object.entries(byFirstSource)
        .map(([source, data]) => ({
          source, ...data,
          revenueUSD: Math.round(data.revenueUSD * 100) / 100,
          revenuePEN: Math.round(data.revenuePEN * 100) / 100,
        }))
        .sort(sortByRevenue);

      const lastSourceStats = Object.entries(byLastSource)
        .map(([source, data]) => ({
          source, ...data,
          revenueUSD: Math.round(data.revenueUSD * 100) / 100,
          revenuePEN: Math.round(data.revenuePEN * 100) / 100,
        }))
        .sort(sortByRevenue);

      const campaignStats = Object.entries(byCampaign)
        .map(([campaign, data]) => ({
          campaign, ...data,
          revenueUSD: Math.round(data.revenueUSD * 100) / 100,
          revenuePEN: Math.round(data.revenuePEN * 100) / 100,
        }))
        .sort(sortByRevenue);

      const totalRevenueUSD = Math.round(reservations.filter(r => (r.currency || "USD") === "USD").reduce((sum, r) => sum + Number(r.totalAmount), 0) * 100) / 100;
      const totalRevenuePEN = Math.round(reservations.filter(r => r.currency === "PEN").reduce((sum, r) => sum + Number(r.totalAmount), 0) * 100) / 100;

      return {
        totalOrders: reservations.length,
        totalRevenueUSD,
        totalRevenuePEN,
        days,
        firstSourceStats,
        lastSourceStats,
        campaignStats,
      };
    }),

  // Monthly financial report
  getMonthlyReport: adminOnly
    .input(z.object({
      date: z.string().regex(/^\d{4}-\d{2}$/, "Formato: YYYY-MM"),
    }))
    .query(async ({ ctx, input }) => {
      const [year, month] = input.date.split("-").map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Previous month for comparison
      const prevStartDate = new Date(year, month - 2, 1);
      const prevEndDate = new Date(year, month - 1, 0, 23, 59, 59);

      const [reservations, prevReservations, payments] = await Promise.all([
        ctx.db.reservation.findMany({
          where: { createdAt: { gte: startDate, lte: endDate }, status: { not: "CANCELLED" } },
          select: {
            id: true,
            referenceCode: true,
            status: true,
            adults: true,
            children: true,
            totalAmount: true,
            currency: true,
            origin: true,
            createdAt: true,
            tour: { select: { id: true, nameEs: true, destination: true } },
            client: { select: { firstName: true, lastName: true, email: true } },
          },
        }),
        ctx.db.reservation.count({
          where: { createdAt: { gte: prevStartDate, lte: prevEndDate }, status: { not: "CANCELLED" } },
        }),
        ctx.db.payment.findMany({
          where: { createdAt: { gte: startDate, lte: endDate }, status: "COMPLETED" },
          select: { amount: true, method: true },
        }),
      ]);

      const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const prevMonthRevenue = await ctx.db.payment.aggregate({
        where: { createdAt: { gte: prevStartDate, lte: prevEndDate }, status: "COMPLETED" },
        _sum: { amount: true },
      });

      const totalBookings = reservations.length;
      const totalPeople = reservations.reduce((sum, r) => sum + r.adults + r.children, 0);
      const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      const paidCount = reservations.filter((r) => r.status === "PAID" || r.status === "COMPLETED").length;
      const pendingCount = reservations.filter((r) => r.status === "PENDING" || r.status === "CONFIRMED").length;

      // Top tours by revenue
      const tourRevenue: Record<string, { name: string; destination: string; revenue: number; bookings: number; people: number }> = {};
      for (const r of reservations) {
        const key = r.tour.id;
        if (!tourRevenue[key]) {
          tourRevenue[key] = { name: r.tour.nameEs, destination: r.tour.destination, revenue: 0, bookings: 0, people: 0 };
        }
        tourRevenue[key].revenue += Number(r.totalAmount);
        tourRevenue[key].bookings++;
        tourRevenue[key].people += r.adults + r.children;
      }
      const topTours = Object.values(tourRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((t) => ({ ...t, revenue: Math.round(t.revenue * 100) / 100 }));

      // Payment method breakdown
      const byMethod: Record<string, number> = {};
      for (const p of payments) {
        byMethod[p.method] = (byMethod[p.method] || 0) + Number(p.amount);
      }

      const prevRevNum = Number(prevMonthRevenue._sum.amount ?? 0);
      const revenueChangePercent = prevRevNum > 0
        ? Math.round(((totalRevenue - prevRevNum) / prevRevNum) * 100)
        : null;

      const bookingsChangePercent = prevReservations > 0
        ? Math.round(((totalBookings - prevReservations) / prevReservations) * 100)
        : null;

      return {
        period: input.date,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookings,
        totalPeople,
        avgBookingValue: Math.round(avgBookingValue * 100) / 100,
        paidCount,
        pendingCount,
        revenueChangePercent,
        bookingsChangePercent,
        topTours,
        byMethod: Object.entries(byMethod).map(([method, amount]) => ({
          method,
          amount: Math.round(amount * 100) / 100,
        })),
        reservations: reservations.map((r) => ({
          ...r,
          totalAmount: Number(r.totalAmount),
        })),
      };
    }),

  // Per-tour report
  getTourReport: adminOnly
    .input(z.object({
      tourId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const tour = await ctx.db.tour.findUnique({
        where: { id: input.tourId },
        select: { id: true, nameEs: true, destination: true, status: true, tourType: true },
      });

      if (!tour) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tour no encontrado" });
      }

      const [reservations, payments] = await Promise.all([
        ctx.db.reservation.findMany({
          where: { tourId: input.tourId, status: { not: "CANCELLED" } },
          select: {
            id: true,
            referenceCode: true,
            status: true,
            adults: true,
            children: true,
            totalAmount: true,
            currency: true,
            origin: true,
            createdAt: true,
            client: { select: { firstName: true, lastName: true, email: true } },
            departure: { select: { departureDate: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.payment.aggregate({
          where: { reservation: { tourId: input.tourId }, status: "COMPLETED" },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      const totalRevenue = Number(payments._sum.amount ?? 0);
      const totalBookings = reservations.length;
      const totalPeople = reservations.reduce((sum, r) => sum + r.adults + r.children, 0);
      const paidCount = reservations.filter((r) => r.status === "PAID" || r.status === "COMPLETED").length;
      const pendingCount = reservations.filter((r) => r.status === "PENDING" || r.status === "CONFIRMED").length;
      const conversionRate = totalBookings > 0 ? Math.round((paidCount / totalBookings) * 100) : 0;

      return {
        tour,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookings,
        totalPeople,
        paidCount,
        pendingCount,
        conversionRate,
        reservations: reservations.map((r) => ({
          ...r,
          totalAmount: Number(r.totalAmount),
        })),
      };
    }),
});
