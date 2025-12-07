import { test, expect } from '@playwright/test'
import { CanvasPage } from '../pages/CanvasPage'
import { clearAllShapes, waitForShapeCount, getShapeCount, waitForShapeCountIncrease } from '../utils/tldraw'

test.describe('Real-time Collaboration', () => {
  test('should sync shape creation across browser contexts', async ({ browser }, testInfo) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    const canvasPage1 = new CanvasPage(page1, testInfo)
    const canvasPage2 = new CanvasPage(page2, testInfo)

    await canvasPage1.goto()
    await canvasPage2.goto()

    await page1.waitForTimeout(1000)
    await page2.waitForTimeout(1000)

    await clearAllShapes(page1)
    await waitForShapeCount(page1, 0)
    await page2.waitForTimeout(500)

    const initialCount = await getShapeCount(page2)

    await canvasPage1.createShapeAt('event-sticky', 400, 300)
    await waitForShapeCountIncrease(page1, 0)

    await page2.waitForFunction(
      (initial) => {
        const editor = (window as unknown as { __tldrawEditor: unknown }).__tldrawEditor
        if (!editor || typeof editor !== 'object') return false
        const editorWithShapes = editor as { getCurrentPageShapes: () => unknown[] }
        return editorWithShapes.getCurrentPageShapes().length > initial
      },
      initialCount,
      { timeout: 10000 }
    )

    const finalCount = await getShapeCount(page2)
    expect(finalCount).toBeGreaterThan(initialCount)

    await context1.close()
    await context2.close()
  })

  test('should show connection status', async ({ page }, testInfo) => {
    const canvasPage = new CanvasPage(page, testInfo)
    await canvasPage.goto()

    const status = await canvasPage.getConnectionStatus()
    expect(['Connected', 'Syncing', 'Loading', 'Offline', 'Connecting', 'unknown']).toContain(status)
  })
})
