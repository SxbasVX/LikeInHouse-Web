-- Web familiar (familia.likeinhouseperu.com). Cambio aditivo para bases creadas con `prisma db push`.
-- No modifica ni borra datos existentes: todos los tours quedan como no familiares
-- y todas las reservas existentes quedan como de la web general.
BEGIN;
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "isFamily" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "minAge" INTEGER;
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "recommendedAgeMin" INTEGER;
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "recommendedAgeMax" INTEGER;
CREATE INDEX IF NOT EXISTS "Tour_isFamily_status_idx" ON "Tour"("isFamily", "status");

DO $$ BEGIN
  CREATE TYPE "BookingSite" AS ENUM ('GENERAL', 'FAMILY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "site" "BookingSite" NOT NULL DEFAULT 'GENERAL';
CREATE INDEX IF NOT EXISTS "Reservation_site_idx" ON "Reservation"("site");
COMMIT;
