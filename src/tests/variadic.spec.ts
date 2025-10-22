import { test, expect } from "@playwright/test";

test.describe("Variadic Parameters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Create a new project for each test
    await page.waitForSelector('button:has-text("New Project")', { state: 'visible' });
    await page.getByRole("button", { name: "New Project" }).click();
    await page.waitForSelector('h2:text("Create New Project")');
    await page.getByLabel("Project Name").fill("Variadic Test");
    await page.getByRole("button", { name: "Create Project" }).click();
    await page.waitForURL(/\/project\/\d+/);
  });

  test("should correctly parse a valid spline with mixed parameters", async ({ page }) => {
    await page.locator("textarea").fill("Spline(x1: 10, y1: 20, color: 'red', x2: 100, y2: 120, weight: 2)");
    await page.waitForTimeout(500); // Wait for lint
    // No errors should be visible
    await expect(page.locator('button:has-text("0 Errors")')).toBeVisible();
  });

  test("should show an error for missing minimum points", async ({ page }) => {
    await page.locator("textarea").fill("Spline(x1: 10, y1: 20)");
    await page.waitForTimeout(500); // Wait for lint
    const errorList = page.locator('button:has-text("1 Error")');
    await expect(errorList).toBeVisible();
    await errorList.click();
    await expect(page.locator('[role="menuitem"]')).toContainText(
      'At least 2 point(s) are required, but only 1 were provided.'
    );
  });

  test("should show an error for incomplete point group (dependency)", async ({ page }) => {
    await page.locator("textarea").fill("Spline(x1: 10, y1: 20, x2: 100)");
    await page.waitForTimeout(500); // Wait for lint
    const errorList = page.locator('button:has-text("1 Error")');
    await expect(errorList).toBeVisible();
    await errorList.click();
    await expect(page.locator('[role="menuitem"]')).toContainText(
      'Parameter "y2" is missing. Each point group must be complete.'
    );
  });

  test("should show an error for non-sequential points", async ({ page }) => {
    await page.locator("textarea").fill("Spline(x1: 10, y1: 20, x3: 100, y3: 120)");
    await page.waitForTimeout(500); // Wait for lint
    const errorList = page.locator('button:has-text("1 Error")');
    await expect(errorList).toBeVisible();
    await errorList.click();
    await expect(page.locator('[role="menuitem"]')).toContainText(
      'Variadic parameter groups must be sequential. Found index 3 but expected 2.'
    );
  });

  test("should not break existing vector objects", async ({ page }) => {
    await page.locator("textarea").fill("Rectangle(x: 50, y: 50, color: 'blue')");
    await page.waitForTimeout(500); // Wait for lint
    await expect(page.locator('button:has-text("0 Errors")')).toBeVisible();
  });

  test("should show an error for variadic-like params on non-variadic objects", async ({ page }) => {
    await page.locator("textarea").fill("Rectangle(x1: 50, y1: 50)");
    await page.waitForTimeout(500); // Wait for lint
    const errorList = page.locator('button:has-text("1 Error")');
    await expect(errorList).toBeVisible();
    await errorList.click();
          await expect(page.locator('[role="menuitem"]')).toContainText(
            'Parameter "x1" is not valid for a Rectangle.'
          );  });
});