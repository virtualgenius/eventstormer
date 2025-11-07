import { test, expect } from '@playwright/test';
import { CanvasPage } from '../pages/CanvasPage';
import { enableDebugMode } from '../utils/debug';
import { clearBoard } from '../utils/store';

test.describe('Canvas Pan', () => {
  let canvasPage: CanvasPage;

  test.beforeEach(async ({ page }) => {
    await enableDebugMode(page);
    canvasPage = new CanvasPage(page);
    await canvasPage.goto();
    await clearBoard(page);
    await page.waitForTimeout(500);
  });

  test('should pan canvas with right-click drag', async ({ page }) => {
    await canvasPage.panCanvas(100, 50);
    // If no error, pan worked
    await page.waitForTimeout(100);
  });

  test('should pan in different directions', async ({ page }) => {
    // Pan right and down
    await canvasPage.panCanvas(100, 100);
    await page.waitForTimeout(100);

    // Pan left and up
    await canvasPage.panCanvas(-100, -100);
    await page.waitForTimeout(100);
  });

  test('should handle multiple pan operations', async ({ page }) => {
    // First pan
    await canvasPage.panCanvas(50, 30);
    await page.waitForTimeout(100);

    // Second pan
    await canvasPage.panCanvas(-30, -20);
    await page.waitForTimeout(100);

    // Verify canvas is still interactive
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(500);

    const stickies = await page.evaluate(() => {
      const store = (window as any).__testStore;
      return store?.getState().board.stickies || [];
    });

    expect(stickies.length).toBeGreaterThan(0);
  });
});
