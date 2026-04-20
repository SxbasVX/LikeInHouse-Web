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
 * Uses 128 bits of pure randomness (no predictable components).
 */
export function generateSecureToken(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Generates a unique correlative code for the complaint book (Libro de Reclamaciones)
 * Format: LR-YYYY-NNNNN (e.g. LR-2026-00001)
 * Uses current year + zero-padded sequence based on year count.
 */
export async function generateUniqueComplaintCode(db: any, maxRetries = 5): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear + 1, 0, 1);
  const count = await db.complaintBook.count({
    where: { createdAt: { gte: yearStart, lt: yearEnd } },
  });
  for (let i = 0; i < maxRetries; i++) {
    const seq = (count + 1 + i).toString().padStart(5, "0");
    const code = `LR-${currentYear}-${seq}`;
    const existing = await db.complaintBook.findUnique({ where: { code } });
    if (!existing) return code;
  }
  return `LR-${currentYear}-${randomBytes(4).toString("hex").toUpperCase()}`;
}
