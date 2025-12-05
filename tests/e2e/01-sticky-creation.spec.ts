import { test, expect } from '@playwright/test'
import { CanvasPage } from '../pages/CanvasPage'
import { getShapeCount, getShapesByType, waitForShapeCountIncrease, clearAllShapes, waitForShapeCount, waitForEditMode } from '../utils/tldraw'

test.describe('Shape Creation', () => {
  let canvasPage: CanvasPage

  test.beforeEach(async ({ page }, testInfo) => {
    canvasPage = new CanvasPage(page, testInfo)
    await canvasPage.goto()
    await clearAllShapes(page)
    await waitForShapeCount(page, 0)
  })

  test('should create event sticky when clicking palette tool', async ({ page }) => {
    const initialCount = await getShapeCount(page)

    await canvasPage.selectTool('event-sticky')

    await waitForShapeCountIncrease(page, initialCount)

    const eventShapes = await getShapesByType(page, 'event-sticky')
    expect(eventShapes.length).toBeGreaterThan(0)
  })

  test('should create hotspot sticky when clicking palette tool', async ({ page }) => {
    const initialCount = await getShapeCount(page)

    await canvasPage.selectTool('hotspot-sticky')

    await waitForShapeCountIncrease(page, initialCount)

    const hotspotShapes = await getShapesByType(page, 'hotspot-sticky')
    expect(hotspotShapes.length).toBeGreaterThan(0)
  })

  test('should create multiple stickies', async ({ page }) => {
    const initialCount = await getShapeCount(page)

    await canvasPage.selectTool('event-sticky')
    await waitForShapeCountIncrease(page, initialCount)

    const countAfterFirst = await getShapeCount(page)
    expect(countAfterFirst).toBeGreaterThan(initialCount)

    await canvasPage.pressEscape()

    await canvasPage.selectTool('event-sticky')
    await waitForShapeCountIncrease(page, countAfterFirst)

    const finalCount = await getShapeCount(page)
    expect(finalCount).toBeGreaterThan(countAfterFirst)
  })

  test('should enter edit mode after creating sticky', async ({ page }) => {
    await canvasPage.selectTool('event-sticky')

    await waitForEditMode(page)
  })

  test('should create sticky with empty text initially', async ({ page }) => {
    const initialCount = await getShapeCount(page)

    await canvasPage.selectTool('event-sticky')
    await waitForShapeCountIncrease(page, initialCount)

    const eventShapes = await getShapesByType(page, 'event-sticky')
    const lastShape = eventShapes[eventShapes.length - 1] as { props: { text: string } }
    expect(lastShape.props.text).toBe('')
  })
})
