import { test, expect } from '@playwright/test';
import { CanvasPage } from '../pages/CanvasPage';
import { enableDebugMode } from '../utils/debug';
import { getStickyCount, getActiveTool, waitForStickyCount, waitForActiveTool, getStickies, clearBoard } from '../utils/store';

test.describe('Sticky Creation', () => {
  let canvasPage: CanvasPage;

  test.beforeEach(async ({ page }) => {
    await enableDebugMode(page);
    canvasPage = new CanvasPage(page);
    await canvasPage.goto();
    await clearBoard(page);
    await page.waitForTimeout(500); // Give time for clear to propagate
  });

  test('should select Event tool from palette', async ({ page }) => {
    await canvasPage.selectTool('event');

    // Verify active tool is set in store
    await waitForActiveTool(page, 'event');
    const activeTool = await getActiveTool(page);
    expect(activeTool).toBe('event');
  });

  test('should create sticky when clicking canvas with tool selected', async ({ page }) => {
    const initialCount = await getStickyCount(page);

    await canvasPage.selectTool('event');
    await canvasPage.clickCanvasAt(300, 200);

    // Wait for sticky count to increase
    await page.waitForFunction(
      (initial) => {
        const store = (window as any).__testStore;
        return store?.getState().board.stickies.length > initial;
      },
      initialCount,
      { timeout: 3000 }
    );

    // Verify sticky was created
    const stickies = await getStickies(page);
    expect(stickies.length).toBeGreaterThan(initialCount);
    expect(stickies[stickies.length - 1].kind).toBe('event');
    expect(stickies[stickies.length - 1].text).toBe('');
  });

  test('should support creating multiple event stickies', async ({ page }) => {
    const initialCount = await getStickyCount(page);

    // Create first sticky
    await canvasPage.createStickyAt('event', 200, 200);
    await page.waitForTimeout(500);

    const count1 = await getStickyCount(page);
    expect(count1).toBeGreaterThan(initialCount);

    // Create second sticky at different position
    await canvasPage.createStickyAt('event', 900, 400);
    await page.waitForTimeout(500);

    const count2 = await getStickyCount(page);
    expect(count2).toBeGreaterThan(count1);
  });

  test('should deactivate tool after creating sticky', async ({ page }) => {
    await canvasPage.selectTool('event');
    await canvasPage.clickCanvasAt(300, 200);

    // Wait for sticky creation and tool deactivation
    await waitForActiveTool(page, null);

    const activeTool = await getActiveTool(page);
    expect(activeTool).toBeNull();
  });

  test('should create sticky with empty text initially', async ({ page }) => {
    const initialCount = await getStickyCount(page);

    await canvasPage.selectTool('event');
    await canvasPage.clickCanvasAt(300, 200);

    // Wait for sticky creation
    await page.waitForFunction(
      (initial) => {
        const store = (window as any).__testStore;
        return store?.getState().board.stickies.length > initial;
      },
      initialCount,
      { timeout: 3000 }
    );

    const stickies = await getStickies(page);
    const lastSticky = stickies[stickies.length - 1];
    expect(lastSticky.text).toBe('');
  });
});
