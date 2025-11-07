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

  test('should allow text editing via programmatic update', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(500);

    const stickyBefore = (await getStickies(page))[0];

    // Update text programmatically via store
    await page.evaluate((id) => {
      const store = (window as any).__testStore;
      store.getState().updateSticky(id, { text: 'User logged in' });
    }, stickyBefore.id);

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

  test('should allow multiple text updates', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(500);

    const stickyId = (await getStickies(page))[0].id;

    // Set initial text programmatically
    await page.evaluate((id) => {
      const store = (window as any).__testStore;
      store.getState().updateSticky(id, { text: 'Initial text' });
    }, stickyId);

    await page.waitForTimeout(300);

    let sticky = (await getStickies(page))[0];
    expect(sticky.text).toBe('Initial text');

    // Update text again
    await page.evaluate((id) => {
      const store = (window as any).__testStore;
      store.getState().updateSticky(id, { text: 'Updated text' });
    }, stickyId);

    await page.waitForTimeout(300);

    // Verify text updated
    sticky = (await getStickies(page))[0];
    expect(sticky.text).toBe('Updated text');
  });
});
