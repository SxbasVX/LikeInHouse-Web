import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
    test("homepage loads correctly", async ({ page }) => {
        await page.goto("/es");
        await expect(page).toHaveTitle(/Like In House/i);
        // Check main content is visible
        await expect(page.locator("nav")).toBeVisible();
        await expect(page.locator("footer")).toBeVisible();
    });

    test("tours catalog page loads", async ({ page }) => {
        await page.goto("/es/tours");
        await expect(page.locator("main")).toBeVisible();
    });

    test("navigation between pages works", async ({ page }) => {
        await page.goto("/es");
        // Click on tours link in navigation
        const toursLink = page.locator('a[href*="/tours"]').first();
        if (await toursLink.isVisible()) {
            await toursLink.click();
            await page.waitForURL(/\/tours/);
            await expect(page.url()).toContain("/tours");
        }
    });

    test("404 page shows for non-existent routes", async ({ page }) => {
        const response = await page.goto("/es/nonexistent-page-xyz");
        expect(response?.status()).toBe(404);
    });
});
