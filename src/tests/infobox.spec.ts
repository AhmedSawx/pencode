import { test, expect } from "@playwright/test";

test.describe("Info Box", () => {
  test("should show info box on hover", async ({ page }) => {
    await page.goto("/");

    // Create a new project
    await page.waitForSelector('button:has-text("New Project")', { state: 'visible' });
    await page.getByRole("button", { name: "New Project" }).click();
    await page.waitForSelector('h2:text("Create New Project")');
    await page.getByLabel("Project Name").fill("Info Box Test");
    await page.getByRole("button", { name: "Create Project" }).click();
    await page.waitForURL(/\/project\/\d+/);

    // Type Rectangle
    await page.locator("textarea").type("Rectangle");

    // Hover over Rectangle
    await page.locator('textarea').hover({ position: { x: 30, y: 24 } });

    // Assert that the info box is visible and contains the correct information
    const infoBox = page.locator('[data-testid="info-box"]');
    await expect(infoBox).toBeVisible();
    await expect(infoBox).toContainText("Rectangle");
    await expect(infoBox).toContainText("Draws a rectangle on the canvas.");
    await expect(infoBox).toContainText("x");
    await expect(infoBox).toContainText("y");
    await expect(infoBox).toContainText("color");

    // Type (x: 10)
    await page.locator("textarea").type("(x: 10)");

    // Hover over x
    await page.locator('textarea').hover({ position: { x: 110, y: 24 } });

    // Assert that the info box is visible and contains the correct information
    await expect(infoBox).toBeVisible();
    await expect(infoBox).toContainText("x");
    await expect(infoBox).toContainText("The x-coordinate of the rectangle's top-left corner.");
  });
});