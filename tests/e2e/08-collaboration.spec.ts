import { test, expect } from '@playwright/test';
import { CanvasPage } from '../pages/CanvasPage';
import { enableDebugMode, ConsoleLogCapture } from '../utils/debug';

test.describe('Real-time Collaboration', () => {
  test('should show increased user count when multiple contexts connect', async ({ browser }) => {
    // Create two browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await enableDebugMode(page1);
    await enableDebugMode(page2);

    const canvasPage1 = new CanvasPage(page1);
    const canvasPage2 = new CanvasPage(page2);

    // Open app in both contexts
    await canvasPage1.goto();
    await canvasPage2.goto();

    // Wait for connections
    await page1.waitForTimeout(1000);
    await page2.waitForTimeout(1000);

    // Check user counts (should be at least 2)
    const count1 = await canvasPage1.getOnlineCount();
    const count2 = await canvasPage2.getOnlineCount();

    expect(count1).toBeGreaterThanOrEqual(2);
    expect(count2).toBeGreaterThanOrEqual(2);

    // Cleanup
    await context1.close();
    await context2.close();
  });

  test('should sync sticky creation across contexts', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await enableDebugMode(page1);
    await enableDebugMode(page2);

    const consoleCapture2 = new ConsoleLogCapture(page2);

    const canvasPage1 = new CanvasPage(page1);
    const canvasPage2 = new CanvasPage(page2);

    await canvasPage1.goto();
    await canvasPage2.goto();

    await page1.waitForTimeout(1000);
    await page2.waitForTimeout(1000);

    // Create sticky in context 1
    await canvasPage1.createStickyAt('event', 300, 200);

    // Wait for sync and verify in context 2
    await page2.waitForTimeout(1000);
    const storeLog = await consoleCapture2.waitForLog(/\[Store\] Adding sticky/, 3000);
    expect(storeLog).toBeTruthy();

    // Cleanup
    await context1.close();
    await context2.close();
  });

  test('should update user count when context closes', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await enableDebugMode(page1);
    await enableDebugMode(page2);

    const canvasPage1 = new CanvasPage(page1);
    const canvasPage2 = new CanvasPage(page2);

    await canvasPage1.goto();
    await canvasPage2.goto();

    await page1.waitForTimeout(1000);

    const initialCount = await canvasPage1.getOnlineCount();
    expect(initialCount).toBeGreaterThanOrEqual(2);

    // Close context 2
    await context2.close();
    await page1.waitForTimeout(1500);

    // Count should decrease
    const newCount = await canvasPage1.getOnlineCount();
    expect(newCount).toBeLessThan(initialCount);

    // Cleanup
    await context1.close();
  });
});
