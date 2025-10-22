import { test, expect } from "@playwright/test";

test.describe("Autocomplete Suggestions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Create a new project for each test
    await page.getByRole("button", { name: "New Project" }).click();
    await page.waitForSelector('h2:text("Create New Project")');
    await page.getByLabel("Project Name").fill("Autocomplete Test");
    await page.getByRole("button", { name: "Create Project" }).click();
    await page.waitForURL(/\/project\/\d+/);
  });

  const suggestionsBox = '[data-testid="suggestions-box"]';

  test("should not show suggestions immediately after object", async ({ page }) => {
    await page.locator("textarea").type("Rectangle()");
    await expect(page.locator(suggestionsBox)).not.toBeVisible();
  });

  test("should not show keyword suggestions automatically after a space", async ({ page }) => {
    await page.locator("textarea").type("Rectangle() ");
    await expect(page.locator(suggestionsBox)).not.toBeVisible();
  });

  test("should show filtered keyword suggestions after typing a partial word", async ({ page }) => {
    await page.locator("textarea").type("Rectangle() A");
    await expect(page.locator(suggestionsBox)).toBeVisible();
    await expect(page.locator(suggestionsBox)).toContainText("AS");
    await expect(page.locator(suggestionsBox)).not.toContainText("CHILD TO");
  });
  
  test("should suggest new objects after a comma and a partial word", async ({ page }) => {
    await page.locator("textarea").type("Rectangle(), L");
    await expect(page.locator(suggestionsBox)).toBeVisible();
    await expect(page.locator(suggestionsBox)).not.toContainText("Rectangle");
    await expect(page.locator(suggestionsBox)).toContainText("Line");
    await expect(page.locator(suggestionsBox)).toContainText("Layer");
  });

  test("should suggest correctly after AS", async ({ page }) => {
    await page.locator("textarea").type("Rectangle() AS my_rect CH");
    await expect(page.locator(suggestionsBox)).toBeVisible();
    await expect(page.locator(suggestionsBox)).not.toContainText("AS");
    await expect(page.locator(suggestionsBox)).toContainText("CHILD TO");
  });

  test("should suggest correctly after CHILD TO", async ({ page }) => {
    await page.locator("textarea").type("Rectangle() CHILD TO other S");
    await expect(page.locator(suggestionsBox)).toBeVisible();
    await expect(page.locator(suggestionsBox)).not.toContainText("AS");
    await expect(page.locator(suggestionsBox)).not.toContainText("CHILD TO");
    await expect(page.locator(suggestionsBox)).toContainText("SET");
  });
  
  test("should suggest correctly after AS and CHILD TO", async ({ page }) => {
    await page.locator("textarea").type("Rectangle() AS a CHILD TO b S");
    await expect(page.locator(suggestionsBox)).toBeVisible();
    await expect(page.locator(suggestionsBox)).not.toContainText("AS");
    await expect(page.locator(suggestionsBox)).not.toContainText("CHILD TO");
    await expect(page.locator(suggestionsBox)).toContainText("SET");
  });

  test("should suggest modifiers after SET and a partial word", async ({ page }) => {
    await page.locator("textarea").type("Rectangle() SET C");
    await expect(page.locator(suggestionsBox)).toBeVisible();
    await expect(page.locator(suggestionsBox)).toContainText("Color");
    await expect(page.locator(suggestionsBox)).not.toContainText("Layer");
  });

  test("should not suggest keywords after SET clause", async ({ page }) => {
    await page.locator("textarea").type("Rectangle() SET Color('red') ");
    await expect(page.locator(suggestionsBox)).not.toBeVisible();
  });

  test("should show modifier suggestions after SET with alias", async ({ page }) => {
    await page.locator("textarea").type("Rectangle() as c SET C");
    const suggestions = page.locator(suggestionsBox);
    await expect(suggestions).toBeVisible();
    await expect(suggestions).toContainText("Color");
    await expect(suggestions).not.toContainText("Layer");
  });
});