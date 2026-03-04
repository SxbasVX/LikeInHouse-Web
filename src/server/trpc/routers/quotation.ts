import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, roleProtectedProcedure } from "../trpc";

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
  currency: z.enum(["PEN", "USD"]).default("PEN"),
  totalAmount: z.number().min(0),
  customAmount: z.number().optional(),
  validUntil: z.string().transform((s) => new Date(s)),
  depositPercent: z.number().min(0).max(100).optional(),
  items: z.array(quotationItemSchema).min(1),
});

export const quotationRouter = router({
  list: protectedProcedure
    .input(quotationListSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, status, search } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(status && { status }),
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
        quotations,
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

      return quotation;
    }),

  create: adminOrSales
    .input(quotationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;
      const { items, ...data } = input;

      // Generar referenceCode único
      const count = await ctx.db.quotation.count();
      const referenceCode = `COT-${String(count + 1).padStart(5, "0")}`;

      return ctx.db.quotation.create({
        data: {
          ...data,
          referenceCode,
          createdByUserId: userId,
          items: {
            create: items.map((item, index) => ({
              ...item,
              descriptionEn: item.descriptionEn ?? "",
              sortOrder: item.sortOrder || index,
            })),
          },
        },
        include: { items: true },
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
      return ctx.db.quotation.delete({ where: { id: input.id } });
    }),
});
