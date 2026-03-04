import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/server/lib/auth";
import { db } from "@/server/lib/db";
import type { UserRole } from "@prisma/client";

export const createTRPCContext = async () => {
  const session = await auth();

  return {
    db,
    session,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      session: ctx.session,
    },
  });
});

export const roleProtectedProcedure = (roles: UserRole[]) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const userRole = (ctx.session.user as { role: UserRole }).role;
    if (!roles.includes(userRole)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  });
