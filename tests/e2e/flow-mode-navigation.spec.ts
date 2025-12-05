import { test, expect } from '@playwright/test'
import { CanvasPage } from '../pages/CanvasPage'
import { clearAllShapes, waitForShapeCount, getShapeCount, waitForShapeCountIncrease, getShapesByType } from '../utils/tldraw'

test.describe('Flow Mode Navigation', () => {
  let canvasPage: CanvasPage

  test.beforeEach(async ({ page }, testInfo) => {
    canvasPage = new CanvasPage(page, testInfo)
    await canvasPage.goto()
    await clearAllShapes(page)
    await waitForShapeCount(page, 0)
  })

  test('should create next shape in flow when pressing ArrowRight in process mode', async ({ page }) => {
    await canvasPage.selectWorkshopMode('process-modeling')
    await page.waitForTimeout(200)

    await page.keyboard.press('p')
    await waitForShapeCountIncrease(page, 0)
    await canvasPage.pressEscape()
    await page.waitForTimeout(100)

    const countAfterPerson = await getShapeCount(page)

    await page.keyboard.press('ArrowRight')
    await waitForShapeCountIncrease(page, countAfterPerson)

    const commandShapes = await getShapesByType(page, 'command-sticky')
    expect(commandShapes.length).toBe(1)
  })
})
