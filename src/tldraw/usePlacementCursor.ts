import { useEffect } from 'react'
import { ToolType } from '@/lib/workshopConfig'
import { generatePlacementCursor } from '@/lib/cursorGeneration'

interface UsePlacementCursorParams {
  activeTool: ToolType | null
}

export function usePlacementCursor({ activeTool }: UsePlacementCursorParams) {
  useEffect(function updatePlacementCursor() {
    const container = document.querySelector('.tl-container') as HTMLElement | null
    if (!container) return

    if (activeTool) {
      const cursor = generatePlacementCursor(activeTool)
      if (cursor) {
        container.style.cursor = cursor
      }
    }

    return () => {
      if (container) {
        container.style.cursor = ''
      }
    }
  }, [activeTool])
}
