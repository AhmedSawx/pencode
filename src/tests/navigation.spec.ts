import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should navigate to settings page and stay there", async ({ page }) => {
    // Listen for all console events and log them to the test output
    page.on('console', msg => console.log(`Browser Console: ${msg.text()}`));

    await page.goto("/");

    // Create a new project to get into a workspace
    await page.waitForSelector('button:has-text("New Project")', { state: 'visible' });
    await page.getByRole("button", { name: "New Project" }).click();
    await page.waitForSelector('h2:text("Create New Project")');
    await page.getByLabel("Project Name").fill("Navigation Test Project");
    await page.getByRole("button", { name: "Create Project" }).click();

    // Wait for workspace to load
    await page.waitForURL(/\/project\/\d+/);
    await expect(page.locator('nav[aria-label="breadcrumb"]')).toContainText(
      "Navigation Test Project",
    );

    // Click the settings button
    await page.getByRole("link", { name: "Settings" }).click();

    // Assert that the URL is /settings
    await expect(page).toHaveURL("/settings");

    // Add a small delay to see if it redirects
    await page.waitForTimeout(1000);

    // Assert that the URL is still /settings
    await expect(page).toHaveURL("/settings");
    await expect(page.locator('nav[aria-label="breadcrumb"]')).toContainText(
      "Settings",
    );
  });

  test("home button should have stateful navigation", async ({ page }) => {
    await page.goto("/");

    // Create a project
    await page.getByRole("button", { name: "New Project" }).click();
    await page.getByLabel("Project Name").fill("Stateful Home Test");
    await page.getByRole("button", { name: "Create Project" }).click();
    await page.waitForURL(/\/project\/(\d+)/);
    const url = page.url();

    // 1. From workspace -> settings
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL("/settings");

    // 2. From settings -> workspace (via Home button)
    await page.getByRole("button", { name: "Home" }).click();
    await expect(page).toHaveURL(url); // Should go back to the project

    // 3. From workspace -> home page (via Home button)
    await page.getByRole("button", { name: "Home" }).click();
    // It's a new draft project, so a dialog should appear
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.getByRole("button", { name: "Delete Draft" }).click();
    await expect(page).toHaveURL("/");
  });

  test("should not implicitly save changes on re-activation", async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    await page.goto("/");

    // 1. Create project and make an initial save
    await page.getByRole("button", { name: "New Project" }).click();
    await page.getByLabel("Project Name").fill("Implicit Save Test");
    await page.getByRole("button", { name: "Create Project" }).click();
    await page.waitForURL(/\/project\/(\d+)/);
    const projectUrl = page.url();

    const initialCode = "Rectangle(x: 10)";
    await page.locator("textarea").fill(initialCode);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Saved!" })).toBeVisible();

    // 2. Make an unsaved change
    const unsavedChange = "\nLine(x: 20)";
    await page.locator("textarea").type(unsavedChange);
    await expect(page.locator("textarea")).toHaveValue(initialCode + unsavedChange);

    // 3. Go to Settings, then back to the project
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL("/settings");
    await page.getByRole("button", { name: "Home" }).click();
    await expect(page).toHaveURL(projectUrl);

    // 4. Verify the unsaved change is still present
    await expect(page.locator("textarea")).toHaveValue(initialCode + unsavedChange);

    // 5. Go to Home and expect the dialog
    await page.getByRole("button", { name: "Home" }).click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Unsaved Changes");

    // 6. Discard changes
    await page.getByRole("button", { name: "Discard Changes" }).click();
    await expect(page).toHaveURL("/");

    // 7. Re-enter project and verify changes are gone
    await page.getByRole("link", { name: "Implicit Save Test" }).first().click();
    await expect(page).toHaveURL(projectUrl);
    await expect(page.locator("textarea")).toHaveValue(initialCode);
  });
});
