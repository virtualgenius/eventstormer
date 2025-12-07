import { useEffect } from 'react'
import { ToolType } from '@/lib/workshopConfig'
import { generatePlacementCursor } from '@/lib/cursorGeneration'

const TLDRAW_CURSOR_SELECTORS = ['.tl-container', '.tl-canvas', '.tl-background']

const setCursorOnElements = (cursor: string): void => {
  TLDRAW_CURSOR_SELECTORS.forEach(selector => {
    const element = document.querySelector(selector) as HTMLElement | null
    if (element) element.style.cursor = cursor
  })
}

export function applyPlacementCursor(activeTool: ToolType | null): void {
  const container = document.querySelector('.tl-container')
  if (!container) return

  const cursor = activeTool ? generatePlacementCursor(activeTool) : null
  setCursorOnElements(cursor || '')
}

interface UsePlacementCursorParams {
  activeTool: ToolType | null
}

export function usePlacementCursor({ activeTool }: UsePlacementCursorParams) {
  useEffect(function updatePlacementCursor() {
    applyPlacementCursor(activeTool)

    return () => {
      applyPlacementCursor(null)
    }
  }, [activeTool])
}
