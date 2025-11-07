import { test, expect } from '@playwright/test';
import { CanvasPage } from '../pages/CanvasPage';
import { enableDebugMode, ConsoleLogCapture } from '../utils/debug';

test.describe('Sticky Text Editing', () => {
  let canvasPage: CanvasPage;
  let consoleCapture: ConsoleLogCapture;

  test.beforeEach(async ({ page }) => {
    await enableDebugMode(page);
    consoleCapture = new ConsoleLogCapture(page);
    canvasPage = new CanvasPage(page);
    await canvasPage.goto();
  });

  test('should enter edit mode on double-click', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(300);

    consoleCapture.clear();

    // Double-click sticky (center at 360, 260)
    await canvasPage.doubleClickCanvasAt(360, 260);

    // Verify edit mode log
    const editLog = await consoleCapture.waitForLog(/\[KonvaSticky\] Double-clicked \(entering edit mode\)/);
    expect(editLog).toBeTruthy();

    // Verify textarea appears
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
  });

  test('should save text on blur', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(300);

    // Enter edit mode
    await canvasPage.doubleClickCanvasAt(360, 260);
    await page.waitForTimeout(200);

    consoleCapture.clear();

    // Type text
    await canvasPage.typeIntoActiveSticky('User logged in');

    // Click away to blur
    await canvasPage.clickAway();

    // Verify edit completed log
    const editCompleteLog = await consoleCapture.waitForLog(/\[KonvaSticky\] Edit completed \(blur\)/);
    expect(editCompleteLog).toBeTruthy();
    expect(editCompleteLog).toContain('User logged in');

    // Verify store update log
    const storeLog = await consoleCapture.waitForLog(/\[Store\] Updating sticky.*Text:/);
    expect(storeLog).toBeTruthy();
    expect(storeLog).toContain('User logged in');
  });

  test('should cancel edit on Escape key', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(300);

    // Enter edit mode
    await canvasPage.doubleClickCanvasAt(360, 260);
    await page.waitForTimeout(200);

    // Type text
    await canvasPage.typeIntoActiveSticky('Temporary text');

    consoleCapture.clear();

    // Press Escape
    await canvasPage.pressEscape();

    // Verify cancel log
    const cancelLog = await consoleCapture.waitForLog(/\[KonvaSticky\] Edit cancelled \(Escape\)/);
    expect(cancelLog).toBeTruthy();

    // Verify no store update (text not saved)
    await page.waitForTimeout(300);
    const hasStoreUpdate = consoleCapture.hasLog(/\[Store\] Updating sticky.*Text:.*Temporary text/);
    expect(hasStoreUpdate).toBe(false);

    // Textarea should be removed
    const textarea = page.locator('textarea').first();
    await expect(textarea).not.toBeVisible();
  });

  test('should update existing text', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(300);

    // Add initial text
    await canvasPage.doubleClickCanvasAt(360, 260);
    await page.waitForTimeout(200);
    await canvasPage.typeIntoActiveSticky('Initial text');
    await canvasPage.clickAway();
    await page.waitForTimeout(300);

    // Edit again
    consoleCapture.clear();
    await canvasPage.doubleClickCanvasAt(360, 260);
    await page.waitForTimeout(200);
    await canvasPage.typeIntoActiveSticky('Updated text');
    await canvasPage.clickAway();

    // Verify store update shows both old and new text
    const storeLog = await consoleCapture.waitForLog(/\[Store\] Updating sticky.*Text:/);
    expect(storeLog).toContain('Initial text');
    expect(storeLog).toContain('Updated text');
  });
});
