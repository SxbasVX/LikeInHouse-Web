import { z } from "zod";
import { router, roleProtectedProcedure } from "../trpc";
import { assertCatalogImportEnabled, assertCatalogImportSecret } from "@/server/catalog-import/access";

const developerProcedure = roleProtectedProcedure(["DEVELOPER", "ADMIN"]);

export const catalogImportRouter = router({
  access: developerProcedure
    .input(z.object({ secret: z.string().min(1).max(256) }))
    .mutation(async ({ ctx, input }) => {
      assertCatalogImportEnabled();
      assertCatalogImportSecret(input.secret);
      return { success: true, userId: ctx.user.id };
    }),

  status: developerProcedure.query(async () => {
    assertCatalogImportEnabled();
    return { enabled: true };
  }),
});
