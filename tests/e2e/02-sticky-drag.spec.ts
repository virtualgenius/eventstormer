import { test, expect } from '@playwright/test';
import { CanvasPage } from '../pages/CanvasPage';
import { enableDebugMode } from '../utils/debug';
import { clearBoard, getStickies } from '../utils/store';

test.describe('Sticky Drag & Drop', () => {
  let canvasPage: CanvasPage;

  test.beforeEach(async ({ page }) => {
    await enableDebugMode(page);
    canvasPage = new CanvasPage(page);
    await canvasPage.goto();
    await clearBoard(page);
    await page.waitForTimeout(500);
  });

  test('should have draggable stickies', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(500);

    // Verify sticky has position in store
    const sticky = (await getStickies(page))[0];
    expect(sticky.x).toBeDefined();
    expect(sticky.y).toBeDefined();
    expect(sticky.id).toBeDefined();
  });

  test('should allow programmatic position update', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(500);

    const stickyBefore = (await getStickies(page))[0];

    // Update position programmatically via store
    await page.evaluate((id) => {
      const store = (window as any).__testStore;
      const stickies = store.getState().board.stickies;
      const sticky = stickies.find((s: any) => s.id === id);
      if (sticky) {
        store.getState().updateSticky(id, { x: sticky.x + 100, y: sticky.y + 50 });
      }
    }, stickyBefore.id);

    await page.waitForTimeout(300);

    // Verify position changed
    const stickyAfter = (await getStickies(page))[0];
    expect(stickyAfter.x).toBeGreaterThan(stickyBefore.x);
    expect(stickyAfter.y).toBeGreaterThan(stickyBefore.y);
  });

  test('should preserve sticky properties during updates', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(500);

    const stickyBefore = (await getStickies(page))[0];

    // Update position
    await page.evaluate((id) => {
      const store = (window as any).__testStore;
      store.getState().updateSticky(id, { x: 400, y: 300 });
    }, stickyBefore.id);

    await page.waitForTimeout(300);

    // Verify properties preserved
    const stickyAfter = (await getStickies(page))[0];
    expect(stickyAfter.id).toBe(stickyBefore.id);
    expect(stickyAfter.kind).toBe(stickyBefore.kind);
    expect(stickyAfter.text).toBe(stickyBefore.text);
  });
});
