import { useEffect, useCallback } from 'react'
import { Editor } from 'tldraw'
import { ToolType } from '@/lib/workshopConfig'
import { usePivotalPreviewStore } from './pivotalPreviewStore'

interface UsePivotalPreviewParams {
  editor: Editor | null
  activeTool: ToolType | null
}

export function usePivotalPreview({ editor, activeTool }: UsePivotalPreviewParams) {
  const setPreviewId = usePivotalPreviewStore((state) => state.setPreviewId)
  const isVerticalLineTool = activeTool === 'vertical-line'

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!editor || !isVerticalLineTool) return

    const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY })
    const shapeAtPoint = editor.getShapeAtPoint(pagePoint)

    if (shapeAtPoint?.type === 'event-sticky') {
      setPreviewId(shapeAtPoint.id)
    } else {
      setPreviewId(null)
    }
  }, [editor, isVerticalLineTool, setPreviewId])

  useEffect(() => {
    if (!editor || !isVerticalLineTool) {
      setPreviewId(null)
      return
    }

    const container = document.querySelector('.tl-container')
    if (!container) return

    container.addEventListener('pointermove', handlePointerMove as EventListener)

    return () => {
      container.removeEventListener('pointermove', handlePointerMove as EventListener)
      setPreviewId(null)
    }
  }, [editor, isVerticalLineTool, handlePointerMove, setPreviewId])
}
