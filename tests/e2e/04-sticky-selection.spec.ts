import { test, expect } from '@playwright/test'
import { CanvasPage } from '../pages/CanvasPage'
import { clearAllShapes, waitForShapeCount, getShapeCount, waitForShapeCountIncrease, getSelectedShapes } from '../utils/tldraw'

test.describe('Shape Selection', () => {
  let canvasPage: CanvasPage

  test.beforeEach(async ({ page }, testInfo) => {
    canvasPage = new CanvasPage(page, testInfo)
    await canvasPage.goto()
    await clearAllShapes(page)
    await waitForShapeCount(page, 0)
  })

  test('should have shape selected after creation', async ({ page }) => {
    const initialCount = await getShapeCount(page)

    await canvasPage.selectTool('event-sticky')
    await waitForShapeCountIncrease(page, initialCount)
    await canvasPage.pressEscape()

    await page.waitForTimeout(200)

    const selected = await getSelectedShapes(page)
    expect(selected.length).toBe(1)
  })

  test('should create multiple shapes', async ({ page }) => {
    const initialCount = await getShapeCount(page)

    await canvasPage.selectTool('event-sticky')
    await waitForShapeCountIncrease(page, initialCount)
    await canvasPage.pressEscape()

    const countAfterFirst = await getShapeCount(page)

    await canvasPage.selectTool('hotspot-sticky')
    await waitForShapeCountIncrease(page, countAfterFirst)
    await canvasPage.pressEscape()

    await page.waitForTimeout(200)

    const finalCount = await getShapeCount(page)
    expect(finalCount).toBe(2)
  })
})
