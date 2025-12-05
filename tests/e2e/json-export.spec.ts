import { test, expect } from '@playwright/test'
import { CanvasPage } from '../pages/CanvasPage'
import { clearAllShapes, waitForShapeCount, getShapeCount, waitForShapeCountIncrease } from '../utils/tldraw'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

test.describe('JSON Export', () => {
  let canvasPage: CanvasPage

  test.beforeEach(async ({ page }, testInfo) => {
    canvasPage = new CanvasPage(page, testInfo)
    await canvasPage.goto()
    await clearAllShapes(page)
    await waitForShapeCount(page, 0)
  })

  test('should have export button visible', async () => {
    const exportButton = canvasPage.page.getByRole('button', { name: /Export/i })
    await expect(exportButton).toBeVisible()
  })

  test('should download JSON file when export button clicked', async ({ page }) => {
    const initialCount = await getShapeCount(page)

    await canvasPage.selectTool('event-sticky')
    await waitForShapeCountIncrease(page, initialCount)
    await canvasPage.pressEscape()

    const downloadPromise = page.waitForEvent('download')
    await canvasPage.clickExport()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toContain('.json')
  })

  test('should export valid JSON file', async ({ page }) => {
    const initialCount = await getShapeCount(page)

    await canvasPage.selectTool('event-sticky')
    await waitForShapeCountIncrease(page, initialCount)
    await canvasPage.pressEscape()

    const downloadPromise = page.waitForEvent('download')
    await canvasPage.clickExport()
    const download = await downloadPromise

    const testOutputDir = path.join(__dirname, '..', '..', 'test-output')
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true })
    }

    const downloadPath = path.join(testOutputDir, download.suggestedFilename())
    await download.saveAs(downloadPath)

    expect(fs.existsSync(downloadPath)).toBe(true)

    const content = fs.readFileSync(downloadPath, 'utf-8')
    const parsed = JSON.parse(content)
    expect(parsed).toBeDefined()
    expect(parsed.document).toBeDefined()

    fs.unlinkSync(downloadPath)
  })

  test('should export even with empty canvas', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')
    await canvasPage.clickExport()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toContain('.json')
  })
})
