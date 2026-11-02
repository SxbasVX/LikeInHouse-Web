import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/trpc/root";

export type RouterOutput = inferRouterOutputs<AppRouter>;

