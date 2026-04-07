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
import { publicRouter } from "./routers/public";
import { paypalRouter } from "./routers/paypal";
import { paymentLinkRouter } from "./routers/paymentLink";
import { documentRouter } from "./routers/document";

export const appRouter = router({
  auth: authRouter,
  paypal: paypalRouter,
  paymentLink: paymentLinkRouter,
  tour: tourRouter,
  dashboard: dashboardRouter,
  clients: clientRouter,
  reservation: reservationRouter,
  payment: paymentRouter,
  quotation: quotationRouter,
  user: userRouter,
  content: contentRouter,
  public: publicRouter,
  docs: documentRouter,
});

export type AppRouter = typeof appRouter;
