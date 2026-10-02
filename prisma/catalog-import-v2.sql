-- Additive upgrade for installations created with `prisma db push`.
-- No Tour, TourImage, pricing or itinerary rows are updated or removed.
BEGIN;
ALTER TABLE "CatalogImport" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
ALTER TABLE "CatalogImport" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CatalogImport" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);
ALTER TABLE "CatalogImport" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "CatalogImport" ADD COLUMN IF NOT EXISTS "lastError" TEXT;
ALTER TABLE "CatalogImport" ADD COLUMN IF NOT EXISTS "extractionJson" JSONB;
ALTER TABLE "CatalogImportTour" ADD COLUMN IF NOT EXISTS "sourceIndex" INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS "CatalogImportTour_importId_sourceIndex_key" ON "CatalogImportTour"("importId", "sourceIndex");
COMMIT;
