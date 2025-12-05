import { test, expect } from '@playwright/test'
import { CanvasPage } from '../pages/CanvasPage'
import { getShapesByType, waitForShapeCountIncrease, clearAllShapes, getEditingShapeId, getShapeCount, waitForShapeCount, waitForEditMode } from '../utils/tldraw'

test.describe('Shape Text Editing', () => {
  let canvasPage: CanvasPage

  test.beforeEach(async ({ page }, testInfo) => {
    canvasPage = new CanvasPage(page, testInfo)
    await canvasPage.goto()
    await clearAllShapes(page)
    await waitForShapeCount(page, 0)
  })

  test('should enter edit mode after shape creation', async ({ page }) => {
    await canvasPage.selectTool('event-sticky')
    await waitForEditMode(page)
  })

  test('should type text into shape while editing', async ({ page }) => {
    await canvasPage.selectTool('event-sticky')
    await waitForEditMode(page)

    const textarea = page.locator('textarea').first()
    await textarea.waitFor({ state: 'visible' })
    await textarea.focus()

    await canvasPage.typeText('User logged in')
    await canvasPage.pressEscape()
    await page.waitForTimeout(300)

    const eventShapes = await getShapesByType(page, 'event-sticky')
    const lastShape = eventShapes[eventShapes.length - 1] as { props: { text: string } }
    expect(lastShape.props.text).toBe('User logged in')
  })

  test('should exit edit mode on Escape', async ({ page }) => {
    await canvasPage.selectTool('event-sticky')
    await waitForEditMode(page)

    await canvasPage.pressEscape()
    await page.waitForTimeout(200)

    const editingAfter = await getEditingShapeId(page)
    expect(editingAfter).toBeNull()
  })

  test('should create next sticky with Tab while editing', async ({ page }) => {
    const initialCount = await getShapeCount(page)

    await canvasPage.selectTool('event-sticky')
    await waitForShapeCountIncrease(page, initialCount)
    await waitForEditMode(page)

    await canvasPage.typeText('First event')

    const countBeforeTab = await getShapeCount(page)

    await canvasPage.pressTab()
    await waitForShapeCountIncrease(page, countBeforeTab)
    await waitForEditMode(page)
  })
})
