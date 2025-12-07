import { test, expect } from '@playwright/test'
import { CanvasPage } from '../pages/CanvasPage'
import { clearAllShapes, waitForShapeCount } from '../utils/tldraw'

test.describe('Sticky Placement - Data Attributes', () => {
  let canvasPage: CanvasPage

  test.beforeEach(async ({ page }, testInfo) => {
    canvasPage = new CanvasPage(page, testInfo)
    await canvasPage.goto()
    await clearAllShapes(page)
    await waitForShapeCount(page, 0)
  })

  test('palette buttons have data-tool attribute', async ({ page }) => {
    await expect(page.locator('[data-tool="event-sticky"]')).toBeVisible()
    await expect(page.locator('[data-tool="hotspot-sticky"]')).toBeVisible()
    await expect(page.locator('[data-tool="theme-area"]')).toBeVisible()
    await expect(page.locator('[data-tool="label"]')).toBeVisible()
  })

  test('palette buttons have data-active attribute set to false initially', async ({ page }) => {
    await expect(page.locator('[data-tool="event-sticky"]')).toHaveAttribute('data-active', 'false')
    await expect(page.locator('[data-tool="hotspot-sticky"]')).toHaveAttribute('data-active', 'false')
  })
})
