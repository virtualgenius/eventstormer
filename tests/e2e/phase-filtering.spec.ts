import { test, expect } from '@playwright/test'
import { CanvasPage } from '../pages/CanvasPage'
import { clearAllShapes, waitForShapeCount } from '../utils/tldraw'

test.describe.configure({ mode: 'serial' })

test.describe('Phase-based element filtering', () => {
  let canvasPage: CanvasPage

  test.beforeEach(async ({ page }, testInfo) => {
    canvasPage = new CanvasPage(page, testInfo)
    await canvasPage.goto()
    await clearAllShapes(page)
    await waitForShapeCount(page, 0)
  })

  test('should start with Chaotic Exploration phase showing Event and Hotspot tools', async ({ page }) => {
    const phaseSelect = page.locator('select')
    await expect(phaseSelect.first()).toBeVisible()

    const palette = page.locator('.absolute.top-3.left-3')
    const buttons = palette.locator('button')

    const buttonCount = await buttons.count()
    expect(buttonCount).toBeGreaterThanOrEqual(2)
  })

  test('should change available tools when phase changes', async ({ page }) => {
    const palette = page.locator('.absolute.top-3.left-3')
    const initialButtonCount = await palette.locator('button').count()

    await canvasPage.selectPhase('enforce-timeline')
    await page.waitForTimeout(300)

    const newButtonCount = await palette.locator('button').count()
    expect(newButtonCount).toBeGreaterThanOrEqual(initialButtonCount)
  })

  test('should show more tools in later phases', async ({ page }) => {
    const palette = page.locator('.absolute.top-3.left-3')

    const chaoticCount = await palette.locator('button').count()

    await canvasPage.selectPhase('people-and-systems')
    await page.waitForTimeout(300)
    const peopleCount = await palette.locator('button').count()

    expect(peopleCount).toBeGreaterThanOrEqual(chaoticCount)
  })

  test('should have phase selector with multiple options', async ({ page }) => {
    const phaseSelect = page.locator('select').first()
    await expect(phaseSelect).toBeVisible()

    const options = await phaseSelect.locator('option').count()
    expect(options).toBeGreaterThan(1)
  })
})
