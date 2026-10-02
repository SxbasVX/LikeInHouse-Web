import "server-only";
import { TRPCError } from "@trpc/server";
import type { UserRole } from "@prisma/client";
import { verifyCatalogImportSecret } from "./secret";
import { cookies } from "next/headers";
import { CATALOG_ACCESS_COOKIE, verifyAccessGrant } from "./secret";

export function isCatalogImportEnabled(): boolean {
  return process.env.ENABLE_CATALOG_IMPORT === "true";
}

export function assertCatalogImportEnabled(): void {
  if (!isCatalogImportEnabled()) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "El importador de catálogos no está habilitado.",
    });
  }
}

export function assertCatalogImportRole(role: UserRole): void {
  if (role !== "DEVELOPER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No tienes permisos para usar el importador de catálogos.",
    });
  }
}

export async function assertCatalogImportGrant(userId: string): Promise<void> {
  assertCatalogImportEnabled();
  const jar = await cookies();
  if (!verifyAccessGrant(jar.get(CATALOG_ACCESS_COOKIE)?.value, userId)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Introduce el código privado para autorizar esta sesión." });
  }
}

export function assertCatalogImportSecret(candidate: string): void {
  assertCatalogImportEnabled();
  if (!verifyCatalogImportSecret(candidate)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Código de acceso inválido.",
    });
  }
}
