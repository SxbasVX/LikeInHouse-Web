-- Migración NextAuth -> Better Auth. Correr en Neon justo ANTES de desplegar el código nuevo.
-- Las tablas Account/Session de NextAuth nunca se usaron (sesiones JWT): se vacían y se rehacen.
-- Las contraseñas actuales (bcrypt) se copian tal cual: nadie tiene que cambiarla.
-- Se puede correr más de una vez.

BEGIN;

-- Solo mientras las tablas tengan el formato viejo de NextAuth: al repetir el script no se borra nada de Better Auth.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Session' AND column_name = 'sessionToken') THEN
    DELETE FROM "Session";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Account' AND column_name = 'providerAccountId') THEN
    DELETE FROM "Account";
  END IF;
END $$;
DROP INDEX IF EXISTS "Account_provider_providerAccountId_key";
DROP INDEX IF EXISTS "Session_sessionToken_key";

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "image" TEXT,
  ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TABLE "Account"
  DROP COLUMN IF EXISTS "type",
  DROP COLUMN IF EXISTS "provider",
  DROP COLUMN IF EXISTS "providerAccountId",
  DROP COLUMN IF EXISTS "refresh_token",
  DROP COLUMN IF EXISTS "access_token",
  DROP COLUMN IF EXISTS "expires_at",
  DROP COLUMN IF EXISTS "token_type",
  DROP COLUMN IF EXISTS "id_token",
  DROP COLUMN IF EXISTS "session_state",
  ADD COLUMN IF NOT EXISTS "accountId" TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS "providerId" TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS "accessToken" TEXT,
  ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
  ADD COLUMN IF NOT EXISTS "idToken" TEXT,
  ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "password" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

ALTER TABLE "Session"
  DROP COLUMN IF EXISTS "sessionToken",
  DROP COLUMN IF EXISTS "expires",
  ADD COLUMN IF NOT EXISTS "token" TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3) NOT NULL,
  ADD COLUMN IF NOT EXISTS "ipAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "userAgent" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

CREATE TABLE IF NOT EXISTS "Verification" (
  "id" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Verification_identifier_idx" ON "Verification"("identifier");
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

-- Better Auth busca el email en minúsculas: un email guardado con mayúsculas ya no podría entrar.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "User" GROUP BY lower(trim(email)) HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Hay usuarios cuyo email solo difiere en mayúsculas. Unifícalos antes de migrar: SELECT lower(email), COUNT(*) FROM "User" GROUP BY 1 HAVING COUNT(*) > 1;';
  END IF;
END $$;
UPDATE "User" SET email = lower(trim(email)) WHERE email <> lower(trim(email));

-- Contraseñas actuales -> cuenta "credential" de Better Auth (no pisa una que ya exista).
INSERT INTO "Account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, u."id", 'credential', u."id", u."passwordHash", NOW(), NOW()
FROM "User" u
WHERE u."passwordHash" IS NOT NULL
ON CONFLICT ("providerId", "accountId") DO NOTHING;

COMMIT;
