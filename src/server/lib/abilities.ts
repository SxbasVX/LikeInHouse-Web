import { AbilityBuilder, createMongoAbility, type MongoAbility, type InferSubjects } from "@casl/ability";
import { TRPCError } from "@trpc/server";
import type { UserRole } from "@prisma/client";

// Define the subjects (entities) in the application
type Subjects =
    | "Tour"
    | "Reservation"
    | "Quotation"
    | "PaymentLink"
    | "Client"
    | "Content"
    | "User"
    | "Setting"
    | "all";

// Define the actions
type Actions = "manage" | "create" | "read" | "update" | "delete";

export type AppAbility = MongoAbility<[Actions, Subjects]>;

/**
 * Build CASL abilities for a given user role.
 * This centralizes ALL authorization logic in one place.
 */
export function defineAbilitiesFor(role: UserRole, userId: string): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    switch (role) {
        case "ADMIN":
            // Admin can do everything
            can("manage", "all");
            break;

        case "SALES":
            // Sales can manage their own reservations, quotations, payment links, and clients
            can("read", "Tour");
            can("read", "Client");
            can("create", "Client");
            can("update", "Client");
            can("manage", "Reservation");
            can("manage", "Quotation");
            can("manage", "PaymentLink");
            // Cannot manage users, settings, or content
            cannot("manage", "User");
            cannot("manage", "Setting");
            cannot("manage", "Content");
            break;

        case "MARKETING":
            // Marketing can manage tours and content
            can("manage", "Tour");
            can("manage", "Content");
            can("read", "Reservation");
            can("read", "Client");
            can("read", "Quotation");
            // Cannot manage users, settings, payments, or reservations
            cannot("manage", "User");
            cannot("manage", "Setting");
            cannot("create", "Reservation");
            cannot("update", "Reservation");
            cannot("delete", "Reservation");
            cannot("manage", "PaymentLink");
            break;

        default:
            // No permissions by default
            break;
    }

    return build();
}

/**
 * Check if the current user owns a resource.
 * Useful for SALES agents who should only access their own data.
 */
export function isOwner(
    resourceOwnerId: string | null | undefined,
    currentUserId: string
): boolean {
    return resourceOwnerId === currentUserId;
}

/**
 * Assert ownership or admin, throwing a standard error message.
 */
export function assertOwnershipOrAdmin(
    role: UserRole,
    resourceOwnerId: string | null | undefined,
    currentUserId: string,
    resourceName: string = "recurso"
): void {
    if (role !== "ADMIN" && !isOwner(resourceOwnerId, currentUserId)) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: `No tienes acceso a este ${resourceName}`,
        });
    }
}
