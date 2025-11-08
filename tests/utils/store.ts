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
      const state = store.getState();
      const ydoc = state.ydoc;
      const yboard = ydoc.getMap("board");

      // Clear all arrays in Y.Doc
      const stickies = yboard.get("stickies");
      if (stickies && stickies.length > 0) {
        stickies.delete(0, stickies.length);
      }

      const verticals = yboard.get("verticals");
      if (verticals && verticals.length > 0) {
        verticals.delete(0, verticals.length);
      }

      const lanes = yboard.get("lanes");
      if (lanes && lanes.length > 0) {
        lanes.delete(0, lanes.length);
      }

      const themes = yboard.get("themes");
      if (themes && themes.length > 0) {
        themes.delete(0, themes.length);
      }

      // Reset phase to chaotic-exploration
      yboard.set("phase", "chaotic-exploration");
      yboard.set("updatedAt", new Date().toISOString());
    }
  });

  // Wait for Yjs to propagate changes through PartyKit
  await page.waitForTimeout(2000);
}

/**
 * Set the facilitation phase
 */
export async function setPhase(page: Page, phase: string): Promise<void> {
  await page.evaluate((p) => {
    const store = (window as any).__testStore;
    if (store) {
      const state = store.getState();
      const ydoc = state.ydoc;
      const yboard = ydoc.getMap("board");

      yboard.set("phase", p);
      yboard.set("updatedAt", new Date().toISOString());
    }
  }, phase);

  // Wait for Yjs to propagate changes
  await page.waitForTimeout(100);
}

/**
 * Get the current phase from the store
 */
export async function getPhase(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const store = (window as any).__testStore;
    return store?.getState().board.phase || "";
  });
}

/**
 * Wait for phase to change to expected value
 */
export async function waitForPhase(page: Page, expectedPhase: string, timeout: number = 3000): Promise<void> {
  await page.waitForFunction(
    (expected) => {
      const store = (window as any).__testStore;
      return store?.getState().board.phase === expected;
    },
    expectedPhase,
    { timeout }
  );
}
