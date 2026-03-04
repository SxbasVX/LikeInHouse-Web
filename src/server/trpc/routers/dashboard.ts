import { router, protectedProcedure } from "../trpc";

export const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [
      totalTours,
      publishedTours,
      totalReservations,
      pendingReservations,
      pendingPayments,
      totalClients,
      openQuotations,
    ] = await Promise.all([
      ctx.db.tour.count(),
      ctx.db.tour.count({ where: { status: "PUBLISHED" } }),
      ctx.db.reservation.count(),
      ctx.db.reservation.count({ where: { status: "PENDING" } }),
      ctx.db.payment.count({ where: { status: "PENDING" } }),
      ctx.db.client.count(),
      ctx.db.quotation.count({
        where: { status: { in: ["DRAFT", "SENT", "VIEWED"] } },
      }),
    ]);

    const recentReservations = await ctx.db.reservation.findMany({
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
