import { Page } from '@playwright/test';

/**
 * Enable debug mode before test runs
 */
export async function enableDebugMode(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('debug', 'true');
  });
}

/**
 * Capture console logs and filter by pattern
 */
export class ConsoleLogCapture {
  private logs: string[] = [];

  constructor(private page: Page) {
    this.page.on('console', (msg) => {
      const text = msg.text();
      this.logs.push(text);
    });
  }

  /**
   * Wait for a specific debug log pattern to appear
   */
  async waitForLog(pattern: RegExp, timeout: number = 5000): Promise<string | null> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const match = this.logs.find(log => pattern.test(log));
      if (match) {
        return match;
      }
      await this.page.waitForTimeout(100);
    }
    return null;
  }

  /**
   * Get all logs matching a pattern
   */
  getLogsMatching(pattern: RegExp): string[] {
    return this.logs.filter(log => pattern.test(log));
  }

  /**
   * Check if a log exists
   */
  hasLog(pattern: RegExp): boolean {
    return this.logs.some(log => pattern.test(log));
  }

  /**
   * Clear captured logs
   */
  clear() {
    this.logs = [];
  }

  /**
   * Get all logs
   */
  getAllLogs(): string[] {
    return [...this.logs];
  }
}
