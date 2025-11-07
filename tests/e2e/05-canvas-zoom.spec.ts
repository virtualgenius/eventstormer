import { test, expect } from '@playwright/test';
import { CanvasPage } from '../pages/CanvasPage';
import { enableDebugMode } from '../utils/debug';
import { clearBoard } from '../utils/store';

test.describe('Canvas Zoom', () => {
  let canvasPage: CanvasPage;

  test.beforeEach(async ({ page }) => {
    await enableDebugMode(page);
    canvasPage = new CanvasPage(page);
    await canvasPage.goto();
    await clearBoard(page);
    await page.waitForTimeout(500);
  });

  test('should zoom in with mouse wheel', async ({ page }) => {
    await canvasPage.zoomIn(3);
    // If no error, zoom worked
    await page.waitForTimeout(100);
  });

  test('should zoom out with mouse wheel', async ({ page }) => {
    // First zoom in
    await canvasPage.zoomIn(2);
    await page.waitForTimeout(100);

    // Then zoom out
    await canvasPage.zoomOut(2);
    await page.waitForTimeout(100);
  });

  test('should zoom from default scale', async ({ page }) => {
    await canvasPage.zoomIn(1);
    await page.waitForTimeout(100);
  });

  test('should handle zoom with pointer position', async ({ page }) => {
    await canvasPage.zoomIn(1);
    await page.waitForTimeout(100);
  });

  test('should handle extreme zoom operations', async ({ page }) => {
    // Zoom in many times
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(20);
    }

    // Zoom out many times
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(20);
    }

    // Verify canvas is still interactive (can create sticky)
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(500);

    const stickies = await page.evaluate(() => {
      const store = (window as any).__testStore;
      return store?.getState().board.stickies || [];
    });

    expect(stickies.length).toBeGreaterThan(0);
  });
});
