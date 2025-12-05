import { defineConfig, devices } from '@playwright/test';

const TEST_RUN_ID = `e2e-${Date.now()}`;

export default defineConfig({
  testDir: './tests/e2e',
  // Run tests serially - Yjs syncs shapes across parallel tests on same board
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Unique board ID per test run to avoid Cloudflare storage accumulation
  metadata: {
    testRunId: TEST_RUN_ID,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
