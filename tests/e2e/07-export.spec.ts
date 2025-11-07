import { test, expect } from '@playwright/test';
import { CanvasPage } from '../pages/CanvasPage';
import { enableDebugMode } from '../utils/debug';
import { clearBoard } from '../utils/store';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe('PNG Export', () => {
  let canvasPage: CanvasPage;

  test.beforeEach(async ({ page }) => {
    await enableDebugMode(page);
    canvasPage = new CanvasPage(page);
    await canvasPage.goto();
    await clearBoard(page);
    await page.waitForTimeout(500);
  });

  test('should have export button visible', async ({ page }) => {
    await expect(canvasPage.exportButton).toBeVisible();
  });

  test('should download PNG file when export button clicked', async ({ page }) => {
    // Create some event stickies first
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(500);
    await canvasPage.createStickyAt('event', 500, 200);
    await page.waitForTimeout(500);

    // Click export and wait for download
    const download = await canvasPage.waitForDownload();

    // Verify download properties
    expect(download.suggestedFilename()).toContain('.png');
    expect(download.suggestedFilename()).toBe('eventstormer-board.png');
  });

  test('should export valid PNG file', async ({ page }) => {
    // Create sticky
    await canvasPage.createStickyAt('event', 300, 200);
    await page.waitForTimeout(200);

    // Download file
    const download = await canvasPage.waitForDownload();
    const downloadPath = path.join(__dirname, '..', '..', 'test-output', download.suggestedFilename());

    // Save file
    await download.saveAs(downloadPath);

    // Verify file exists
    expect(fs.existsSync(downloadPath)).toBe(true);

    // Verify file is PNG (check magic bytes)
    const buffer = fs.readFileSync(downloadPath);
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
    expect(buffer.slice(0, 4).equals(pngSignature)).toBe(true);

    // Cleanup
    fs.unlinkSync(downloadPath);
  });

  test('should export even with empty canvas', async ({ page }) => {
    // Don't create any stickies
    const download = await canvasPage.waitForDownload();

    expect(download.suggestedFilename()).toContain('.png');
  });
});
