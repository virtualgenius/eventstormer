import { test, expect } from '@playwright/test';
import { CanvasPage } from '../pages/CanvasPage';
import { enableDebugMode } from '../utils/debug';
import { clearBoard, getStickies } from '../utils/store';

test.describe('Sticky Text Editing', () => {
  let canvasPage: CanvasPage;

  test.beforeEach(async ({ page }) => {
    await enableDebugMode(page);
    canvasPage = new CanvasPage(page);
    await canvasPage.goto();
    await clearBoard(page);
    await page.waitForTimeout(500);
  });

  test('should enter edit mode on double-click', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(500);

    // Double-click sticky (center at 360, 260)
    await canvasPage.doubleClickCanvasAt(360, 260);
    await page.waitForTimeout(200);

    // Verify textarea appears
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
  });

  test('should save text on blur', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(500);

    const stickyBefore = (await getStickies(page))[0];

    // Enter edit mode
    await canvasPage.doubleClickCanvasAt(360, 260);
    await page.waitForTimeout(200);

    // Type text
    await canvasPage.typeIntoActiveSticky('User logged in');

    // Click away to blur
    await canvasPage.clickAway();
    await page.waitForTimeout(300);

    // Verify text updated in store
    const stickyAfter = (await getStickies(page))[0];
    expect(stickyAfter.text).toBe('User logged in');
    expect(stickyAfter.id).toBe(stickyBefore.id);
  });

  test('should cancel edit on Escape key', async ({ page }) => {
    // Create sticky with initial text
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(500);

    const stickyBefore = (await getStickies(page))[0];
    const initialText = stickyBefore.text;

    // Enter edit mode
    await canvasPage.doubleClickCanvasAt(360, 260);
    await page.waitForTimeout(200);

    // Type temporary text
    await canvasPage.typeIntoActiveSticky('Temporary text');

    // Press Escape to cancel
    await canvasPage.pressEscape();
    await page.waitForTimeout(300);

    // Verify text not updated (stayed empty)
    const stickyAfter = (await getStickies(page))[0];
    expect(stickyAfter.text).toBe(initialText);

    // Textarea should be removed
    const textarea = page.locator('textarea').first();
    await expect(textarea).not.toBeVisible();
  });

  test('should update existing text', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(500);

    const stickyId = (await getStickies(page))[0].id;

    // Set initial text
    await canvasPage.doubleClickCanvasAt(360, 260);
    await page.waitForTimeout(200);
    await canvasPage.typeIntoActiveSticky('Initial text');
    await canvasPage.clickAway();
    await page.waitForTimeout(300);

    // Edit again to update text
    await canvasPage.doubleClickCanvasAt(360, 260);
    await page.waitForTimeout(200);
    await canvasPage.typeIntoActiveSticky('Updated text');
    await canvasPage.clickAway();
    await page.waitForTimeout(300);

    // Verify text updated
    const stickies = await getStickies(page);
    const sticky = stickies.find((s: any) => s.id === stickyId);
    expect(sticky.text).toBe('Updated text');
  });
});
