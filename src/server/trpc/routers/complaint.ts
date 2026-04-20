import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { headers } from "next/headers";
import { router, protectedProcedure, roleProtectedProcedure, rateLimitedProcedure } from "../trpc";
import {
  complaintCreateSchema,
  complaintRespondSchema,
  complaintListFilterSchema,
} from "@/lib/validators/complaint";
import { generateUniqueComplaintCode } from "@/server/lib/references";
import { RATE_LIMITS } from "@/server/lib/rate-limit";
import { sendEmail } from "@/lib/mail";
import {
  consumerConfirmationEmail,
  providerNotificationEmail,
  consumerResponseEmail,
} from "@/server/email/complaint-templates";

const adminOnly = roleProtectedProcedure(["ADMIN"]);

const ADMIN_EMAIL = "administracion@likeinhouseperu.com";

export const complaintRouter = router({
  /**
   * Crea un nuevo registro en el Libro de Reclamaciones (público con rate limit).
   * Genera código correlativo LR-YYYY-NNNNN, captura IP/userAgent, envía emails.
   */
  create: rateLimitedProcedure(RATE_LIMITS.contactForm)
    .input(complaintCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const headersList = await headers();
      const userAgent = headersList.get("user-agent") || undefined;

      const code = await generateUniqueComplaintCode(ctx.db);

      const complaint = await ctx.db.complaintBook.create({
        data: {
          code,
          consumerName: input.consumerName,
          consumerDocType: input.consumerDocType,
          consumerDocNum: input.consumerDocNum,
          consumerAddress: input.consumerAddress,
          consumerPhone: input.consumerPhone ?? null,
          consumerEmail: input.consumerEmail,
          isMinor: input.isMinor,
          guardianName: input.guardianName ?? null,
          guardianDocNum: input.guardianDocNum ?? null,
          itemType: input.itemType,
          itemDescription: input.itemDescription,
          amountClaimed: input.amountClaimed ?? null,
          currency: input.currency,
          type: input.type,
          detail: input.detail,
          request: input.request,
          locale: input.locale,
          ipAddress: ctx.ip,
          userAgent,
        },
      });

      // Enviar emails (no bloqueante: se hace en paralelo, errores se loguean)
      const emailData = {
        code: complaint.code,
        consumerName: complaint.consumerName,
        consumerEmail: complaint.consumerEmail,
        consumerDocType: complaint.consumerDocType,
        consumerDocNum: complaint.consumerDocNum,
        consumerAddress: complaint.consumerAddress,
        consumerPhone: complaint.consumerPhone,
        itemType: complaint.itemType,
        itemDescription: complaint.itemDescription,
        amountClaimed: complaint.amountClaimed ? Number(complaint.amountClaimed) : null,
        currency: complaint.currency,
        type: complaint.type,
        detail: complaint.detail,
        request: complaint.request,
        createdAt: complaint.createdAt,
      };

      const consumerMail = consumerConfirmationEmail(emailData, input.locale);
      const providerMail = providerNotificationEmail(emailData);

      await Promise.allSettled([
        sendEmail({
          to: complaint.consumerEmail,
          subject: consumerMail.subject,
          html: consumerMail.html,
        }),
        sendEmail({
          to: ADMIN_EMAIL,
          subject: providerMail.subject,
          html: providerMail.html,
        }),
      ]).then((results) => {
        results.forEach((r, i) => {
          if (r.status === "rejected") {
            console.error(`[Complaint Email ${i}] Failed:`, r.reason);
          }
        });
      });

      return { code: complaint.code, id: complaint.id };
    }),

  /**
   * Consulta pública por código + email (para que el consumidor vea su reclamo).
   */
  getByCode: rateLimitedProcedure(RATE_LIMITS.publicLookup)
    .input(z.object({
      code: z.string().min(5),
      email: z.string().email(),
    }))
    .query(async ({ ctx, input }) => {
      const complaint = await ctx.db.complaintBook.findUnique({
        where: { code: input.code },
      });
      if (!complaint || complaint.consumerEmail.toLowerCase() !== input.email.toLowerCase()) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró el reclamo con ese código y email." });
      }
      return {
        code: complaint.code,
        status: complaint.status,
        type: complaint.type,
        createdAt: complaint.createdAt,
        response: complaint.response,
        respondedAt: complaint.respondedAt,
      };
    }),

  /**
   * Lista reclamos (admin).
   */
  list: adminOnly
    .input(complaintListFilterSchema)
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input?.status) where.status = input.status;
      if (input?.type) where.type = input.type;
      if (input?.search) {
        where.OR = [
          { code: { contains: input.search, mode: "insensitive" } },
          { consumerName: { contains: input.search, mode: "insensitive" } },
          { consumerEmail: { contains: input.search, mode: "insensitive" } },
          { consumerDocNum: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;

      const [items, total] = await Promise.all([
        ctx.db.complaintBook.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.complaintBook.count({ where }),
      ]);

      return { items, total, page, pageSize };
    }),

  /**
   * Obtener detalle por ID (admin).
   */
  getById: adminOnly
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const complaint = await ctx.db.complaintBook.findUnique({
        where: { id: input.id },
      });
      if (!complaint) throw new TRPCError({ code: "NOT_FOUND", message: "Reclamo no encontrado" });
      return complaint;
    }),

  /**
   * Responder un reclamo (admin). Envía email al consumidor.
   */
  respond: adminOnly
    .input(complaintRespondSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.complaintBook.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Reclamo no encontrado" });

      const updated = await ctx.db.complaintBook.update({
        where: { id: input.id },
        data: {
          status: input.status,
          response: input.response,
          respondedAt: new Date(),
          respondedBy: ctx.user.id,
        },
      });

      const mail = consumerResponseEmail(
        {
          code: updated.code,
          consumerName: updated.consumerName,
          consumerEmail: updated.consumerEmail,
          consumerDocType: updated.consumerDocType,
          consumerDocNum: updated.consumerDocNum,
          consumerAddress: updated.consumerAddress,
          consumerPhone: updated.consumerPhone,
          itemType: updated.itemType,
          itemDescription: updated.itemDescription,
          amountClaimed: updated.amountClaimed ? Number(updated.amountClaimed) : null,
          currency: updated.currency,
          type: updated.type,
          detail: updated.detail,
          request: updated.request,
          createdAt: updated.createdAt,
          response: updated.response ?? "",
          status: updated.status,
        },
        (updated.locale as "es" | "en") ?? "es"
      );

      await sendEmail({
        to: updated.consumerEmail,
        subject: mail.subject,
        html: mail.html,
      });

      return { success: true };
    }),

  /**
   * Estadísticas para dashboard admin.
   */
  stats: adminOnly.query(async ({ ctx }) => {
    const [pendiente, enProceso, resuelto, rechazado, total] = await Promise.all([
      ctx.db.complaintBook.count({ where: { status: "PENDIENTE" } }),
      ctx.db.complaintBook.count({ where: { status: "EN_PROCESO" } }),
      ctx.db.complaintBook.count({ where: { status: "RESUELTO" } }),
      ctx.db.complaintBook.count({ where: { status: "RECHAZADO" } }),
      ctx.db.complaintBook.count(),
    ]);
    return { pendiente, enProceso, resuelto, rechazado, total };
  }),
});
