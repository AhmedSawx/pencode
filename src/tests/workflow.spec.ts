// Cache-buster: 1695494400
import { test, expect } from "@playwright/test";

test.describe("PenCode Workflows", () => {
  test("should create, save, and see the project on the home page", async ({ page }) => {
    await page.goto("/");

    // 1. Click "New Project" and create a project
    await page.waitForSelector('button:has-text("New Project")', { state: 'visible' });
    await page.getByRole("button", { name: "New Project" }).click();
    await page.waitForSelector('h2:text("Create New Project")');
    await page.getByLabel("Project Name").fill("My New Saved Project");
    await page.getByRole("button", { name: "Create Project" }).click();

    // 2. Should be in the workspace
    await expect(page).toHaveURL(/\/project\/\d+/);
        await expect(page.locator('nav[aria-label="breadcrumb"]')).toContainText("Home");
        await expect(page.locator('nav[aria-label="breadcrumb"]')).toContainText("My New Saved Project");

    // 3. Type something in the editor
    await page.locator("textarea").type("Rectangle(x: 10, y: 20, color: 'red')");

    // 4. Click the "Save" button
    await page.getByRole("button", { name: "Save" }).click();

    // Wait for the save confirmation
    await expect(page.getByRole("button", { name: "Saved!" })).toBeVisible();

    // 5. Go back to the home page
    await page.getByRole("link", { name: "Home" }).click();

    // 6. Verify the project card is visible
    await expect(page).toHaveURL("/");
    await expect(
      page.locator('div.group:has-text("My New Saved Project")')
    ).toBeVisible();
  });

  test.describe("Workspace Functionality", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      // Create a new project for each test
      await page.waitForSelector('button:has-text("New Project")', { state: 'visible' });
      await page.getByRole("button", { name: "New Project" }).click();
      await page.waitForSelector('h2:text("Create New Project")');
      await page.getByLabel("Project Name").fill("Workspace Test");
      await page.getByRole("button", { name: "Create Project" }).click();
      await page.waitForURL(/\/project\/\d+/);
    });

    test.describe("Suggestions", () => {
      test("should show object suggestions", async ({ page }) => {
        await page.locator("textarea").type("R");
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).toBeVisible();
        await expect(suggestions).toContainText("Rectangle");
      });

      test("should show parameter suggestions inside parentheses", async ({ page }) => {
        await page.locator("textarea").type("Rectangle(");
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).toBeVisible();
        await expect(suggestions).toContainText("x");
        await expect(suggestions).toContainText("y");
        await expect(suggestions).toContainText("color");
        await expect(suggestions).toContainText("width");
        await expect(suggestions).toContainText("height");
      });

      test("should show parameter suggestions after a comma and partial", async ({ page }) => {
        await page.locator("textarea").type("Rectangle(x: 10, y");
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).toBeVisible();
        await expect(suggestions).toContainText("y");
        await expect(suggestions).not.toContainText("color");
      });

      test("should not show suggestions while typing a value", async ({ page }) => {
        await page.locator("textarea").type("Rectangle(x: 10");
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).not.toBeVisible();
      });

      test("should hide suggestions on ArrowRight key press", async ({ page }) => {
        await page.locator("textarea").type("R");
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).toBeVisible();
        await page.locator("textarea").press("ArrowRight");
        await expect(suggestions).not.toBeVisible();
      });

      test("should hide suggestions on ArrowLeft key press", async ({ page }) => {
        await page.locator("textarea").type("R");
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).toBeVisible();
        await page.locator("textarea").press("ArrowLeft");
        await expect(suggestions).not.toBeVisible();
      });

      test("should show no suggestions after all parameters are used", async ({ page }) => {
        await page
          .locator("textarea")
          .type("Rectangle(x: 10, y: 20, color: 'red', width: 50, height: 50, ");
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).not.toBeVisible();
      });

      test("should show modifier suggestions after SET and partial", async ({ page }) => {
        await page.locator("textarea").type("Rectangle() SET C");
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).toBeVisible();
        await expect(suggestions).toContainText("Color");
        await expect(suggestions).not.toContainText("Layer");
      });

      test("should show keyword suggestions after object and partial", async ({ page }) => {
        await page.locator("textarea").type("Rectangle() A");
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).toBeVisible();
        await expect(suggestions).toContainText("AS");
        await expect(suggestions).not.toContainText("CHILD TO");
      });

      test("should show cloning suggestions", async ({ page }) => {
        await page.locator("textarea").type("Rectangle(x:30,y:50) as a,");
        await page.locator("textarea").type("!");
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).toBeVisible();
        await expect(suggestions).toContainText("a");
      });

      test("should correctly clone an object from suggestion", async ({ page }) => {
        await page.locator("textarea").type("Rectangle(x:30,y:40) as a,");
        await page.locator("textarea").type("!");
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).toBeVisible();
        await expect(suggestions).toContainText("a");
        await page.keyboard.press("Enter"); // This selects the suggestion
        // The parser requires () for a clone operation.
        await expect(page.locator("textarea")).toHaveValue(
          "Rectangle(x:30,y:40) as a,!a()"
        );
      });

      test("should not show suggestions when editing a parameter value", async ({ page }) => {
        await page.locator("textarea").type("Rectangle");
        await page.keyboard.press("Enter"); // Should complete to Rectangle() and show suggestions

        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).toBeVisible();
        await page.locator('[data-testid="suggestions-box"] >> text=x').click();

        await expect(page.locator("textarea")).toHaveValue("Rectangle(x: 0)");

        await page.keyboard.press("Backspace");
        await page.locator("textarea").type("1");
        await expect(page.locator("textarea")).toHaveValue("Rectangle(x: 1)");

        // Suggestions should not be visible while typing a value
        await expect(suggestions).not.toBeVisible();

        // Trigger suggestions manually
        await page.keyboard.press("Control+ ");

        // Suggestions should still not be visible because we are in a value
        await expect(suggestions).not.toBeVisible();
      });

      test("should be smart about showing suggestions contextually", async ({ page }) => {
        const suggestions = page.locator('[data-testid="suggestions-box"]');

        // Setup
        await page.locator("textarea").type("Rectangle");
        await page.keyboard.press("Enter");
        await expect(suggestions).toBeVisible();
        await page.locator('[data-testid="suggestions-box"] >> text=x').click();
        await expect(page.locator("textarea")).toHaveValue("Rectangle(x: 0)");

        // Manually type a comma and partial to trigger next suggestions
        await page.locator("textarea").type(", y");

        // Suggestions for 'y' should appear and be filtered
        await expect(suggestions).toBeVisible();
        await expect(suggestions).toContainText("y");
        await expect(suggestions).not.toContainText("color");

        // Click 'y'
        await page.locator('[data-testid="suggestions-box"] >> text=y').click();

        // Assert the final value
        await expect(page.locator("textarea")).toHaveValue("Rectangle(x: 0, y: 0)");
      });

      test("should show suggestions on ctrl+space in a valid context", async ({ page }) => {
        page.on("console", (msg) => console.log(msg.text()));
        const suggestions = page.locator('[data-testid="suggestions-box"]');

        // Type the context where suggestions should appear
        await page.locator("textarea").type("Rectangle(10,20) ");

        // Suggestions should not be visible automatically
        await expect(suggestions).not.toBeVisible();

        // Manually trigger suggestions
        await page.keyboard.press("Control+ ");

        // Suggestions should now be visible
        await expect(suggestions).toBeVisible();
        await expect(suggestions).toContainText("AS");
      });

      test("should show parameter suggestions automatically after a comma", async ({ page }) => {
        await page.locator("textarea").type("Rectangle(x: 10,");
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).toBeVisible();
        await expect(suggestions).toContainText("y");
        await expect(suggestions).toContainText("color");
      });

      test("should not show parameter suggestions after a top-level comma", async ({ page }) => {
        await page.locator("textarea").type("Rectangle(x: 10), ");
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).not.toBeVisible();
      });

      test('should not show suggestions after AS and a space', async ({ page }) => {
        await page.locator("textarea").type("Rectangle() AS ");
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).not.toBeVisible();
      });

      test('should show next keywords after AS and an identifier', async ({ page }) => {
        await page.locator("textarea").type("Rectangle() AS my_rect ");
        await page.keyboard.press("Control+ "); // Manual trigger
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).toBeVisible();
        await expect(suggestions).toContainText("CHILD TO");
        await expect(suggestions).toContainText("SET");
      });

      test('should not show suggestions while typing an identifier', async ({ page }) => {
        await page.locator("textarea").type("Rectangle() AS c");
        const suggestions = page.locator('[data-testid="suggestions-box"]');
        await expect(suggestions).not.toBeVisible();
      });
    });

    test.describe("Error Reporting", () => {
      test("should show a single-line error", async ({ page }) => {
        await page
          .locator("textarea")
          .type("Rectangle(x: 10, y: 20, color: 'red',,)");
        const errorList = page.locator('button:has-text("Error")');
        await expect(errorList).toBeVisible();
        const squiggle = page.locator(".squiggle").first();
        await expect(squiggle).toBeVisible();
      });

      test("should show a multi-line error", async ({ page }) => {
        await page
          .locator("textarea")
          .type(`Rectangle(x: 10,\ny: 20,,\ncolor: 'red')`);
        const errorList = page.locator('button:has-text("Errors")');
        await expect(errorList).toBeVisible();
        const squiggle = page.locator(".squiggle").first();
        await expect(squiggle).toBeVisible();
      });

      test("should show a semantic error for an unknown object", async ({ page }) => {
        await page.locator("textarea").type("Foo()");
        // Wait for the debounce lint to finish
        const errorList = page.locator('button:has-text("1 Error")');
        await expect(errorList).toBeVisible();
        await errorList.click();
        await expect(page.locator('[role="menuitem"]')).toContainText(
          'Object type "Foo" not found'
        );
        const squiggle = page.locator(".squiggle").first();
        await expect(squiggle).toBeVisible();
      });

      test("should show error for multi-line invalid syntax", async ({ page }) => {
        page.on("console", (msg) => console.log(msg.text()));
        await page.locator("textarea").fill(
          `Rectangle(x: 10,y: 20,color: 'red'\nAS myRectangle\nCHILD TO otherRectangle\nSET Color('blue')\n`
        );
        // Wait for the debounce lint to finish
        await page.waitForTimeout(500);
        await page.keyboard.press("Escape");
        const errorList = page.locator('button:has-text("2 Errors")');
        await expect(errorList).toBeVisible();
        await errorList.click();
        // Check that the specific syntax error is visible in the list of errors.
        const expectedError = page.locator(
          '[role="menuitem"]:has-text("Syntax error: Expected a RightParentheses but found \'AS\' instead.")'
        );
        await expect(expectedError).toBeVisible();
        const squiggle = page.locator(".squiggle").first();
        await expect(squiggle).toBeVisible();
      });

      test("should show error for missing parenthesis", async ({ page }) => {
        await page.locator("textarea").type("Rectangle(");
        // Wait for the debounce lint to finish
        await page.waitForTimeout(500);
        const errorList = page.locator('button:has-text("1 Error")');
        await expect(errorList).toBeVisible();
        await errorList.click();
        await expect(page.locator('[role="menuitem"]')).toContainText(
          "Syntax error: Expected a RightParentheses but found '' instead."
        );
        const squiggle = page.locator(".squiggle").first();
        await expect(squiggle).toBeVisible();
      });

      test("should show error for invalid modifier", async ({ page }) => {
        await page.locator("textarea").type("Rectangle() SET InvalidModifier('')");
        // Wait for the debounce lint to finish
        await page.waitForTimeout(500);
        const errorList = page.locator('button:has-text("1 Error")');
        await expect(errorList).toBeVisible();
        await errorList.click();
        await expect(page.locator('[role="menuitem"]')).toContainText(
          'Modifier "InvalidModifier" is undefined.'
        );
        const squiggle = page.locator(".squiggle").first();
        await expect(squiggle).toBeVisible();
      });
    });
  });

  test("should not produce an error on double-click delete", async ({ page }) => {
    page.on("console", (msg) => console.log(msg.text()));
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error);
    });

    await page.goto("/");

    // 1. Create a new project
    await page.getByRole("button", { name: "New Project" }).click();
    await page.waitForSelector('h2:text("Create New Project")');
    await page.getByLabel("Project Name").fill("Test Draft Deletion");
    await page.getByRole("button", { name: "Create Project" }).click();

    // 2. Wait for navigation
    await page.waitForURL(/\/project\/\d+/);

    // 3. Click home link to trigger dialog
    await page.getByRole("link", { name: "Home" }).click();

    // 4. Verify the dialog for an empty draft
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Delete Empty Draft");

    // 5. Double-click delete draft
    await page.getByRole("button", { name: "Delete Draft" }).dblclick();

    // 6. Wait for dialog to close, then check for errors
    await expect(dialog).toBeHidden();
    expect(pageErrors).toEqual([]);

    // 7. Verify navigation to home and project is gone
    await expect(page).toHaveURL("/");
    await expect(
      page.locator(`div.group:has-text("Test Draft Deletion")`)
    ).not.toBeVisible();
  });

  test("should discard unsaved changes on reload", async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    await page.goto("/");

    // 1. Create a new project
    await page.getByRole("button", { name: "New Project" }).click();
    await page.waitForSelector('h2:text("Create New Project")');
    await page.getByLabel("Project Name").fill("Reload Test");
    await page.getByRole("button", { name: "Create Project" }).click();
    await page.waitForURL(/\/project\/\d+/);

    // 2. Type and save initial content
    const savedText = "Rectangle(x: 10, y: 10)";
    await page.locator("textarea").fill(savedText);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Saved!" })).toBeVisible();

    // 3. Type additional unsaved content
    const unsavedText = " // This is not saved";
    await page.locator("textarea").type(unsavedText);
    await expect(page.locator("textarea")).toHaveValue(savedText + unsavedText);

    // 4. Reload the page, handling the confirmation dialog
    page.once('dialog', dialog => dialog.accept());
    await page.reload();

    // 5. For now, the app redirects to home. This is acceptable for the test,
    // but logically it might be better to stay on the same page.
    await expect(page).toHaveURL("/");

    // 6. Re-enter the project
    await page
      .locator('div.group:has-text("Reload Test")')
      .getByRole("link")
      .first()
      .click();
    await page.waitForURL(/\/project\/\d+/);

    // 7. Verify that only the saved text remains
    await expect(page.locator("textarea")).toHaveValue(savedText);
  });

  test("should discard unsaved changes when going back to home", async ({ page }) => {
    await page.goto("/");

    // 1. Create a new project
    await page.getByRole("button", { name: "New Project" }).click();
    await page.waitForSelector('h2:text("Create New Project")');
    await page.getByLabel("Project Name").fill("Reload Test");
    await page.getByRole("button", { name: "Create Project" }).click();
    await page.waitForURL(/\/project\/\d+/);

    // 2. Type and save initial content
    const savedText = "Rectangle(x: 10, y: 10)";
    await page.locator("textarea").fill(savedText);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Saved!" })).toBeVisible();

    // 3. Type additional unsaved content
    const unsavedText = " // This is not saved";
    await page.locator("textarea").type(unsavedText);
    await expect(page.locator("textarea")).toHaveValue(savedText + unsavedText);

    await page.getByRole("link", { name: "Home" }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    await page.getByRole("button", { name: "Discard Changes" }).click();

    await expect(page).toHaveURL("/");

    // 6. Re-enter the project
    await page
      .locator('div.group:has-text("Reload Test")')
      .getByRole("link")
      .first()
      .click();
    await page.waitForURL(/\/project\/\d+/);

    // 7. Verify that only the saved text remains
    await expect(page.locator("textarea")).toHaveValue(savedText);
  });

  test("pan and zoom should be active after re-entering a project", async ({ page, context }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Browser console error: ${msg.text()}`);
      }
    });
    context.on('weberror', webError => {
      console.log(`Uncaught exception: "${webError.error()}"`);
    });
    page.on("console", (msg) => console.log(msg.text()));
    await page.goto("/");

    // 1. Create a project and draw something
    await page.getByRole("button", { name: "New Project" }).click();
    await page.getByLabel("Project Name").fill("Panzoom Test");
    await page.getByRole("button", { name: "Create Project" }).click();
    await page.waitForURL(/\/project\/\d+/);
    await page.locator("textarea").fill("Rectangle(x:30,y:50)");
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.locator("#defaultCanvas0")).toBeVisible();

    const canvasContainer = page
      .locator('[data-slot="resizable-panel"]')
      .last();
    const drawnImage = page.locator("#drawnimage");

    // 2. Get initial transform state
    const initialTransform = await drawnImage.getAttribute("style");
    expect(initialTransform).toContain("scale(1)");

    // 3. Simulate pan and zoom
    const box = await canvasContainer.boundingBox();
    if (!box) throw new Error("Canvas container not found");

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + 100, { steps: 5 });
    await page.mouse.up();
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(500); // Wait for panzoom to update

    const movedTransform = await drawnImage.getAttribute("style");
    expect(movedTransform).not.toEqual(initialTransform);

    // 4. Save and go back home
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Saved!" })).toBeVisible();
    await page.getByRole("link", { name: "Home" }).click();
    await page.waitForURL("/");

    // 5. Re-enter the project
    await page
      .locator('div.group:has-text("Panzoom Test")')
      .getByRole("link")
      .first()
      .click();
    await page.waitForURL(/\/project\/\d+/);
    await expect(page.locator("#defaultCanvas0")).toBeVisible();

    // Wait for the style attribute to be set
    await page.waitForFunction(() => {
      const drawnImage = document.querySelector("#drawnimage");
      return drawnImage && drawnImage.getAttribute("style");
    });

    // 6. Verify panzoom is reset
    await page.waitForTimeout(1000); // Allow time for panzoom to initialize
    const resetTransform = await drawnImage.getAttribute("style");
    expect(resetTransform).toContain("scale(1)");

    // 6. Verify panzoom is still active
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 150, box.y + 150, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(500); // Wait for panzoom to update

    const finalTransform = await drawnImage.getAttribute("style");
    expect(finalTransform).not.toEqual(resetTransform);
  });
});
