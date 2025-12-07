import { useEffect } from 'react'
import { ToolType } from '@/lib/workshopConfig'
import { applyPlacementCursor } from './placementCursorHandlers'

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
