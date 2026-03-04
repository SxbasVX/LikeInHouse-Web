import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, roleProtectedProcedure } from "../trpc";

const adminOrMarketing = roleProtectedProcedure(["ADMIN", "MARKETING"]);

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
      return ctx.db.fAQ.create({ data: input });
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
      return ctx.db.fAQ.update({ where: { id }, data });
    }),

  faqDelete: adminOrMarketing
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.fAQ.delete({ where: { id: input.id } });
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
      return ctx.db.testimonial.update({ where: { id }, data });
    }),

  testimonialDelete: adminOrMarketing
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.testimonial.delete({ where: { id: input.id } });
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

      return ctx.db.homeSection.update({
        where: { id: input.id },
        data: { isVisible: !section.isVisible },
      });
    }),

  // ===== Settings =====
  settingsList: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.setting.findMany({ orderBy: { key: "asc" } });
  }),

  settingUpsert: roleProtectedProcedure(["ADMIN"])
    .input(z.object({
      key: z.string(),
      value: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.setting.upsert({
        where: { key: input.key },
        create: { key: input.key, value: input.value },
        update: { value: input.value },
      });
    }),
});
