-- Gestión de usuarios del panel desde el SQL Editor de Neon.
-- NO ejecutes este archivo completo: copia SOLO el bloque que necesites y reemplaza <EMAIL>, <CLAVE>, etc.
-- Las sesiones viven en la tabla "Session" y el rol se lee de "User" en cada petición:
-- lo que cambies aquí se aplica al instante. Los emails se guardan siempre en minúsculas.
DO $$ BEGIN RAISE EXCEPTION 'No ejecutes el archivo completo: copia solo el bloque que necesites.'; END $$;

-- 0. Una sola vez, para poder crear contraseñas desde SQL:
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ver usuarios, rol, estado y sesiones abiertas
SELECT u.email, u.name, u.role, u."isActive", u."lastLoginAt",
       COUNT(s.id) FILTER (WHERE s."expiresAt" > NOW()) AS sesiones_abiertas
FROM "User" u LEFT JOIN "Session" s ON s."userId" = u.id
GROUP BY u.id ORDER BY u.email;

-- 2. Cambiar la contraseña y cerrar sus sesiones abiertas
--    <CLAVE>: al menos 8 caracteres, con mayúscula, minúscula y número.
BEGIN;
UPDATE "Account" SET "password" = crypt('<CLAVE>', gen_salt('bf', 12)), "updatedAt" = NOW()
WHERE "providerId" = 'credential' AND "userId" = (SELECT id FROM "User" WHERE email = lower('<EMAIL>'));
DELETE FROM "Session" WHERE "userId" = (SELECT id FROM "User" WHERE email = lower('<EMAIL>'));
COMMIT;

-- 3. Cambiar el rol: <ROL> = ADMIN, SALES, MARKETING o DEVELOPER
UPDATE "User" SET role = '<ROL>', "updatedAt" = NOW() WHERE email = lower('<EMAIL>');

-- 4. Desactivar una cuenta y sacarla del panel ya mismo
BEGIN;
UPDATE "User" SET "isActive" = false, "updatedAt" = NOW() WHERE email = lower('<EMAIL>');
DELETE FROM "Session" WHERE "userId" = (SELECT id FROM "User" WHERE email = lower('<EMAIL>'));
COMMIT;

-- 5. Reactivar una cuenta
UPDATE "User" SET "isActive" = true, "updatedAt" = NOW() WHERE email = lower('<EMAIL>');

-- 6. Cerrar todas las sesiones de alguien (sin cambiar nada más)
DELETE FROM "Session" WHERE "userId" = (SELECT id FROM "User" WHERE email = lower('<EMAIL>'));

-- 7. Crear un usuario nuevo: <NOMBRE>, <EMAIL>, <ROL>, <CLAVE>
BEGIN;
WITH nuevo AS (
  INSERT INTO "User" (id, name, email, role, "isActive", "emailVerified", "createdAt", "updatedAt")
  VALUES (gen_random_uuid()::text, '<NOMBRE>', lower('<EMAIL>'), '<ROL>', true, true, NOW(), NOW())
  RETURNING id
)
INSERT INTO "Account" (id, "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, nuevo.id, 'credential', nuevo.id, crypt('<CLAVE>', gen_salt('bf', 12)), NOW(), NOW() FROM nuevo;
COMMIT;

-- 8. Después de migrar y comprobar que todos entran: borrar los hashes viejos de NextAuth
UPDATE "User" SET "passwordHash" = NULL WHERE "passwordHash" IS NOT NULL;
