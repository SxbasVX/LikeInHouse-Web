import { timingSafeEqual } from "node:crypto";

export function verifyCatalogImportSecret(candidate: string): boolean {
  const expected = process.env.CATALOG_IMPORT_SECRET;
  if (!expected || !candidate) return false;

  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length &&
    timingSafeEqual(candidateBuffer, expectedBuffer);
}
