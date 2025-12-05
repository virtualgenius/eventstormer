import { Page } from '@playwright/test'

const DEFAULT_TIMEOUT_MS = 5000
const EDITOR_READY_TIMEOUT_MS = 10000

export async function getShapes(page: Page): Promise<unknown[]> {
  return await page.evaluate(() => {
    const editor = (window as unknown as { __tldrawEditor: unknown }).__tldrawEditor
    if (!editor || typeof editor !== 'object') return []
    const editorWithShapes = editor as { getCurrentPageShapes: () => unknown[] }
    return editorWithShapes.getCurrentPageShapes()
  })
}

export async function getShapeCount(page: Page): Promise<number> {
  const shapes = await getShapes(page)
  return shapes.length
}

export async function getShapesByType(page: Page, type: string): Promise<unknown[]> {
  const shapes = await getShapes(page)
  return shapes.filter((s: unknown) => (s as { type: string }).type === type)
}

export async function waitForShapeCount(page: Page, expectedCount: number, timeout = DEFAULT_TIMEOUT_MS): Promise<void> {
  await page.waitForFunction(
    (expected) => {
      const editor = (window as unknown as { __tldrawEditor: unknown }).__tldrawEditor
      if (!editor || typeof editor !== 'object') return false
      const editorWithShapes = editor as { getCurrentPageShapes: () => unknown[] }
      return editorWithShapes.getCurrentPageShapes().length === expected
    },
    expectedCount,
    { timeout }
  )
}

export async function waitForShapeCountIncrease(page: Page, initialCount: number, timeout = DEFAULT_TIMEOUT_MS): Promise<void> {
  await page.waitForFunction(
    (initial) => {
      const editor = (window as unknown as { __tldrawEditor: unknown }).__tldrawEditor
      if (!editor || typeof editor !== 'object') return false
      const editorWithShapes = editor as { getCurrentPageShapes: () => unknown[] }
      return editorWithShapes.getCurrentPageShapes().length > initial
    },
    initialCount,
    { timeout }
  )
}

export async function waitForEditor(page: Page, timeout = EDITOR_READY_TIMEOUT_MS): Promise<void> {
  await page.waitForFunction(
    () => {
      const editor = (window as unknown as { __tldrawEditor: unknown }).__tldrawEditor
      return editor !== undefined && editor !== null
    },
    { timeout }
  )
}

export async function getSelectedShapes(page: Page): Promise<unknown[]> {
  return await page.evaluate(() => {
    const editor = (window as unknown as { __tldrawEditor: unknown }).__tldrawEditor
    if (!editor || typeof editor !== 'object') return []
    const editorWithSelection = editor as { getSelectedShapes: () => unknown[] }
    return editorWithSelection.getSelectedShapes()
  })
}

export async function getEditingShapeId(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    const editor = (window as unknown as { __tldrawEditor: unknown }).__tldrawEditor
    if (!editor || typeof editor !== 'object') return null
    const editorWithEditing = editor as { getEditingShapeId: () => string | null }
    return editorWithEditing.getEditingShapeId()
  })
}

export async function clearAllShapes(page: Page): Promise<void> {
  await page.evaluate(() => {
    const editor = (window as unknown as { __tldrawEditor: unknown }).__tldrawEditor
    if (!editor || typeof editor !== 'object') return
    const editorWithMethods = editor as {
      getCurrentPageShapes: () => { id: string }[]
      deleteShapes: (ids: string[]) => void
    }
    const shapes = editorWithMethods.getCurrentPageShapes()
    if (shapes.length > 0) {
      editorWithMethods.deleteShapes(shapes.map(s => s.id))
    }
  })
}

export async function waitForEditMode(page: Page, timeout = DEFAULT_TIMEOUT_MS): Promise<void> {
  await page.waitForFunction(
    () => {
      const editor = (window as unknown as { __tldrawEditor: unknown }).__tldrawEditor
      if (!editor || typeof editor !== 'object') return false
      const editorWithEditing = editor as { getEditingShapeId: () => string | null }
      return editorWithEditing.getEditingShapeId() !== null
    },
    { timeout }
  )
}
