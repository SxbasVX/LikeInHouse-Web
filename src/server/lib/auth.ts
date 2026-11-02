import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { compare, hash } from "bcryptjs";
import type { Prisma, UserRole } from "@prisma/client";
import { db } from "./db";
import { createAuditLog } from "./audit";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";
import { passwordIssues } from "@/lib/password-policy";

export const SESSION_HOURS = 8;
const BCRYPT_ROUNDS = 12;

// Existing NextAuth users keep their bcrypt hashes, so nobody has to reset their password.
export const hashPassword = (password: string) => hash(password, BCRYPT_ROUNDS);

// Email/password logins are Account rows with providerId "credential" and accountId = user id.
export async function setCredentialPassword(tx: Prisma.TransactionClient, userId: string, password: string) {
  const passwordHash = await hashPassword(password);
  await tx.account.upsert({
    where: { providerId_accountId: { providerId: "credential", accountId: userId } },
    create: { providerId: "credential", accountId: userId, userId, password: passwordHash },
    update: { password: passwordHash },
  });
}

// Sessions are database rows: deleting them signs the user out everywhere on their next request.
export const revokeUserSessions = (userId: string) => db.session.deleteMany({ where: { userId } });

const requestIp = (h: Headers | undefined) =>
  h?.get("x-forwarded-for")?.split(",")[0]?.trim() || h?.get("x-real-ip") || "unknown";

const adminHost = process.env.ADMIN_HOSTNAME || "panel.likeinhouseperu.com";
// Exact hosts only: a *.vercel.app wildcard would also match other people's projects.
// VERCEL_URL / VERCEL_BRANCH_URL are this deployment's own preview addresses.
const panelHosts = [
  adminHost, "dev.likeinhouseperu.com",
  process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ...(process.env.NODE_ENV !== "production" ? ["localhost:3000"] : []),
].filter((host): host is string => Boolean(host));
// Endpoints a session may call even when the account was just deactivated in the database.
const OPEN_TO_INACTIVE = new Set(["/sign-in/email", "/sign-out"]);

// A factory so tests can run the exact same rules against Better Auth's in-memory adapter.
export const authConfig = (database: BetterAuthOptions["database"]) => ({
  database,
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  // The panel answers on its subdomain, the dev subdomain and this deployment's Vercel URLs: only those hosts can build auth URLs.
  baseURL: { allowedHosts: panelHosts, fallback: `https://${adminHost}` },
  trustedOrigins: panelHosts.map((host) => `${host.startsWith("localhost") ? "http" : "https"}://${host}`),
  emailAndPassword: {
    enabled: true,
    // Accounts are created only by an ADMIN from the panel.
    disableSignUp: true,
    password: { hash: hashPassword, verify: ({ hash: stored, password }) => compare(password, stored) },
  },
  session: { expiresIn: SESSION_HOURS * 60 * 60, updateAge: 60 * 60 },
  user: {
    additionalFields: {
      role: { type: "string", input: false, required: false },
      isActive: { type: "boolean", input: false, required: false },
    },
  },
  advanced: {
    // Prisma's @default(cuid()) keeps ids consistent with the rest of the schema.
    database: { generateId: false },
    ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
    // Don't depend on the detected protocol: production cookies are always Secure.
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  databaseHooks: {
    session: {
      create: {
        // A deactivated account can never get a session, whatever its password.
        before: async (session) => {
          const user = await db.user.findUnique({ where: { id: session.userId }, select: { isActive: true } });
          if (!user?.isActive) {
            createAuditLog({ userId: session.userId, action: "LOGIN_FAILED", entity: "User", entityId: session.userId, changes: { reason: "account_inactive" } });
            return false;
          }
        },
        after: async (session) => {
          await db.user.update({ where: { id: session.userId }, data: { lastLoginAt: new Date() } });
          createAuditLog({ userId: session.userId, action: "LOGIN", entity: "User", entityId: session.userId });
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") {
        const email = String(ctx.body?.email ?? "").toLowerCase();
        // Per IP and per email, so a distributed attack on one account is also stopped.
        const byIp = checkRateLimit(`login:ip:${requestIp(ctx.headers)}`, RATE_LIMITS.login);
        const byEmail = checkRateLimit(`login:email:${email}`, RATE_LIMITS.login);
        if (!byIp.allowed || !byEmail.allowed) throw new APIError("TOO_MANY_REQUESTS", { message: "Demasiados intentos. Espera 15 minutos." });
      }
      // Deactivating someone straight in Neon must also stop Better Auth's own endpoints (change-password, update-user…).
      if (!OPEN_TO_INACTIVE.has(ctx.path)) {
        const session = await getSessionFromCtx(ctx);
        if (session) {
          const user = await db.user.findUnique({ where: { id: session.user.id }, select: { isActive: true } });
          if (!user?.isActive) throw new APIError("UNAUTHORIZED", { message: "Tu cuenta está desactivada." });
        }
      }
      if (ctx.path === "/change-password") {
        const issues = passwordIssues(String(ctx.body?.newPassword ?? ""));
        if (issues.length) throw new APIError("BAD_REQUEST", { message: `La contraseña debe tener ${issues.join(", ")}.` });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email" || !(ctx.context.returned instanceof APIError)) return;
      const user = await db.user.findUnique({ where: { email: String(ctx.body?.email ?? "").trim().toLowerCase() }, select: { id: true } });
      if (user) createAuditLog({ userId: user.id, action: "LOGIN_FAILED", entity: "User", entityId: user.id, changes: { reason: "invalid_password" } });
    }),
  },
  plugins: [nextCookies()],
}) satisfies BetterAuthOptions;

export const betterAuthServer = betterAuth(authConfig(prismaAdapter(db, { provider: "postgresql" })));

export interface AdminSession {
  user: { id: string; name: string; email: string; role: UserRole };
}

// Role and active status come from the database on every request, so admin changes apply immediately.
// Server pages that read data directly must call this themselves: the middleware only sees that a cookie exists,
// and Next can render a page without re-running its layout.
export async function requireRole(roles: UserRole[]): Promise<AdminSession> {
  const session = await auth();
  if (!session) redirect("/admin/login");
  if (!roles.includes(session.user.role)) redirect("/admin");
  return session;
}

export const auth = cache(async (): Promise<AdminSession | null> => {
  const session = await betterAuthServer.api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, role: true, isActive: true } });
  if (!user?.isActive) return null;
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
});
