import { randomBytes } from "crypto";

/**
 * Generates a human-readable reference code in format: LIH-YYYY-XXXXX
 */
export function generateReferenceCode(): string {
  const currentYear = new Date().getFullYear();
  const randomChars = randomBytes(4).toString("hex").substring(0, 5).toUpperCase();
  return `LIH-${currentYear}-${randomChars}`;
}

/**
 * Generates a unique reference code for reservations with retry on collision.
 * Must be called within a Prisma transaction context (tx).
 */
export async function generateUniqueReservationRef(tx: any, maxRetries = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateReferenceCode();
    const existing = await tx.reservation.findUnique({ where: { referenceCode: code } });
    if (!existing) return code;
  }
  return `LIH-${new Date().getFullYear()}-${randomBytes(8).toString("hex").toUpperCase()}`;
}

/**
 * Generates a unique reference code for quotations with retry on collision.
 * Can be called with either a Prisma client or transaction context.
 */
export async function generateUniqueQuotationRef(db: any, maxRetries = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateReferenceCode();
    const existing = await db.quotation.findUnique({ where: { referenceCode: code } });
    if (!existing) return code;
  }
  return `LIH-${new Date().getFullYear()}-${randomBytes(8).toString("hex").toUpperCase()}`;
}

/**
 * Generates a secure token for payment links.
 * Format: PAY-{timestamp_base36}-{12_hex_chars}
 */
export function generateSecureToken(): string {
  const randomPart = randomBytes(6).toString("hex").toUpperCase();
  return `PAY-${Date.now().toString(36).toUpperCase()}-${randomPart}`;
}
