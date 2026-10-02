import "server-only";
import { TRPCError } from "@trpc/server";
import type { UserRole } from "@prisma/client";
import { verifyCatalogImportSecret } from "./secret";

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
  if (role !== "DEVELOPER" && role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No tienes permisos para usar el importador de catálogos.",
    });
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
