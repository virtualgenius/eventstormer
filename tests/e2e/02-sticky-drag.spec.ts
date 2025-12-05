import { test, expect } from '@playwright/test'
import { CanvasPage } from '../pages/CanvasPage'
import { getShapes, waitForShapeCountIncrease, clearAllShapes, waitForShapeCount, getShapeCount } from '../utils/tldraw'

test.describe('Shape Drag & Drop', () => {
  let canvasPage: CanvasPage

  test.beforeEach(async ({ page }, testInfo) => {
    canvasPage = new CanvasPage(page, testInfo)
    await canvasPage.goto()
    await clearAllShapes(page)
    await waitForShapeCount(page, 0)
  })

  test('should have shapes with position properties', async ({ page }) => {
    const initialCount = await getShapeCount(page)

    await canvasPage.selectTool('event-sticky')
    await waitForShapeCountIncrease(page, initialCount)
    await canvasPage.pressEscape()

    const shapes = await getShapes(page)
    const shape = shapes[0] as { x: number; y: number; id: string }

    expect(shape.x).toBeDefined()
    expect(shape.y).toBeDefined()
    expect(shape.id).toBeDefined()
  })

  test('should allow programmatic position update', async ({ page }) => {
    const initialCount = await getShapeCount(page)

    await canvasPage.selectTool('event-sticky')
    await waitForShapeCountIncrease(page, initialCount)
    await canvasPage.pressEscape()

    const shapesBefore = await getShapes(page)
    const shapeBefore = shapesBefore[0] as { x: number; y: number; id: string }

    await page.evaluate((id) => {
      const editor = (window as unknown as { __tldrawEditor: unknown }).__tldrawEditor as {
        updateShape: (update: { id: string; type: string; x: number; y: number }) => void
        getShape: (id: string) => { type: string; x: number; y: number }
      }
      const shape = editor.getShape(id)
      editor.updateShape({
        id,
        type: shape.type,
        x: shape.x + 100,
        y: shape.y + 50,
      })
    }, shapeBefore.id)

    await page.waitForTimeout(200)

    const shapesAfter = await getShapes(page)
    const shapeAfter = shapesAfter[0] as { x: number; y: number }

    expect(shapeAfter.x).toBeGreaterThan(shapeBefore.x)
    expect(shapeAfter.y).toBeGreaterThan(shapeBefore.y)
  })

  test('should preserve shape properties during position updates', async ({ page }) => {
    const initialCount = await getShapeCount(page)

    await canvasPage.selectTool('event-sticky')
    await waitForShapeCountIncrease(page, initialCount)
    await canvasPage.pressEscape()

    const shapesBefore = await getShapes(page)
    const shapeBefore = shapesBefore[0] as { x: number; y: number; id: string; type: string; props: { text: string } }

    await page.evaluate((id) => {
      const editor = (window as unknown as { __tldrawEditor: unknown }).__tldrawEditor as {
        updateShape: (update: { id: string; type: string; x: number; y: number }) => void
        getShape: (id: string) => { type: string }
      }
      const shape = editor.getShape(id)
      editor.updateShape({
        id,
        type: shape.type,
        x: 400,
        y: 300,
      })
    }, shapeBefore.id)

    await page.waitForTimeout(200)

    const shapesAfter = await getShapes(page)
    const shapeAfter = shapesAfter[0] as { id: string; type: string; props: { text: string } }

    expect(shapeAfter.id).toBe(shapeBefore.id)
    expect(shapeAfter.type).toBe(shapeBefore.type)
    expect(shapeAfter.props.text).toBe(shapeBefore.props.text)
  })
})
