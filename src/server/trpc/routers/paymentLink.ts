import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { router, protectedProcedure, publicProcedure, rateLimitedProcedure, roleProtectedProcedure } from "../trpc";
import { RATE_LIMITS } from "@/server/lib/rate-limit";
import { createAuditLog } from "@/server/lib/audit";

const paymentLinkLimited = rateLimitedProcedure(RATE_LIMITS.paymentLink);
const adminOrSales = roleProtectedProcedure(["ADMIN", "SALES"]);

function generateSecureToken(): string {
  const randomPart = randomBytes(6).toString("hex").toUpperCase();
  return `PAY-${Date.now().toString(36).toUpperCase()}-${randomPart}`;
}

function generateReferenceCode(): string {
  const currentYear = new Date().getFullYear();
  const randomChars = randomBytes(4).toString("hex").substring(0, 5).toUpperCase();
  return `LIH-${currentYear}-${randomChars}`;
}

async function generateUniquePaymentLinkRef(db: any, maxRetries = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateReferenceCode();
    const existing = await db.reservation.findUnique({ where: { referenceCode: code } });
    if (!existing) return code;
  }
  return `LIH-${new Date().getFullYear()}-${randomBytes(8).toString("hex").toUpperCase()}`;
}

const paymentLinkCreateSchema = z.object({
  quotationId: z.string().optional(),
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  clientPhone: z.string().optional(),
  titleEs: z.string().min(1),
  titleEn: z.string().optional(),
  descriptionEs: z.string().min(1),
  descriptionEn: z.string().optional(),
  includesEs: z.array(z.string()).default([]),
  includesEn: z.array(z.string()).default([]),
  excludesEs: z.array(z.string()).default([]),
  excludesEn: z.array(z.string()).default([]),
  departureDate: z.string().optional().transform((s) => (s ? new Date(s) : undefined)),
  returnDate: z.string().optional().transform((s) => (s ? new Date(s) : undefined)),
  adults: z.number().min(1).default(1),
  children: z.number().min(0).default(0),
  currency: z.literal("USD").default("USD"),
  totalAmount: z.number().min(0.01),
  depositRequired: z.boolean().default(false),
  depositPercent: z.number().min(0).max(100).optional(),
  expiresInDays: z.number().min(1).max(90).default(7),
  termsEs: z.string().optional(),
  termsEn: z.string().optional(),
});

export const paymentLinkRouter = router({
  // Admin: list all payment links
  list: adminOrSales
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      status: z.enum(["ACTIVE", "PAID", "PARTIALLY_PAID", "EXPIRED", "CANCELLED"]).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, status, search } = input;
      const skip = (page - 1) * limit;

      const userId = (ctx.session.user as { id: string; role: string }).id;
      const userRole = (ctx.session.user as { role: string }).role;
      const isAdmin = userRole === "ADMIN";

      const where = {
        ...(status && { status }),
        ...(!isAdmin && { createdByUserId: userId }),
        ...(search && {
          OR: [
            { clientName: { contains: search, mode: "insensitive" as const } },
            { clientEmail: { contains: search, mode: "insensitive" as const } },
            { titleEs: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [links, total] = await Promise.all([
        ctx.db.paymentLink.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: { select: { name: true } },
            quotation: { select: { referenceCode: true } },
          },
        }),
        ctx.db.paymentLink.count({ where }),
      ]);

      return { links, total, pages: Math.ceil(total / limit), page };
    }),

  // Admin: create a payment link
  create: adminOrSales
    .input(paymentLinkCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;
      const userRole = (ctx.session.user as { role: string }).role;
      const { expiresInDays, quotationId, ...data } = input;

      // A12: Validate ownership if creating from a quotation
      if (quotationId) {
        const quotation = await ctx.db.quotation.findUnique({
          where: { id: quotationId },
          select: { createdByUserId: true },
        });
        if (!quotation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Cotización no encontrada" });
        }
        if (userRole !== "ADMIN" && quotation.createdByUserId !== userId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No puedes crear un link para una cotización ajena" });
        }
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const token = generateSecureToken();

      // Calculate deposit amounts using integer cents to avoid floating-point errors
      let depositAmount: number | undefined;
      let balanceAmount: number | undefined;
      if (data.depositRequired && data.depositPercent) {
        const totalCents = Math.round(data.totalAmount * 100);
        const depositCents = Math.round(totalCents * data.depositPercent / 100);
        depositAmount = depositCents / 100;
        balanceAmount = (totalCents - depositCents) / 100;
      }

      const link = await ctx.db.paymentLink.create({
        data: {
          token,
          createdByUserId: userId,
          quotationId,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientPhone: data.clientPhone,
          titleEs: data.titleEs,
          titleEn: data.titleEn || data.titleEs,
          descriptionEs: data.descriptionEs,
          descriptionEn: data.descriptionEn || data.descriptionEs,
          includesEs: data.includesEs,
          includesEn: data.includesEn,
          excludesEs: data.excludesEs,
          excludesEn: data.excludesEn,
          departureDate: data.departureDate,
          returnDate: data.returnDate,
          adults: data.adults,
          children: data.children,
          currency: data.currency,
          totalAmount: data.totalAmount,
          depositRequired: data.depositRequired,
          depositPercent: data.depositPercent,
          depositAmount,
          balanceAmount,
          expiresAt,
          termsEs: data.termsEs,
          termsEn: data.termsEn,
        },
      });

      // If created from a quotation, update quotation status and link
      if (quotationId) {
        await ctx.db.quotation.update({
          where: { id: quotationId },
          data: {
            paymentLinkId: link.id,
            status: "SENT",
            sentAt: new Date(),
          },
        });
      }

      return link;
    }),

  // Admin: create from quotation (auto-fills data)
  createFromQuotation: adminOrSales
    .input(z.object({ quotationId: z.string(), expiresInDays: z.number().min(1).default(7) }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;

      const quotation = await ctx.db.quotation.findUnique({
        where: { id: input.quotationId },
        include: {
          client: true,
          items: { orderBy: { sortOrder: "asc" }, include: { tour: { select: { nameEs: true } } } },
        },
      });

      if (!quotation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cotizacion no encontrada" });
      }

      const userRole = (ctx.session.user as { role: string }).role;
      if (userRole !== "ADMIN" && quotation.createdByUserId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No puedes crear un link para una cotización ajena" });
      }

      if (quotation.paymentLinkId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta cotizacion ya tiene un link de pago" });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      const token = generateSecureToken();

      // Build description from items
      const itemLines = quotation.items.map((item) =>
        `- ${item.descriptionEs} (${item.adults} adultos${item.children > 0 ? `, ${item.children} ninos` : ""}) - ${quotation.currency} ${Number(item.subtotal).toFixed(2)}`
      ).join("\n");

      const descriptionEs = `Cotizacion ${quotation.referenceCode}\n\n${quotation.titleEs}\n\nDetalle:\n${itemLines}`;

      let depositAmount: number | undefined;
      let balanceAmount: number | undefined;
      const depositPercent = quotation.depositPercent ? Number(quotation.depositPercent) : undefined;
      if (depositPercent && depositPercent > 0) {
        const totalCents = Math.round(Number(quotation.totalAmount) * 100);
        const depositCents = Math.round(totalCents * depositPercent / 100);
        depositAmount = depositCents / 100;
        balanceAmount = (totalCents - depositCents) / 100;
      }

      const link = await ctx.db.paymentLink.create({
        data: {
          token,
          createdByUserId: userId,
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

      // Update quotation
      await ctx.db.quotation.update({
        where: { id: quotation.id },
        data: {
          paymentLinkId: link.id,
          status: "SENT",
          sentAt: new Date(),
        },
      });

      return link;
    }),

  // Admin: cancel a payment link
  cancel: adminOrSales
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const link = await ctx.db.paymentLink.findUnique({ where: { id: input.id } });
      if (!link) throw new TRPCError({ code: "NOT_FOUND" });

      const userId = (ctx.session.user as { id: string }).id;
      const userRole = (ctx.session.user as { role: string }).role;
      if (userRole !== "ADMIN" && link.createdByUserId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No puedes cancelar este link de pago" });
      }

      return ctx.db.paymentLink.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
      });
    }),

  // PUBLIC: get payment link by token (for the payment page)
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const link = await ctx.db.paymentLink.findUnique({
        where: { token: input.token },
      });

      if (!link) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Link de pago no encontrado" });
      }

      // Check expiration
      if (link.status === "ACTIVE" && new Date() > link.expiresAt) {
        await ctx.db.paymentLink.update({
          where: { id: link.id },
          data: { status: "EXPIRED" },
        });
        link.status = "EXPIRED";
      }

      return {
        id: link.id,
        token: link.token,
        status: link.status,
        clientName: link.clientName,
        // Don't expose full email publicly - mask it
        clientEmail: link.clientEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        titleEs: link.titleEs,
        titleEn: link.titleEn,
        descriptionEs: link.descriptionEs,
        descriptionEn: link.descriptionEn,
        includesEs: link.includesEs,
        includesEn: link.includesEn,
        excludesEs: link.excludesEs,
        excludesEn: link.excludesEn,
        departureDate: link.departureDate?.toISOString() ?? null,
        returnDate: link.returnDate?.toISOString() ?? null,
        adults: link.adults,
        children: link.children,
        currency: link.currency,
        totalAmount: Number(link.totalAmount),
        depositRequired: link.depositRequired,
        depositAmount: link.depositAmount ? Number(link.depositAmount) : null,
        balanceAmount: link.balanceAmount ? Number(link.balanceAmount) : null,
        amountPaid: Number(link.amountPaid),
        expiresAt: link.expiresAt.toISOString(),
        termsEs: link.termsEs,
        termsEn: link.termsEn,
      };
    }),

  // PUBLIC: create reservation + paypal order from payment link (rate limited)
  createPayment: paymentLinkLimited
    .input(z.object({
      token: z.string(),
      payDeposit: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Wrap everything in a Serializable transaction to prevent double-payment race conditions
      return ctx.db.$transaction(async (tx) => {
        const link = await tx.paymentLink.findUnique({
          where: { token: input.token },
        });

        if (!link) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Link no encontrado" });
        }

        if (link.status !== "ACTIVE" && link.status !== "PARTIALLY_PAID") {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Este link esta ${link.status === "PAID" ? "ya pagado" : link.status === "EXPIRED" ? "expirado" : "cancelado"}` });
        }

        if (new Date() > link.expiresAt) {
          await tx.paymentLink.update({ where: { id: link.id }, data: { status: "EXPIRED" } });
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este link ha expirado" });
        }

        // Determine amount to pay (inside transaction for consistency)
        const amountToPay = input.payDeposit && link.depositRequired && link.depositAmount
          ? Number(link.depositAmount) - Number(link.amountPaid)
          : Number(link.totalAmount) - Number(link.amountPaid);

        if (amountToPay <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No hay saldo pendiente" });
        }

        // Upsert client
        const nameParts = link.clientName.split(" ");
        const firstName = nameParts[0] || link.clientName;
        const lastName = nameParts.slice(1).join(" ") || "";

        const client = await tx.client.upsert({
          where: { email: link.clientEmail },
          update: { firstName, lastName, phone: link.clientPhone },
          create: { email: link.clientEmail, firstName, lastName, phone: link.clientPhone, language: "es" },
        });

        // Create reservation with collision-safe reference code
        let referenceCode: string;

        if (link.quotationId) {
          const quotationForCode = await tx.quotation.findUnique({
            where: { id: link.quotationId },
            select: { referenceCode: true },
          });
          referenceCode = quotationForCode?.referenceCode || await generateUniquePaymentLinkRef(tx);
        } else {
          referenceCode = await generateUniquePaymentLinkRef(tx);
        }

        // Find first tour mentioned in quotation items (if any)
        let tourId: string | undefined;
        if (link.quotationId) {
          const quotation = await tx.quotation.findUnique({
            where: { id: link.quotationId },
            include: { items: { take: 1, orderBy: { sortOrder: "asc" } } },
          });
          tourId = quotation?.items[0]?.tourId ?? undefined;
        }

        // If no tour from quotation, reject - don't create fake associations
        if (!tourId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Este link de pago no tiene un tour asociado. Contacta al vendedor.",
          });
        }

        const reservation = await tx.reservation.create({
          data: {
            referenceCode,
            origin: "PAYMENT_LINK",
            status: "PENDING",
            clientId: client.id,
            tourId,
            adults: link.adults,
            children: link.children,
            currency: link.currency,
            totalAmount: amountToPay,
            paymentLinkId: link.id,
            customDescEs: link.titleEs,
          },
        });

        return { reservationId: reservation.id, referenceCode, amount: amountToPay, currency: link.currency };
      }, { isolationLevel: "Serializable" });
    }),

  // PUBLIC: mark payment link as paid after verified PayPal capture
  // Uses token-based auth (only holder of the payment link token can call this)
  markPaid: paymentLinkLimited
    .input(z.object({ token: z.string(), amountPaid: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      // Use transaction with serializable isolation to prevent race conditions
      return ctx.db.$transaction(async (tx) => {
        const link = await tx.paymentLink.findUnique({ where: { token: input.token } });
        if (!link) throw new TRPCError({ code: "NOT_FOUND" });

        if (link.status === "PAID") {
          return { status: "PAID" as const, amountPaid: Number(link.amountPaid) };
        }

        if (link.status === "CANCELLED" || link.status === "EXPIRED") {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Link is ${link.status}` });
        }

        const newAmountPaid = Number(link.amountPaid) + input.amountPaid;
        const totalAmount = Number(link.totalAmount);

        // Prevent overpaying
        if (newAmountPaid > totalAmount * 1.01) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Amount exceeds total" });
        }

        const newStatus = newAmountPaid >= totalAmount ? "PAID" : "PARTIALLY_PAID";

        await tx.paymentLink.update({
          where: { id: link.id },
          data: { amountPaid: newAmountPaid, status: newStatus },
        });

        if (link.quotationId && newStatus === "PAID") {
          await tx.quotation.update({
            where: { id: link.quotationId },
            data: { status: "CONVERTED" },
          });
        }

        return { status: newStatus, amountPaid: newAmountPaid };
      }, { isolationLevel: "Serializable" });
    }),
});
