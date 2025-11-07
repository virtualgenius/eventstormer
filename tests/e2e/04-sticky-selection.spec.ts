import { test, expect } from '@playwright/test';
import { CanvasPage } from '../pages/CanvasPage';
import { enableDebugMode, ConsoleLogCapture } from '../utils/debug';

test.describe('Sticky Selection', () => {
  let canvasPage: CanvasPage;
  let consoleCapture: ConsoleLogCapture;

  test.beforeEach(async ({ page }) => {
    await enableDebugMode(page);
    consoleCapture = new ConsoleLogCapture(page);
    canvasPage = new CanvasPage(page);
    await canvasPage.goto();
  });

  test('should select sticky on click', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(300);

    consoleCapture.clear();

    // Click sticky (center at 360, 260)
    await canvasPage.clickCanvasAt(360, 260);

    // Verify selection log
    const selectLog = await consoleCapture.waitForLog(/\[KonvaSticky\] Clicked/);
    expect(selectLog).toBeTruthy();
  });

  test('should deselect when clicking canvas', async ({ page }) => {
    // Create and select sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(300);
    await canvasPage.clickCanvasAt(360, 260); // Select sticky
    await page.waitForTimeout(200);

    consoleCapture.clear();

    // Click empty area
    await canvasPage.clickAway();

    // Verify deselection log
    const deselectLog = await consoleCapture.waitForLog(/\[KonvaCanvas\] Deselecting sticky/);
    expect(deselectLog).toBeTruthy();
  });

  test('should switch selection between stickies', async ({ page }) => {
    // Create two stickies
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(300);
    await canvasPage.createStickyAt('hotspot', 500, 200);
    await page.waitForTimeout(300);

    // Click first sticky
    consoleCapture.clear();
    await canvasPage.clickCanvasAt(360, 260);
    const firstSelect = await consoleCapture.waitForLog(/\[KonvaSticky\] Clicked/);
    expect(firstSelect).toBeTruthy();

    // Click second sticky
    consoleCapture.clear();
    await canvasPage.clickCanvasAt(560, 260);
    const secondSelect = await consoleCapture.waitForLog(/\[KonvaSticky\] Clicked/);
    expect(secondSelect).toBeTruthy();
  });
});
