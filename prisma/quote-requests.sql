-- Solicitudes de cotización del formulario web (aditivo: no modifica tablas existentes).
BEGIN;
-- CreateEnum
CREATE TYPE "QuoteRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CrmSyncStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DISABLED');

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "status" "QuoteRequestStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'es',
    "clientId" TEXT,
    "tourSlug" TEXT,
    "tourName" TEXT,
    "destination" TEXT,
    "travelWindow" TEXT,
    "departureDate" DATE,
    "returnDate" DATE,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "infants" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "crmStatus" "CrmSyncStatus" NOT NULL DEFAULT 'PENDING',
    "crmError" TEXT,
    "crmAttempts" INTEGER NOT NULL DEFAULT 0,
    "crmSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteRequest_status_createdAt_idx" ON "QuoteRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QuoteRequest_crmStatus_idx" ON "QuoteRequest"("crmStatus");

-- CreateIndex
CREATE INDEX "QuoteRequest_clientId_idx" ON "QuoteRequest"("clientId");

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
