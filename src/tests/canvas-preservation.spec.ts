import { test, expect } from "@playwright/test";


test.describe("Canvas Preservation Workflow", () => {
  test("should only restore canvas when editor tab is active", async ({ page }) => {
    await page.goto("/");

    // 1. Create a project and draw something
    await page.getByRole("button", { name: "New Project" }).click();
    await page.getByLabel("Project Name").fill("Canvas Preservation Test");
    await page.getByRole("button", { name: "Create Project" }).click();
    await page.waitForURL(/.+\/project\/\d+/);

    await page.locator("textarea").fill("Rectangle(x: 0, y: 0)");
    await page.getByRole("button", { name: "Create" }).click();
    const canvasSelector = "#defaultCanvas0";
    await expect(page.locator(canvasSelector)).toBeVisible();

    // 2. Go to Brushes tab, canvas should be preserved (moved to graveyard)
    await page.getByRole("tab", { name: "Brushes" }).click();
    await expect(page.locator(canvasSelector)).not.toBeVisible();
    const graveyard = page.locator("#canvas-graveyard");
    await expect(graveyard.locator(canvasSelector)).toHaveCount(1);

    // 3. Go to Brush Editor
    await page.getByRole("button", { name: "Create New Brush" }).click();
    await page.getByLabel("Brush Name").fill("dummy-brush");
    await page.getByRole("button", { name: "Create Brush" }).click();
    await page.waitForURL(/.+\/brush\/dummy-brush/);

    // 4. Go back to Workspace (lands on Brushes tab)
    await page.getByTestId("back-to-workspace").click();
    await page.waitForURL(/.+\/project\/\d+/);
    await expect(page.getByRole("tab", { name: "Brushes", selected: true })).toBeVisible();

    // 5. Assert canvas is NOT in the main container, but IS in the graveyard
    await expect(page.locator(canvasSelector)).not.toBeVisible();
    await expect(graveyard.locator(canvasSelector)).toHaveCount(1);

    // 6. Switch to Editor tab
    await page.getByRole("tab", { name: "Editor" }).click();

    await page.pause();

    // 7. Assert canvas is now visible and NOT in the graveyard
    await expect(page.locator(canvasSelector)).toBeVisible();
    await expect(graveyard.locator(canvasSelector)).toHaveCount(0);
  });
});