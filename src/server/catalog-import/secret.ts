import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyCatalogImportSecret(candidate: string): boolean {
  const expected = process.env.CATALOG_IMPORT_SECRET;
  if (!expected || !candidate) return false;

  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length &&
    timingSafeEqual(candidateBuffer, expectedBuffer);
}

export const CATALOG_ACCESS_COOKIE = "catalog-import-access";
export const CATALOG_ACCESS_SECONDS = 30 * 60;

function signingKey(): string {
  const secret = process.env.CATALOG_IMPORT_SECRET;
  if (!secret) throw new Error("El código privado no está configurado.");
  return createHmac("sha256", secret).update(`catalog-import-v2:${process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? ""}`).digest("hex");
}

function signature(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

function same(left: string, right: string): boolean {
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createAccessGrant(userId: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ userId, expires: now + CATALOG_ACCESS_SECONDS * 1000, purpose: "access" })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyAccessGrant(value: string | undefined, userId: string, now = Date.now()): boolean {
  try {
    if (!value || value.length > 2048) return false;
    const [payload, sig, extra] = value.split(".");
    if (!payload || !sig || extra || !same(sig, signature(payload))) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.purpose === "access" && data.userId === userId && Number.isFinite(data.expires) && data.expires > now && data.expires <= now + CATALOG_ACCESS_SECONDS * 1000;
  } catch { return false; }
}

export function createPreviewToken(userId: string, candidateId: string, data: unknown, now = Date.now()): string {
  const expires = now + 10 * 60 * 1000;
  return `${expires}.${signature(JSON.stringify({ purpose: "preview", userId, candidateId, data, expires }))}`;
}

export function verifyPreviewToken(token: string, userId: string, candidateId: string, data: unknown, now = Date.now()): boolean {
  try {
    const [rawExpires, sig, extra] = token.split(".");
    const expires = Number(rawExpires);
    return !extra && Number.isFinite(expires) && expires > now && expires <= now + 10 * 60 * 1000 && Boolean(sig) && same(sig, signature(JSON.stringify({ purpose: "preview", userId, candidateId, data, expires })));
  } catch { return false; }
}
