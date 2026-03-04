import { router } from "./trpc";

export const appRouter = router({
  // Los routers se agregan aqui conforme se desarrollen
  // tour: tourRouter,
  // reservation: reservationRouter,
  // payment: paymentRouter,
  // quotation: quotationRouter,
  // paymentLink: paymentLinkRouter,
  // client: clientRouter,
  // content: contentRouter,
  // media: mediaRouter,
  // occupancy: occupancyRouter,
  // user: userRouter,
  // email: emailRouter,
  // dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
