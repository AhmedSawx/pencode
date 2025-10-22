import { test, expect } from "@playwright/test";
import { encodePenbrush } from "@/lib/brush-format";
import type { Brush } from "@/mocks/types";

test.describe("Brush Import", () => {
  test("should allow importing a .penbrush file", async ({ page }) => {
    await page.goto("/");

    // 1. Create a project
    await page.waitForSelector('button:has-text("New Project")', { state: 'visible' });
    await page.getByRole("button", { name: "New Project" }).click();
    await page.getByLabel("Project Name").fill("Brush Import Test");
    await page.getByRole("button", { name: "Create Project" }).click();
    await page.waitForURL(/.+\/project\/\d+/);

    // 2. Go to the Brushes tab
    await page.getByRole("tab", { name: "Brushes" }).click();

    // 3. Create a mock brush file in memory
    const mockBrush: Brush = {
      name: "MyImportedBrush",
      type: "custom",
      weight: 10,
      opacity: 200,
      spacing: 1,
      blend: false,
      rotate: "random",
      tip: "_m.ellipse(0, 0, 10, 10);",
      pressure: {
        type: "standard",
        min_max: [1, 1.5],
        curve: [0.5, 0.5],
      },
    };
    const binaryData = encodePenbrush(mockBrush);

    // 4. Set the file input
    const fileInput = page.locator('input[type="file"][accept=".penbrush"]');
    await fileInput.setInputFiles({
      name: "my-brush.penbrush",
      mimeType: "application/octet-stream",
      buffer: Buffer.from(binaryData),
    });

    // 5. Assert that the new brush card is visible
    const newBrushCard = page.locator('div[data-slot="card"]:has(h3:text("MyImportedBrush"))');
    await expect(newBrushCard).toBeVisible();
  });
});
