import { Page } from '@playwright/test';

/**
 * Get the current sticky count from the store
 */
export async function getStickyCount(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const store = (window as any).__testStore;
    return store?.getState().board.stickies.length || 0;
  });
}

/**
 * Get the active tool from the store
 */
export async function getActiveTool(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    const store = (window as any).__testStore;
    return store?.getState().activeTool || null;
  });
}

/**
 * Get all stickies from the store
 */
export async function getStickies(page: Page): Promise<any[]> {
  return await page.evaluate(() => {
    const store = (window as any).__testStore;
    return store?.getState().board.stickies || [];
  });
}

/**
 * Wait for sticky count to reach expected value
 */
export async function waitForStickyCount(page: Page, expectedCount: number, timeout: number = 3000): Promise<void> {
  await page.waitForFunction(
    (expected) => {
      const store = (window as any).__testStore;
      return store?.getState().board.stickies.length === expected;
    },
    expectedCount,
    { timeout }
  );
}

/**
 * Wait for active tool to change
 */
export async function waitForActiveTool(page: Page, expectedTool: string | null, timeout: number = 3000): Promise<void> {
  await page.waitForFunction(
    (expected) => {
      const store = (window as any).__testStore;
      return store?.getState().activeTool === expected;
    },
    expectedTool,
    { timeout }
  );
}

/**
 * Wait for sticky count to increase by a certain amount
 */
export async function waitForStickyCountIncrease(page: Page, initialCount: number, timeout: number = 3000): Promise<void> {
  await page.waitForFunction(
    (initial) => {
      const store = (window as any).__testStore;
      return store?.getState().board.stickies.length > initial;
    },
    initialCount,
    { timeout }
  );
}

/**
 * Clear all stickies from the board and reset phase
 */
export async function clearBoard(page: Page): Promise<void> {
  await page.evaluate(() => {
    const store = (window as any).__testStore;
    if (store) {
      store.setState({
        board: {
          ...store.getState().board,
          stickies: [],
          phase: "chaotic-exploration"
        }
      });
    }
  });
}

/**
 * Set the facilitation phase
 */
export async function setPhase(page: Page, phase: string): Promise<void> {
  await page.evaluate((p) => {
    const store = (window as any).__testStore;
    if (store) {
      store.setState({
        board: {
          ...store.getState().board,
          phase: p
        }
      });
    }
  }, phase);
}
