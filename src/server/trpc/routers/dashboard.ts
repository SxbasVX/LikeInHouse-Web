import { router, protectedProcedure } from "../trpc";

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
});
