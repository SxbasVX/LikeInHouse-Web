import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { router, roleProtectedProcedure } from "../trpc";
import { isCrmConfigured } from "@/server/lib/crm";
import { syncQuoteRequestToCrm } from "@/server/lib/quote-requests";

const adminOrSales = roleProtectedProcedure(["ADMIN", "SALES"]);

const statusEnum = z.enum(["NEW", "CONTACTED", "QUOTED", "CLOSED"]);

// Solicitudes de cotización que llegan del formulario web
export const quoteRequestRouter = router({
  list: adminOrSales
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(50).default(10),
        status: statusEnum.optional(),
        search: z.string().max(100).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.QuoteRequestWhereInput = {
        ...(input.status && { status: input.status }),
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
            { phone: { contains: input.search } },
            { destination: { contains: input.search, mode: "insensitive" } },
            { tourName: { contains: input.search, mode: "insensitive" } },
          ],
        }),
      };
      const [requests, total, newCount] = await Promise.all([
        ctx.db.quoteRequest.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: { client: { select: { id: true, firstName: true, lastName: true, email: true } } },
        }),
        ctx.db.quoteRequest.count({ where }),
        ctx.db.quoteRequest.count({ where: { status: "NEW" } }),
      ]);
      return { requests, total, newCount, pages: Math.ceil(total / input.limit), page: input.page };
    }),

  integrationStatus: adminOrSales.query(async ({ ctx }) => {
    const [failed, lastSent] = await Promise.all([
      ctx.db.quoteRequest.count({ where: { crmStatus: { in: ["FAILED", "DISABLED"] } } }),
      ctx.db.quoteRequest.findFirst({
        where: { crmStatus: "SENT" },
        orderBy: { crmSyncedAt: "desc" },
        select: { crmSyncedAt: true },
      }),
    ]);
    return { configured: isCrmConfigured(), provider: "hubdeviajes.com", failed, lastSentAt: lastSent?.crmSyncedAt ?? null };
  }),

  updateStatus: adminOrSales
    .input(z.object({ id: z.string(), status: statusEnum }))
    .mutation(async ({ ctx, input }) =>
      ctx.db.quoteRequest.update({ where: { id: input.id }, data: { status: input.status } })
    ),

  // Reenvía al CRM una solicitud que falló o llegó sin integración configurada
  resendToCrm: adminOrSales
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quoteRequest = await ctx.db.quoteRequest.findUnique({ where: { id: input.id } });
      if (!quoteRequest) throw new TRPCError({ code: "NOT_FOUND", message: "Solicitud no encontrada" });
      if (quoteRequest.crmStatus === "SENT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta solicitud ya está en el CRM; reenviarla crearía un lead duplicado." });
      }
      if (!isCrmConfigured()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La integración con hubdeviajes.com no está configurada (CRM_LEADS_URL / CRM_API_KEY)." });
      }
      const updated = await syncQuoteRequestToCrm(ctx.db, quoteRequest);
      if (updated.crmStatus !== "SENT") {
        throw new TRPCError({ code: "BAD_GATEWAY", message: `El CRM rechazó el envío: ${updated.crmError ?? "motivo desconocido"}` });
      }
      return updated;
    }),
});
