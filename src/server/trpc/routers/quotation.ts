import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, roleProtectedProcedure } from "../trpc";
import { sendEmail } from "../../../lib/mail";
import { generateUniqueQuotationRef, generateSecureToken } from "@/server/lib/references";

const adminOrSales = roleProtectedProcedure(["ADMIN", "SALES"]);

const quotationListSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  status: z.enum(["DRAFT", "SENT", "VIEWED", "ACCEPTED", "CONVERTED", "EXPIRED"]).optional(),
  search: z.string().optional(),
});

const quotationItemSchema = z.object({
  tourId: z.string().optional(),
  descriptionEs: z.string().min(1),
  descriptionEn: z.string().optional(),
  adults: z.number().min(1).default(1),
  children: z.number().min(0).default(0),
  unitPrice: z.number().min(0),
  quantity: z.number().min(1).default(1),
  subtotal: z.number().min(0),
  sortOrder: z.number().default(0),
});

const quotationCreateSchema = z.object({
  clientId: z.string(),
  titleEs: z.string().min(1),
  titleEn: z.string().optional(),
  notesEs: z.string().optional(),
  notesEn: z.string().optional(),
  currency: z.literal("USD").default("USD"),
  totalAmount: z.number().min(0),
  customAmount: z.number().optional(),
  validUntil: z.string().transform((s) => new Date(s)),
  depositPercent: z.number().min(0).max(100).optional(),
  items: z.array(quotationItemSchema).min(1).max(50),
});

export const quotationRouter = router({
  list: protectedProcedure
    .input(quotationListSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, status, search } = input;
      const skip = (page - 1) * limit;

      const userId = ctx.user.id;
      const userRole = ctx.user.role;
      const isAdmin = userRole === "ADMIN";

      const where = {
        ...(status && { status }),
        // Non-admin users only see their own quotations
        ...(!isAdmin && { createdByUserId: userId }),
        ...(search && {
          OR: [
            { referenceCode: { contains: search, mode: "insensitive" as const } },
            { titleEs: { contains: search, mode: "insensitive" as const } },
            { client: { firstName: { contains: search, mode: "insensitive" as const } } },
            { client: { lastName: { contains: search, mode: "insensitive" as const } } },
          ],
        }),
      };

      const [quotations, total] = await Promise.all([
        ctx.db.quotation.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            client: { select: { firstName: true, lastName: true, email: true } },
            createdBy: { select: { name: true } },
            _count: { select: { items: true } },
          },
        }),
        ctx.db.quotation.count({ where }),
      ]);

      return {
        quotations: quotations.map(q => ({
          ...q,
          referenceCode: isAdmin ? q.referenceCode : (q.referenceCode.length > 8 ? q.referenceCode.slice(0, Math.min(9, q.referenceCode.length - 4)) + "****" : "****")
        })),
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const quotation = await ctx.db.quotation.findUnique({
        where: { id: input.id },
        include: {
          client: true,
          createdBy: { select: { id: true, name: true, email: true } },
          items: {
            orderBy: { sortOrder: "asc" },
            include: { tour: { select: { nameEs: true, slug: true } } },
          },
        },
      });

      if (!quotation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cotización no encontrada" });
      }

      const userId = ctx.user.id;
      const userRole = ctx.user.role;

      // Non-admin can only view their own quotations
      if (userRole !== "ADMIN" && quotation.createdByUserId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes acceso a esta cotización" });
      }

      if (userRole !== "ADMIN") {
        quotation.referenceCode = quotation.referenceCode.length > 8 ? quotation.referenceCode.slice(0, Math.min(9, quotation.referenceCode.length - 4)) + "****" : "****";
      }

      return quotation;
    }),

  create: adminOrSales
    .input(quotationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { items, ...data } = input;

      // Validate subtotals and total server-side
      let computedTotal = 0;
      const validatedItems = items.map((item, index) => {
        const expectedSubtotal = Math.round(item.unitPrice * item.quantity * 100) / 100;
        if (Math.abs(expectedSubtotal - item.subtotal) > 0.01) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Subtotal del item "${item.descriptionEs}" no coincide: esperado ${expectedSubtotal}, recibido ${item.subtotal}`,
          });
        }
        computedTotal += expectedSubtotal;
        return { ...item, subtotal: expectedSubtotal, descriptionEn: item.descriptionEn ?? "", sortOrder: item.sortOrder || index };
      });

      computedTotal = Math.round(computedTotal * 100) / 100;
      if (Math.abs(computedTotal - data.totalAmount) > 0.01 && !data.customAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `El total (${data.totalAmount}) no coincide con la suma de items (${computedTotal})`,
        });
      }

      // Wrap in transaction to ensure atomicity (quotation + items)
      return ctx.db.$transaction(async (tx) => {
        const referenceCode = await generateUniqueQuotationRef(tx);

        return tx.quotation.create({
          data: {
            ...data,
            referenceCode,
            createdByUserId: userId,
            items: {
              create: validatedItems,
            },
          },
          include: { items: true },
        });
      });
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["DRAFT", "SENT", "VIEWED", "ACCEPTED", "CONVERTED", "EXPIRED"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const quotation = await ctx.db.quotation.findUnique({
        where: { id: input.id },
      });

      if (!quotation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cotización no encontrada" });
      }

      // Non-admin can only update their own quotations
      const userId = ctx.user.id;
      const userRole = ctx.user.role;
      if (userRole !== "ADMIN" && quotation.createdByUserId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes acceso a esta cotización" });
      }

      // Validate status transitions
      const VALID_QUOTATION_TRANSITIONS: Record<string, string[]> = {
        DRAFT: ["SENT"],
        SENT: ["VIEWED", "ACCEPTED", "EXPIRED"],
        VIEWED: ["ACCEPTED", "EXPIRED"],
        ACCEPTED: ["CONVERTED", "EXPIRED"],
        CONVERTED: [],
        EXPIRED: ["DRAFT"],
      };
      const allowed = VALID_QUOTATION_TRANSITIONS[quotation.status];
      if (!allowed || !allowed.includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `No se puede cambiar de ${quotation.status} a ${input.status}`,
        });
      }

      const updateData: Record<string, unknown> = { status: input.status };

      if (input.status === "SENT") updateData.sentAt = new Date();
      if (input.status === "VIEWED") updateData.viewedAt = new Date();
      if (input.status === "ACCEPTED") updateData.acceptedAt = new Date();

      return ctx.db.quotation.update({
        where: { id: input.id },
        data: updateData,
      });
    }),

  delete: roleProtectedProcedure(["ADMIN"])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify no payment links with payments exist
      const quotation = await ctx.db.quotation.findUnique({
        where: { id: input.id },
        include: { paymentLink: { select: { id: true, status: true, amountPaid: true } } },
      });
      if (!quotation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cotización no encontrada" });
      }
      const hasPayments = quotation.paymentLink && Number(quotation.paymentLink.amountPaid) > 0;
      if (hasPayments) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No se puede eliminar una cotización con pagos registrados",
        });
      }
      // Delete related payment link first, then quotation
      if (quotation.paymentLink) {
        await ctx.db.paymentLink.delete({ where: { id: quotation.paymentLink.id } });
      }
      await ctx.db.quotationItem.deleteMany({ where: { quotationId: input.id } });
      return ctx.db.quotation.delete({ where: { id: input.id } });
    }),

  sendEmail: adminOrSales
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quotation = await ctx.db.quotation.findUnique({
        where: { id: input.id },
        include: {
          client: true,
          items: { orderBy: { sortOrder: "asc" } },
        },
      });

      if (!quotation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cotizacion no encontrada" });
      }

      // Ownership check: non-admin can only send their own quotations
      const userId = ctx.user.id;
      const userRole = ctx.user.role;
      if (userRole !== "ADMIN" && quotation.createdByUserId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes acceso a esta cotización" });
      }

      if (!quotation.client.email) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "El cliente no tiene un email registrado" });
      }

      let paymentLinkId = quotation.paymentLinkId;
      let token = "";

      if (!paymentLinkId) {
        // Create a payment link if it doesn't exist
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Default to 7 days

        token = generateSecureToken();

        const itemLines = quotation.items.map((item) =>
          `- ${item.descriptionEs} (${item.adults} adultos${item.children > 0 ? `, ${item.children} ninos` : ""}) - ${quotation.currency} ${Number(item.subtotal).toFixed(2)}`
        ).join("\n");

        const descriptionEs = `Cotizacion ${quotation.referenceCode}\n\n${quotation.titleEs}\n\nDetalle:\n${itemLines}`;

        let depositAmount: number | undefined;
        let balanceAmount: number | undefined;
        const depositPercent = quotation.depositPercent ? Number(quotation.depositPercent) : undefined;
        if (depositPercent && depositPercent > 0) {
          depositAmount = Math.round((Number(quotation.totalAmount) * depositPercent) / 100 * 100) / 100;
          balanceAmount = Math.round((Number(quotation.totalAmount) - depositAmount) * 100) / 100;
        }

        const link = await ctx.db.paymentLink.create({
          data: {
            token,
            createdByUserId: quotation.createdByUserId,
            quotationId: quotation.id,
            clientName: `${quotation.client.firstName} ${quotation.client.lastName}`,
            clientEmail: quotation.client.email,
            clientPhone: quotation.client.phone,
            titleEs: quotation.titleEs,
            titleEn: quotation.titleEn || quotation.titleEs,
            descriptionEs,
            descriptionEn: descriptionEs,
            currency: quotation.currency,
            totalAmount: Number(quotation.totalAmount),
            depositRequired: !!depositPercent && depositPercent > 0,
            depositPercent,
            depositAmount,
            balanceAmount,
            expiresAt,
          },
        });

        paymentLinkId = link.id;

        await ctx.db.quotation.update({
          where: { id: quotation.id },
          data: {
            paymentLinkId: link.id,
          },
        });
      } else {
        const existingLink = await ctx.db.paymentLink.findUnique({
          where: { id: paymentLinkId },
        });
        if (existingLink) {
          token = existingLink.token;
        }
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const paymentUrl = token ? `${appUrl}/es/pagar/${token}` : "";

      // Escape HTML entities to prevent injection
      const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const clientName = esc(quotation.client.firstName);
      const refCode = esc(quotation.referenceCode);
      const title = esc(quotation.titleEs);

      const html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2>Hola ${clientName},</h2>
          <p>Te adjuntamos la cotizacion <strong>${refCode}</strong> correspondiente a: <em>${title}</em>.</p>
          <p><strong>Monto Total:</strong> ${esc(quotation.currency)} ${Number(quotation.totalAmount).toFixed(2)}</p>
          ${paymentUrl ? `<p>Para confirmar tu reserva y realizar el pago, por favor haz clic en el siguiente enlace:</p>
            <p><a href="${paymentUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 5px;">Pagar Cotizacion</a></p>` : ""}
          <p>La cotizacion es valida hasta el <strong>${quotation.validUntil.toLocaleDateString("es-PE")}</strong>.</p>
          <p>Si tienes alguna consulta, no dudes en contactarnos.</p>
          <br/>
          <p>Saludos cordiales,<br/>El equipo de Like In House</p>
        </div>
      `;

      try {
        await sendEmail({
          to: quotation.client.email,
          subject: `Cotización ${quotation.referenceCode} - ${quotation.titleEs}`,
          html,
        });
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Error al enviar el correo: ${error.message}` });
      }

      return ctx.db.quotation.update({
        where: { id: quotation.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });
    }),
});
