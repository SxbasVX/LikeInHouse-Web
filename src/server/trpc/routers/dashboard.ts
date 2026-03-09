import { z } from "zod";
import { router, protectedProcedure, roleProtectedProcedure } from "../trpc";

const adminOnly = roleProtectedProcedure(["ADMIN"]);

export const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session.user as { id: string; role: string }).id;
    const userRole = (ctx.session.user as { role: string }).role;
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

      // Aggregate by first source
      const byFirstSource: Record<string, { orders: number; revenue: number }> = {};
      // Aggregate by last source
      const byLastSource: Record<string, { orders: number; revenue: number }> = {};
      // Aggregate by campaign
      const byCampaign: Record<string, { orders: number; revenue: number }> = {};

      for (const r of reservations) {
        const amount = Number(r.totalAmount);
        const first = r.firstSource || "direct";
        const last = r.lastSource || "direct";
        const campaign = r.utmCampaign || "organic";

        // First source
        if (!byFirstSource[first]) byFirstSource[first] = { orders: 0, revenue: 0 };
        byFirstSource[first].orders++;
        byFirstSource[first].revenue += amount;

        // Last source
        if (!byLastSource[last]) byLastSource[last] = { orders: 0, revenue: 0 };
        byLastSource[last].orders++;
        byLastSource[last].revenue += amount;

        // Campaign
        if (!byCampaign[campaign]) byCampaign[campaign] = { orders: 0, revenue: 0 };
        byCampaign[campaign].orders++;
        byCampaign[campaign].revenue += amount;
      }

      // Convert to sorted arrays
      const sortByRevenue = (a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue;

      const firstSourceStats = Object.entries(byFirstSource)
        .map(([source, data]) => ({ source, ...data, revenue: Math.round(data.revenue * 100) / 100 }))
        .sort(sortByRevenue);

      const lastSourceStats = Object.entries(byLastSource)
        .map(([source, data]) => ({ source, ...data, revenue: Math.round(data.revenue * 100) / 100 }))
        .sort(sortByRevenue);

      const campaignStats = Object.entries(byCampaign)
        .map(([campaign, data]) => ({ campaign, ...data, revenue: Math.round(data.revenue * 100) / 100 }))
        .sort(sortByRevenue);

      return {
        totalOrders: reservations.length,
        totalRevenue: Math.round(reservations.reduce((sum, r) => sum + Number(r.totalAmount), 0) * 100) / 100,
        days,
        firstSourceStats,
        lastSourceStats,
        campaignStats,
      };
    }),
});
