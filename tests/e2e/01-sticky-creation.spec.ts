import { test, expect } from '@playwright/test';
import { CanvasPage } from '../pages/CanvasPage';
import { enableDebugMode, ConsoleLogCapture } from '../utils/debug';

test.describe('Sticky Creation', () => {
  let canvasPage: CanvasPage;
  let consoleCapture: ConsoleLogCapture;

  test.beforeEach(async ({ page }) => {
    await enableDebugMode(page);
    consoleCapture = new ConsoleLogCapture(page);
    canvasPage = new CanvasPage(page);
    await canvasPage.goto();
  });

  test('should select Event tool from palette', async ({ page }) => {
    await canvasPage.selectTool('event');

    // Verify cursor changes to crosshair (tool is active)
    const canvas = page.locator('canvas').first();
    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('crosshair');
  });

  test('should create sticky when clicking canvas with tool selected', async ({ page }) => {
    await canvasPage.selectTool('event');
    await canvasPage.clickCanvasAt(300, 200);

    // Wait for debug log
    const log = await consoleCapture.waitForLog(/\[KonvaCanvas\] Creating sticky/);
    expect(log).toBeTruthy();
    expect(log).toContain('Kind: event');

    // Verify store log
    const storeLog = await consoleCapture.waitForLog(/\[Store\] Adding sticky/);
    expect(storeLog).toBeTruthy();
    expect(storeLog).toContain('Kind: event');
  });

  test('should create multiple sticky types', async ({ page }) => {
    const stickyTypes: Array<{ kind: 'event' | 'hotspot' | 'actor' | 'system' | 'opportunity' | 'glossary', x: number, y: number }> = [
      { kind: 'event', x: 300, y: 200 },
      { kind: 'hotspot', x: 450, y: 200 },
      { kind: 'actor', x: 600, y: 200 },
      { kind: 'system', x: 750, y: 200 },
      { kind: 'opportunity', x: 900, y: 200 },
      { kind: 'glossary', x: 1050, y: 200 },
    ];

    for (const { kind, x, y } of stickyTypes) {
      consoleCapture.clear();
      await canvasPage.createStickyAt(kind, x, y);

      // Verify creation log for each type
      const log = await consoleCapture.waitForLog(new RegExp(`\\[Store\\] Adding sticky.*Kind: ${kind}`));
      expect(log).toBeTruthy();
    }
  });

  test('should deactivate tool after creating sticky', async ({ page }) => {
    await canvasPage.selectTool('event');
    await canvasPage.clickCanvasAt(300, 200);

    // Wait a bit for state to update
    await page.waitForTimeout(200);

    // Cursor should return to default (tool deactivated)
    const canvas = page.locator('canvas').first();
    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('default');
  });

  test('should create sticky with empty text initially', async ({ page }) => {
    await canvasPage.selectTool('event');
    await canvasPage.clickCanvasAt(300, 200);

    const storeLog = await consoleCapture.waitForLog(/\[Store\] Adding sticky/);
    expect(storeLog).toContain('Text: ""');
  });
});
