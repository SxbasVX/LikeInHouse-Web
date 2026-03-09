import "server-only";
import { createCallerFactory, createTRPCContext } from "@/server/trpc/trpc";
import { appRouter } from "@/server/trpc/root";

const createCaller = createCallerFactory(appRouter);

export async function getServerCaller() {
  const ctx = await createTRPCContext();
  return createCaller(ctx);
}
