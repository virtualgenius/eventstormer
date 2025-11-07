import { test, expect } from '@playwright/test';
import { CanvasPage } from '../pages/CanvasPage';
import { enableDebugMode, ConsoleLogCapture } from '../utils/debug';

test.describe('Sticky Drag & Drop', () => {
  let canvasPage: CanvasPage;
  let consoleCapture: ConsoleLogCapture;

  test.beforeEach(async ({ page }) => {
    await enableDebugMode(page);
    consoleCapture = new ConsoleLogCapture(page);
    canvasPage = new CanvasPage(page);
    await canvasPage.goto();
  });

  test('should drag sticky to new position', async ({ page }) => {
    // Create sticky first
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(300);

    consoleCapture.clear();

    // Drag sticky (sticky center is at 300+60, 200+60 due to centering)
    const stickyX = 360;
    const stickyY = 260;
    await canvasPage.dragStickyBy(stickyX, stickyY, 100, 50);

    // Verify drag started log
    const dragStartLog = await consoleCapture.waitForLog(/\[KonvaSticky\] Drag started/);
    expect(dragStartLog).toBeTruthy();

    // Verify drag ended log
    const dragEndLog = await consoleCapture.waitForLog(/\[KonvaSticky\] Drag ended/);
    expect(dragEndLog).toBeTruthy();
    expect(dragEndLog).toMatch(/New: \(/);

    // Verify store update log
    const storeLog = await consoleCapture.waitForLog(/\[Store\] Updating sticky.*Position:/);
    expect(storeLog).toBeTruthy();
  });

  test('should log position change in store', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(300);

    consoleCapture.clear();

    // Drag sticky
    await canvasPage.dragStickyBy(360, 260, 150, 100);

    // Verify position change is logged
    const storeLog = await consoleCapture.waitForLog(/\[Store\] Updating sticky.*Position:/);
    expect(storeLog).toMatch(/Position: \([^)]+\) → \([^)]+\)/);
  });

  test('should handle multiple drags on same sticky', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(300);

    // First drag
    consoleCapture.clear();
    await canvasPage.dragStickyBy(360, 260, 50, 30);
    const firstDrag = await consoleCapture.waitForLog(/\[KonvaSticky\] Drag ended/);
    expect(firstDrag).toBeTruthy();

    // Second drag (approximate new position)
    await page.waitForTimeout(200);
    consoleCapture.clear();
    await canvasPage.dragStickyBy(410, 290, -30, -20);
    const secondDrag = await consoleCapture.waitForLog(/\[KonvaSticky\] Drag ended/);
    expect(secondDrag).toBeTruthy();
  });
});
