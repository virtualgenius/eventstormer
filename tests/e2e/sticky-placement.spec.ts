import { test, expect } from '@playwright/test'
import { CanvasPage } from '../pages/CanvasPage'
import { clearAllShapes, waitForShapeCount, getShapeCount, waitForShapeCountIncrease, getShapesByType } from '../utils/tldraw'

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

test.describe('Sticky Placement - Tool Selection', () => {
  let canvasPage: CanvasPage

  test.beforeEach(async ({ page }, testInfo) => {
    canvasPage = new CanvasPage(page, testInfo)
    await canvasPage.goto()
    await clearAllShapes(page)
    await waitForShapeCount(page, 0)
  })

  test('palette click selects tool without creating sticky', async ({ page }) => {
    const initialCount = await getShapeCount(page)

    await page.click('[data-tool="event-sticky"]')

    await expect(page.locator('[data-tool="event-sticky"]')).toHaveAttribute('data-active', 'true')
    expect(await getShapeCount(page)).toBe(initialCount)
  })

  test('clicking same tool toggles it off', async ({ page }) => {
    await page.click('[data-tool="event-sticky"]')
    await expect(page.locator('[data-tool="event-sticky"]')).toHaveAttribute('data-active', 'true')

    await page.click('[data-tool="event-sticky"]')
    await expect(page.locator('[data-tool="event-sticky"]')).toHaveAttribute('data-active', 'false')
  })

  test('clicking different tool switches selection', async ({ page }) => {
    await page.click('[data-tool="event-sticky"]')
    await expect(page.locator('[data-tool="event-sticky"]')).toHaveAttribute('data-active', 'true')

    await page.click('[data-tool="hotspot-sticky"]')
    await expect(page.locator('[data-tool="event-sticky"]')).toHaveAttribute('data-active', 'false')
    await expect(page.locator('[data-tool="hotspot-sticky"]')).toHaveAttribute('data-active', 'true')
  })
})

test.describe('Sticky Placement - Canvas Click', () => {
  let canvasPage: CanvasPage

  test.beforeEach(async ({ page }, testInfo) => {
    canvasPage = new CanvasPage(page, testInfo)
    await canvasPage.goto()
    await clearAllShapes(page)
    await waitForShapeCount(page, 0)
  })

  test('canvas click creates sticky at click position', async ({ page }) => {
    await page.click('[data-tool="event-sticky"]')
    const initialCount = await getShapeCount(page)

    await canvasPage.clickCanvasAt(400, 300)

    await waitForShapeCountIncrease(page, initialCount)
    const shapes = await getShapesByType(page, 'event-sticky')
    expect(shapes.length).toBe(1)
  })

  test('tool deselects after placing sticky', async ({ page }) => {
    await page.click('[data-tool="event-sticky"]')
    await canvasPage.clickCanvasAt(400, 300)

    await expect(page.locator('[data-tool="event-sticky"]')).toHaveAttribute('data-active', 'false')
  })
})

test.describe('Sticky Placement - Escape Key', () => {
  let canvasPage: CanvasPage

  test.beforeEach(async ({ page }, testInfo) => {
    canvasPage = new CanvasPage(page, testInfo)
    await canvasPage.goto()
    await clearAllShapes(page)
    await waitForShapeCount(page, 0)
  })

  test('Escape deselects active tool', async ({ page }) => {
    await page.click('[data-tool="event-sticky"]')
    await expect(page.locator('[data-tool="event-sticky"]')).toHaveAttribute('data-active', 'true')

    await page.keyboard.press('Escape')

    await expect(page.locator('[data-tool="event-sticky"]')).toHaveAttribute('data-active', 'false')
  })

  test('Escape does nothing when no tool selected', async ({ page }) => {
    await expect(page.locator('[data-tool="event-sticky"]')).toHaveAttribute('data-active', 'false')

    await page.keyboard.press('Escape')

    await expect(page.locator('[data-tool="event-sticky"]')).toHaveAttribute('data-active', 'false')
  })
})

test.describe('Sticky Placement - Custom Cursor', () => {
  let canvasPage: CanvasPage

  test.beforeEach(async ({ page }, testInfo) => {
    canvasPage = new CanvasPage(page, testInfo)
    await canvasPage.goto()
    await clearAllShapes(page)
    await waitForShapeCount(page, 0)
  })

  test('cursor changes when tool selected', async ({ page }) => {
    await page.click('[data-tool="event-sticky"]')

    const container = page.locator('.tl-container')
    const cursor = await container.evaluate(el => getComputedStyle(el).cursor)

    expect(cursor).toContain('url(')
    expect(cursor).toContain('crosshair')
  })

  test('cursor resets when tool deselected', async ({ page }) => {
    await page.click('[data-tool="event-sticky"]')
    await page.keyboard.press('Escape')

    const container = page.locator('.tl-container')
    const cursor = await container.evaluate(el => getComputedStyle(el).cursor)

    expect(cursor).not.toContain('url(data:image/svg')
  })

  test('different tools show different cursors', async ({ page }) => {
    await page.click('[data-tool="event-sticky"]')
    const container = page.locator('.tl-container')
    const eventCursor = await container.evaluate(el => getComputedStyle(el).cursor)

    await page.click('[data-tool="hotspot-sticky"]')
    const hotspotCursor = await container.evaluate(el => getComputedStyle(el).cursor)

    expect(eventCursor).not.toBe(hotspotCursor)
  })
})
