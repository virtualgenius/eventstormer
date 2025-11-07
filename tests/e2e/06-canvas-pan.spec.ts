import { test, expect } from '@playwright/test';
import { CanvasPage } from '../pages/CanvasPage';
import { enableDebugMode, ConsoleLogCapture } from '../utils/debug';

test.describe('Canvas Pan', () => {
  let canvasPage: CanvasPage;
  let consoleCapture: ConsoleLogCapture;

  test.beforeEach(async ({ page }) => {
    await enableDebugMode(page);
    consoleCapture = new ConsoleLogCapture(page);
    canvasPage = new CanvasPage(page);
    await canvasPage.goto();
  });

  test('should pan canvas with right-click drag', async ({ page }) => {
    consoleCapture.clear();

    await canvasPage.panCanvas(100, 50);

    // Verify pan started log
    const panStartLog = await consoleCapture.waitForLog(/\[KonvaCanvas\] Right-click pan started/);
    expect(panStartLog).toBeTruthy();
    expect(panStartLog).toMatch(/Position: \([^)]+\)/);

    // Verify pan ended log
    const panEndLog = await consoleCapture.waitForLog(/\[KonvaCanvas\] Pan ended/);
    expect(panEndLog).toBeTruthy();
    expect(panEndLog).toMatch(/Position: \([^)]+\)/);
  });

  test('should log position changes during pan', async ({ page }) => {
    consoleCapture.clear();

    await canvasPage.panCanvas(150, 100);

    const panLogs = consoleCapture.getLogsMatching(/\[KonvaCanvas\].*pan/i);
    expect(panLogs.length).toBeGreaterThanOrEqual(2); // Start and end
  });

  test('should handle multiple pan operations', async ({ page }) => {
    // First pan
    await canvasPage.panCanvas(50, 50);
    await page.waitForTimeout(200);

    consoleCapture.clear();

    // Second pan
    await canvasPage.panCanvas(-30, -30);

    const panLogs = consoleCapture.getLogsMatching(/\[KonvaCanvas\].*Pan/);
    expect(panLogs.length).toBeGreaterThanOrEqual(2);
  });
});
