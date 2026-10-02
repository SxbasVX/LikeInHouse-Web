import "server-only";
import { timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import type { UserRole } from "@prisma/client";

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

export function verifyCatalogImportSecret(candidate: string): boolean {
  const expected = process.env.CATALOG_IMPORT_SECRET;
  if (!expected || !candidate) return false;

  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length &&
    timingSafeEqual(candidateBuffer, expectedBuffer);
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
