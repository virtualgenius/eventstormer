import { test, expect } from '@playwright/test';
import { CanvasPage } from '../pages/CanvasPage';
import { enableDebugMode, ConsoleLogCapture } from '../utils/debug';

test.describe('Canvas Zoom', () => {
  let canvasPage: CanvasPage;
  let consoleCapture: ConsoleLogCapture;

  test.beforeEach(async ({ page }) => {
    await enableDebugMode(page);
    consoleCapture = new ConsoleLogCapture(page);
    canvasPage = new CanvasPage(page);
    await canvasPage.goto();
  });

  test('should zoom in with mouse wheel', async ({ page }) => {
    consoleCapture.clear();

    await canvasPage.zoomIn(3);

    // Verify zoom in logs
    const zoomLogs = consoleCapture.getLogsMatching(/\[KonvaCanvas\] Zoom in/);
    expect(zoomLogs.length).toBeGreaterThan(0);
    expect(zoomLogs[0]).toMatch(/Scale:.*→/);
  });

  test('should zoom out with mouse wheel', async ({ page }) => {
    // First zoom in
    await canvasPage.zoomIn(2);
    await page.waitForTimeout(300);

    consoleCapture.clear();

    // Then zoom out
    await canvasPage.zoomOut(2);

    // Verify zoom out logs
    const zoomLogs = consoleCapture.getLogsMatching(/\[KonvaCanvas\] Zoom out/);
    expect(zoomLogs.length).toBeGreaterThan(0);
  });

  test('should log scale changes', async ({ page }) => {
    consoleCapture.clear();

    await canvasPage.zoomIn(1);

    const zoomLog = await consoleCapture.waitForLog(/\[KonvaCanvas\] Zoom in.*Scale:/);
    expect(zoomLog).toBeTruthy();
    expect(zoomLog).toMatch(/1\.00 → 1\.05/);
  });

  test('should log pointer position during zoom', async ({ page }) => {
    consoleCapture.clear();

    await canvasPage.zoomIn(1);

    const zoomLog = await consoleCapture.waitForLog(/\[KonvaCanvas\] Zoom in.*Pointer:/);
    expect(zoomLog).toBeTruthy();
    expect(zoomLog).toMatch(/Pointer: \(\d+, \d+\)/);
  });

  test('should respect zoom limits', async ({ page }) => {
    // Zoom in many times to hit max limit (4x)
    for (let i = 0; i < 50; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }

    // Check last log doesn't exceed 4.00
    const allLogs = consoleCapture.getLogsMatching(/\[KonvaCanvas\] Zoom/);
    const lastLog = allLogs[allLogs.length - 1];
    const scaleMatch = lastLog.match(/→ (\d+\.\d+)/);
    if (scaleMatch) {
      const scale = parseFloat(scaleMatch[1]);
      expect(scale).toBeLessThanOrEqual(4.0);
    }

    // Zoom out many times to hit min limit (0.25x)
    consoleCapture.clear();
    for (let i = 0; i < 50; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(50);
    }

    const allLogsOut = consoleCapture.getLogsMatching(/\[KonvaCanvas\] Zoom/);
    const lastLogOut = allLogsOut[allLogsOut.length - 1];
    const scaleMatchOut = lastLogOut.match(/→ (\d+\.\d+)/);
    if (scaleMatchOut) {
      const scale = parseFloat(scaleMatchOut[1]);
      expect(scale).toBeGreaterThanOrEqual(0.25);
    }
  });
});
