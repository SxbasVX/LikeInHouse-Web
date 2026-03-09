import { initTRPC, TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import superjson from "superjson";
import { auth } from "@/server/lib/auth";
import { db } from "@/server/lib/db";
import { checkRateLimit, type RATE_LIMITS } from "@/server/lib/rate-limit";
import { defineAbilitiesFor, type AppAbility } from "@/server/lib/abilities";
import type { UserRole } from "@prisma/client";

export const createTRPCContext = async () => {
  const session = await auth();
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";

  return {
    db,
    session,
    ip,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const user = await ctx.db.user.findUnique({
    where: { id: (ctx.session.user as { id: string }).id },
    select: { id: true, isActive: true, role: true },
  });

  if (!user || !user.isActive) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Tu cuenta de usuario ha sido eliminada o desactivada. Por favor, inicia sesión nuevamente."
    });
  }

  // Build CASL abilities for this user
  const ability = defineAbilitiesFor(user.role, user.id);

  return next({
    ctx: {
      session: ctx.session,
      user,
      ability,
    },
  });
});

export const roleProtectedProcedure = (roles: UserRole[]) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const userRole = ctx.user.role;
    if (!roles.includes(userRole)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  });

/**
 * Rate-limited public procedure.
 * Uses IP-based rate limiting to prevent abuse on public endpoints.
 */
export const rateLimitedProcedure = (config: typeof RATE_LIMITS[keyof typeof RATE_LIMITS]) =>
  t.procedure.use(async ({ ctx, next, path }) => {
    const key = `${ctx.ip}:${path}`;
    const result = checkRateLimit(key, config);

    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Demasiadas solicitudes. Por favor, espera unos minutos antes de intentar de nuevo.",
      });
    }

    return next({ ctx });
  });
