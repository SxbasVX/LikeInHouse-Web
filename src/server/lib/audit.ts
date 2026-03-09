import { db } from "./db";
import { Prisma } from "@prisma/client";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGIN_FAILED"
  | "STATUS_CHANGE"
  | "PAYMENT_VERIFIED"
  | "PAYMENT_CAPTURED"
  | "PAYMENT_LINK_CREATED"
  | "PAYMENT_LINK_PAID"
  | "RESERVATION_CANCELLED"
  | "TOUR_PUBLISHED"
  | "TOUR_UNPUBLISHED"
  | "USER_DEACTIVATED"
  | "USER_ACTIVATED"
  | "CRON_AUTO_CANCEL"
  | "WEBHOOK_REJECTED"
  | "WEBHOOK_PAYMENT"
  | "WEBHOOK_ERROR"
  | "OVERBOOKING_PREVENTED"
  | "WHATSAPP_ERROR";

export interface AuditLogParams {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  changes?: Prisma.InputJsonValue;
  ipAddress?: string;
}

/**
 * Create an audit log entry. Fire-and-forget — does not throw on failure.
 * userId can be a real user ID or a system actor name (e.g. "system-cron").
 * The FK relation was removed to allow system actor strings.
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        changes: params.changes ?? undefined,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (error) {
    // Never let audit logging break business logic
    console.error("[AuditLog] Failed to write audit log:", error);
  }
}

/**
 * Create audit log using a transaction client (for use inside $transaction).
 */
export async function createAuditLogTx(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  params: AuditLogParams
): Promise<void> {
  try {
    await tx.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        changes: params.changes ?? Prisma.JsonNull,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (error) {
    console.error("[AuditLog] Failed to write audit log in transaction:", error);
  }
}
