import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { headers } from "next/headers";
import { db } from "./db";
import { createAuditLog } from "./audit";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";
import type { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // --- Brute Force Protection ---
        const headersList = await headers();
        const ip =
          headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          headersList.get("x-real-ip") ||
          "unknown";

        // Rate limit by IP
        const ipLimitKey = `login:ip:${ip}`;
        const ipLimit = checkRateLimit(ipLimitKey, RATE_LIMITS.login);

        // Rate limit by email (prevents distributed brute force against one account)
        const emailLimitKey = `login:email:${(credentials.email as string).toLowerCase()}`;
        const emailLimit = checkRateLimit(emailLimitKey, RATE_LIMITS.login);

        if (!ipLimit.allowed || !emailLimit.allowed) {
          console.warn(`[Auth] Brute force attempt blocked from IP: ${ip} for email: ${credentials.email}`);
          return null; // Block access
        }
        // ------------------------------


        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.isActive) {
          // Audit failed login attempt (user not found or inactive)
          if (user) {
            createAuditLog({
              userId: user.id,
              action: "LOGIN_FAILED",
              entity: "User",
              entityId: user.id,
              changes: { reason: "account_inactive" },
            });
          }
          return null;
        }

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          // Audit failed login (wrong password)
          createAuditLog({
            userId: user.id,
            action: "LOGIN_FAILED",
            entity: "User",
            entityId: user.id,
            changes: { reason: "invalid_password" },
          });
          return null;
        }

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Audit successful login
        createAuditLog({
          userId: user.id,
          action: "LOGIN",
          entity: "User",
          entityId: user.id,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: UserRole }).role;
        token.id = user.id!;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
