-- Revisión del catálogo con Claude: tablas nuevas. Se puede correr más de una vez.
BEGIN;

DO $$ BEGIN
  CREATE TYPE "CatalogReviewStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TourRevisionStatus" AS ENUM ('PENDING', 'PROPOSED', 'NO_CHANGES', 'APPLIED', 'DISMISSED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "CatalogReviewRun" (
  "id" TEXT NOT NULL,
  "status" "CatalogReviewStatus" NOT NULL DEFAULT 'PROCESSING',
  "batchId" TEXT,
  "batchCheckedAt" TIMESTAMP(3),
  "batchFailures" INTEGER NOT NULL DEFAULT 0,
  "referenceTourId" TEXT,
  "createdById" TEXT NOT NULL,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "CatalogReviewRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TourRevision" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "tourId" TEXT NOT NULL,
  "status" "TourRevisionStatus" NOT NULL DEFAULT 'PENDING',
  "beforeJson" JSONB NOT NULL,
  "proposalJson" JSONB,
  "appliedFields" TEXT[],
  "error" TEXT,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "estimatedCost" DECIMAL(12,6),
  "appliedAt" TIMESTAMP(3),
  "appliedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TourRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CatalogReviewRun_createdAt_idx" ON "CatalogReviewRun"("createdAt");
CREATE INDEX IF NOT EXISTS "TourRevision_runId_status_idx" ON "TourRevision"("runId", "status");
CREATE INDEX IF NOT EXISTS "TourRevision_tourId_idx" ON "TourRevision"("tourId");

DO $$ BEGIN
  ALTER TABLE "TourRevision" ADD CONSTRAINT "TourRevision_runId_fkey" FOREIGN KEY ("runId") REFERENCES "CatalogReviewRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TourRevision" ADD CONSTRAINT "TourRevision_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
