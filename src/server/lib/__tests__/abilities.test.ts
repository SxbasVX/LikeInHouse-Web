import { describe, it, expect } from "vitest";
import { defineAbilitiesFor, isOwner, assertOwnershipOrAdmin } from "../abilities";

describe("CASL Abilities", () => {
    describe("ADMIN role", () => {
        const ability = defineAbilitiesFor("ADMIN", "admin-user-id");

        it("can manage all resources", () => {
            expect(ability.can("manage", "Tour")).toBe(true);
            expect(ability.can("manage", "Reservation")).toBe(true);
            expect(ability.can("manage", "Quotation")).toBe(true);
            expect(ability.can("manage", "User")).toBe(true);
            expect(ability.can("manage", "Setting")).toBe(true);
            expect(ability.can("manage", "Content")).toBe(true);
            expect(ability.can("manage", "PaymentLink")).toBe(true);
        });
    });

    describe("SALES role", () => {
        const ability = defineAbilitiesFor("SALES", "sales-user-id");

        it("can manage reservations", () => {
            expect(ability.can("manage", "Reservation")).toBe(true);
        });

        it("can manage quotations", () => {
            expect(ability.can("manage", "Quotation")).toBe(true);
        });

        it("can manage payment links", () => {
            expect(ability.can("manage", "PaymentLink")).toBe(true);
        });

        it("can read tours but not manage them", () => {
            expect(ability.can("read", "Tour")).toBe(true);
            expect(ability.can("create", "Tour")).toBe(false);
            expect(ability.can("delete", "Tour")).toBe(false);
        });

        it("cannot manage users", () => {
            expect(ability.can("manage", "User")).toBe(false);
        });

        it("cannot manage settings", () => {
            expect(ability.can("manage", "Setting")).toBe(false);
        });

        it("cannot manage content", () => {
            expect(ability.can("manage", "Content")).toBe(false);
        });
    });

    describe("MARKETING role", () => {
        const ability = defineAbilitiesFor("MARKETING", "marketing-user-id");

        it("can manage tours", () => {
            expect(ability.can("manage", "Tour")).toBe(true);
        });

        it("can manage content", () => {
            expect(ability.can("manage", "Content")).toBe(true);
        });

        it("can read reservations but not create/update/delete", () => {
            expect(ability.can("read", "Reservation")).toBe(true);
            expect(ability.can("create", "Reservation")).toBe(false);
            expect(ability.can("update", "Reservation")).toBe(false);
        });

        it("cannot manage users or settings", () => {
            expect(ability.can("manage", "User")).toBe(false);
            expect(ability.can("manage", "Setting")).toBe(false);
        });
    });
});

describe("isOwner", () => {
    it("returns true when IDs match", () => {
        expect(isOwner("user-123", "user-123")).toBe(true);
    });

    it("returns false when IDs differ", () => {
        expect(isOwner("user-123", "user-456")).toBe(false);
    });

    it("returns false when resource owner is null", () => {
        expect(isOwner(null, "user-123")).toBe(false);
    });
});
