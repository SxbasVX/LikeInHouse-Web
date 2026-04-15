import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { router, protectedProcedure, roleProtectedProcedure } from "../trpc";
import { sanitizeHtml } from "@/server/lib/sanitize";
import { CACHE_TAGS } from "@/server/lib/cache";

const adminOrMarketing = roleProtectedProcedure(["ADMIN", "MARKETING"]);
const adminOrSales = roleProtectedProcedure(["ADMIN", "SALES"]);

export const contentRouter = router({
  // ===== FAQs =====
  faqList: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.fAQ.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
  }),

  faqCreate: adminOrMarketing
    .input(z.object({
      questionEs: z.string().min(1),
      questionEn: z.string().min(1),
      answerEs: z.string().min(1),
      answerEn: z.string().min(1),
      category: z.string().optional(),
      sortOrder: z.number().default(0),
      isPublished: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.fAQ.create({
        data: {
          ...input,
          answerEs: sanitizeHtml(input.answerEs),
          answerEn: sanitizeHtml(input.answerEn),
        },
      });
      revalidateTag(CACHE_TAGS.content);
      return result;
    }),

  faqUpdate: adminOrMarketing
    .input(z.object({
      id: z.string(),
      questionEs: z.string().min(1).optional(),
      questionEn: z.string().min(1).optional(),
      answerEs: z.string().min(1).optional(),
      answerEn: z.string().min(1).optional(),
      category: z.string().optional(),
      sortOrder: z.number().optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (data.answerEs) data.answerEs = sanitizeHtml(data.answerEs);
      if (data.answerEn) data.answerEn = sanitizeHtml(data.answerEn);
      const result = await ctx.db.fAQ.update({ where: { id }, data });
      revalidateTag(CACHE_TAGS.content);
      return result;
    }),

  faqDelete: adminOrMarketing
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.fAQ.delete({ where: { id: input.id } });
      revalidateTag(CACHE_TAGS.content);
      return result;
    }),

  // ===== Testimonios =====
  testimonialList: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.testimonial.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  testimonialUpdate: adminOrMarketing
    .input(z.object({
      id: z.string(),
      isApproved: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = await ctx.db.testimonial.update({ where: { id }, data });
      revalidateTag(CACHE_TAGS.content);
      return result;
    }),

  testimonialDelete: adminOrMarketing
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.testimonial.delete({ where: { id: input.id } });
      revalidateTag(CACHE_TAGS.content);
      return result;
    }),

  // ===== Blog Posts =====
  blogList: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        ctx.db.blogPost.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            slug: true,
            titleEs: true,
            titleEn: true,
            excerptEs: true,
            category: true,
            isPublished: true,
            publishedAt: true,
            coverImageUrl: true,
            createdAt: true,
          },
        }),
        ctx.db.blogPost.count(),
      ]);

      return { posts, total, pages: Math.ceil(total / limit), page };
    }),

  blogGetById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.blogPost.findUnique({ where: { id: input.id } });
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post no encontrado" });
      }
      return post;
    }),

  blogTogglePublish: adminOrMarketing
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.blogPost.findUnique({ where: { id: input.id } });
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post no encontrado" });
      }

      return ctx.db.blogPost.update({
        where: { id: input.id },
        data: {
          isPublished: !post.isPublished,
          publishedAt: !post.isPublished ? new Date() : null,
        },
      });
    }),

  blogCreate: adminOrMarketing
    .input(z.object({
      slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
      titleEs: z.string().min(1),
      titleEn: z.string().min(1),
      excerptEs: z.string().min(1),
      excerptEn: z.string().min(1),
      contentEs: z.string().min(1),
      contentEn: z.string().min(1),
      coverImageUrl: z.string().optional(),
      category: z.string().optional(),
      isPublished: z.boolean().default(false),
      metaTitleEs: z.string().optional(),
      metaDescEs: z.string().optional(),
      metaTitleEn: z.string().optional(),
      metaDescEn: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Use transaction to prevent slug race condition
      const result = await ctx.db.$transaction(async (tx) => {
        const existing = await tx.blogPost.findUnique({ where: { slug: input.slug } });
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Ya existe un post con ese slug" });
        }

        return tx.blogPost.create({
          data: {
            ...input,
            contentEs: sanitizeHtml(input.contentEs),
            contentEn: sanitizeHtml(input.contentEn),
            publishedAt: input.isPublished ? new Date() : null,
          },
        });
      });
      revalidateTag(CACHE_TAGS.blog);
      return result;
    }),

  blogUpdate: adminOrMarketing
    .input(z.object({
      id: z.string(),
      slug: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
      titleEs: z.string().min(1).optional(),
      titleEn: z.string().min(1).optional(),
      excerptEs: z.string().min(1).optional(),
      excerptEn: z.string().min(1).optional(),
      contentEs: z.string().optional(),
      contentEn: z.string().optional(),
      coverImageUrl: z.string().optional(),
      category: z.string().optional(),
      metaTitleEs: z.string().optional(),
      metaDescEs: z.string().optional(),
      metaTitleEn: z.string().optional(),
      metaDescEn: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      if (data.contentEs) data.contentEs = sanitizeHtml(data.contentEs);
      if (data.contentEn) data.contentEn = sanitizeHtml(data.contentEn);

      // Wrap in transaction to prevent TOCTOU slug race condition
      const result = await ctx.db.$transaction(async (tx) => {
        const post = await tx.blogPost.findUnique({ where: { id } });
        if (!post) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post no encontrado" });
        }

        if (data.slug && data.slug !== post.slug) {
          const slugExists = await tx.blogPost.findUnique({ where: { slug: data.slug } });
          if (slugExists) {
            throw new TRPCError({ code: "CONFLICT", message: "Ya existe un post con ese slug" });
          }
        }

        return tx.blogPost.update({ where: { id }, data });
      });

      revalidateTag(CACHE_TAGS.blog);
      return result;
    }),

  blogDelete: adminOrMarketing
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.blogPost.delete({ where: { id: input.id } });
      revalidateTag(CACHE_TAGS.blog);
      return result;
    }),

  // ===== Home Sections =====
  homeSectionList: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.homeSection.findMany({
      orderBy: { sortOrder: "asc" },
    });
  }),

  homeSectionToggleVisible: adminOrMarketing
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const section = await ctx.db.homeSection.findUnique({ where: { id: input.id } });
      if (!section) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sección no encontrada" });
      }

      const result = await ctx.db.homeSection.update({
        where: { id: input.id },
        data: { isVisible: !section.isVisible },
      });
      revalidateTag(CACHE_TAGS.content);
      return result;
    }),

  homeSectionUpdate: adminOrMarketing
    .input(z.object({
      id: z.string(),
      titleEs: z.string().optional(),
      titleEn: z.string().optional(),
      subtitleEs: z.string().optional(),
      subtitleEn: z.string().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.homeSection.update({
        where: { id: input.id },
        data: {
          titleEs: input.titleEs,
          titleEn: input.titleEn,
          subtitleEs: input.subtitleEs,
          subtitleEn: input.subtitleEn,
          imageUrl: input.imageUrl,
        },
      });
      revalidateTag(CACHE_TAGS.content);
      return result;
    }),

  // ===== Settings =====
  settingsList: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.setting.findMany({ orderBy: { key: "asc" } });
  }),

  settingUpsert: roleProtectedProcedure(["ADMIN"])
    .input(z.object({
      key: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.:-]+$/, "Clave inválida"),
      value: z.unknown().refine(
        (val) => {
          try { return JSON.stringify(val).length <= 10000; } catch { return false; }
        },
        { message: "El valor es demasiado grande (máximo 10KB)" }
      ),
    }))
    .mutation(async ({ ctx, input }) => {
      const jsonValue = input.value as any;
      const result = await ctx.db.setting.upsert({
        where: { key: input.key },
        create: { key: input.key, value: jsonValue },
        update: { value: jsonValue },
      });
      revalidateTag(CACHE_TAGS.settings);
      return result;
    }),

  // ===== Mensajes de Contacto =====
  contactList: adminOrSales
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(10),
      isRead: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, isRead } = input;
      const skip = (page - 1) * limit;

      const where = isRead !== undefined ? { isRead } : {};

      const [messages, total] = await Promise.all([
        ctx.db.contactMessage.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.contactMessage.count({ where }),
      ]);

      return { messages, total, pages: Math.ceil(total / limit), page };
    }),

  contactMarkRead: adminOrSales
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contactMessage.update({
        where: { id: input.id },
        data: { isRead: true },
      });
    }),

  contactDelete: roleProtectedProcedure(["ADMIN"])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contactMessage.delete({ where: { id: input.id } });
    }),

  // ===== BANNERS PROMOCIONALES =====
  bannerList: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.banner.findMany({ orderBy: { sortOrder: "asc" } });
  }),

  bannerCreate: adminOrMarketing
    .input(z.object({
      titleEs: z.string().min(1),
      titleEn: z.string().min(1),
      subtitleEs: z.string().optional(),
      subtitleEn: z.string().optional(),
      imageUrl: z.string().url(),
      linkUrl: z.string().url().optional().or(z.literal("")),
      linkTextEs: z.string().optional(),
      linkTextEn: z.string().optional(),
      isActive: z.boolean().default(true),
      startsAt: z.string().optional(),
      endsAt: z.string().optional(),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.banner.create({
        data: {
          ...input,
          linkUrl: input.linkUrl || null,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
        },
      });
    }),

  bannerUpdate: adminOrMarketing
    .input(z.object({
      id: z.string(),
      titleEs: z.string().min(1).optional(),
      titleEn: z.string().min(1).optional(),
      subtitleEs: z.string().optional(),
      subtitleEn: z.string().optional(),
      imageUrl: z.string().url().optional(),
      linkUrl: z.string().url().optional().or(z.literal("")),
      linkTextEs: z.string().optional(),
      linkTextEn: z.string().optional(),
      isActive: z.boolean().optional(),
      startsAt: z.string().optional().nullable(),
      endsAt: z.string().optional().nullable(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.banner.update({
        where: { id },
        data: {
          ...data,
          linkUrl: data.linkUrl || null,
          startsAt: data.startsAt ? new Date(data.startsAt) : data.startsAt === null ? null : undefined,
          endsAt: data.endsAt ? new Date(data.endsAt) : data.endsAt === null ? null : undefined,
        },
      });
    }),

  bannerDelete: adminOrMarketing
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.banner.delete({ where: { id: input.id } });
    }),

  // ===== DESCUENTO GLOBAL =====
  globalDiscountList: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.globalDiscount.findMany({ orderBy: { createdAt: "desc" } });
  }),

  globalDiscountCreate: adminOrMarketing
    .input(z.object({
      name: z.string().min(1),
      percent: z.number().min(1).max(99),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.globalDiscount.create({
        data: { name: input.name, percent: input.percent, isActive: false },
      });
    }),

  globalDiscountActivate: adminOrMarketing
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Desactiva todos, activa solo el seleccionado
      await ctx.db.globalDiscount.updateMany({ data: { isActive: false } });
      return ctx.db.globalDiscount.update({
        where: { id: input.id },
        data: { isActive: true },
      });
    }),

  globalDiscountDeactivate: adminOrMarketing
    .mutation(async ({ ctx }) => {
      await ctx.db.globalDiscount.updateMany({ data: { isActive: false } });
      return { success: true };
    }),

  globalDiscountDelete: adminOrMarketing
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.globalDiscount.delete({ where: { id: input.id } });
    }),
});
