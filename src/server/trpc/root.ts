import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { tourRouter } from "./routers/tour";
import { dashboardRouter } from "./routers/dashboard";
import { clientRouter } from "./routers/client";
import { reservationRouter } from "./routers/reservation";
import { paymentRouter } from "./routers/payment";
import { quotationRouter } from "./routers/quotation";
import { userRouter } from "./routers/user";
import { contentRouter } from "./routers/content";

export const appRouter = router({
  auth: authRouter,
  tour: tourRouter,
  dashboard: dashboardRouter,
  client: clientRouter,
  reservation: reservationRouter,
  payment: paymentRouter,
  quotation: quotationRouter,
  user: userRouter,
  content: contentRouter,
});

export type AppRouter = typeof appRouter;
