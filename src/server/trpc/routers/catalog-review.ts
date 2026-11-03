import { z } from "zod";
import { after } from "next/server";
import { TRPCError } from "@trpc/server";
import { router, roleProtectedProcedure } from "../trpc";
import { assertCatalogImportGrant } from "@/server/catalog-import/access";
import { isClaudeConfigured } from "@/server/catalog-import/providers/anthropic";
import { REVIEW_GROUPS, sameGroup, tourContentSchema, type ReviewGroup } from "@/server/catalog-review/content";
import { advanceCatalogReviews, applyRevision, loadTourContent, proposalOf, ReviewError, startCatalogReview, undoRevision } from "@/server/catalog-review/service";

// Same gate as the catalog importer: DEVELOPER role plus the private code.
const authorized = roleProtectedProcedure(["DEVELOPER"]).use(async ({ ctx, next }) => {
  await assertCatalogImportGrant(ctx.user.id);
  return next({ ctx });
});
const idInput = z.object({ revisionId: z.string().cuid() });
const asTrpc = (error: unknown): never => {
  if (error instanceof ReviewError) throw new TRPCError({ code: "PRECONDITION_FAILED", message: error.message });
  throw error;
};

export const catalogReviewRouter = router({
  overview: authorized.query(async ({ ctx }) => {
    // While someone watches, finished Claude batches are collected after the response is sent.
    after(() => advanceCatalogReviews().catch(() => undefined));
    const [run, activeTours] = await Promise.all([
      ctx.db.catalogReviewRun.findFirst({ orderBy: { createdAt: "desc" }, include: {
        revisions: { orderBy: { tour: { nameEs: "asc" } }, select: {
          id: true, status: true, error: true, appliedFields: true, appliedAt: true, proposalJson: true, estimatedCost: true,
          tour: { select: { id: true, nameEs: true, slug: true, status: true, destination: true } },
        } },
      } }),
      ctx.db.tour.count({ where: { isActive: true } }),
    ]);
    return {
      activeTours, claudeReady: isClaudeConfigured(),
      run: run && { id: run.id, status: run.status, createdAt: run.createdAt, completedAt: run.completedAt, lastError: run.lastError,
        revisions: run.revisions.map(({ proposalJson, ...r }) => ({ ...r, estimatedCost: r.estimatedCost == null ? null : Number(r.estimatedCost),
          groups: proposalJson ? proposalOf(proposalJson).groups : [] })) },
    };
  }),

  start: authorized.mutation(async ({ ctx }) => {
    if (!isClaudeConfigured()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configura ANTHROPIC_API_KEY." });
    return startCatalogReview(ctx.user.id).catch(asTrpc);
  }),

  revision: authorized.input(idInput).query(async ({ ctx, input }) => {
    const revision = await ctx.db.tourRevision.findUnique({ where: { id: input.revisionId }, include: { tour: { select: { id: true, nameEs: true, slug: true, status: true } } } });
    if (!revision) throw new TRPCError({ code: "NOT_FOUND" });
    const before = tourContentSchema.parse(revision.beforeJson);
    const proposal = revision.proposalJson ? proposalOf(revision.proposalJson) : null;
    const current = await loadTourContent(ctx.db, revision.tourId);
    // Groups edited in Tours since Claude read the tour can't be applied without overwriting that work.
    const editedSince = current ? REVIEW_GROUPS.filter((g) => !sameGroup(current, before, g)) : [...REVIEW_GROUPS];
    const siblings = await ctx.db.tourRevision.findMany({ where: { runId: revision.runId, status: "PROPOSED" }, orderBy: { tour: { nameEs: "asc" } }, select: { id: true } });
    return { id: revision.id, status: revision.status, error: revision.error, appliedFields: revision.appliedFields as ReviewGroup[], tour: revision.tour,
      before, proposal, editedSince, nextPending: siblings.find((s) => s.id !== revision.id)?.id ?? null };
  }),

  applyChanges: authorized.input(idInput.extend({ groups: z.array(z.enum(REVIEW_GROUPS)).min(1) })).mutation(async ({ ctx, input }) =>
    applyRevision(input.revisionId, input.groups, ctx.user.id).catch(asTrpc)),

  undo: authorized.input(idInput).mutation(async ({ ctx, input }) => undoRevision(input.revisionId, ctx.user.id).catch(asTrpc)),

  dismiss: authorized.input(idInput).mutation(async ({ ctx, input }) => {
    const result = await ctx.db.tourRevision.updateMany({ where: { id: input.revisionId, status: "PROPOSED" }, data: { status: "DISMISSED" } });
    if (!result.count) throw new TRPCError({ code: "CONFLICT", message: "Esta propuesta ya no está pendiente." });
    return { success: true };
  }),
});
