import { useEffect, useRef, useCallback } from 'react'
import { Editor, createShapeId, TLShapeId } from 'tldraw'
import { ToolType, getDefaultProps, EDITABLE_TYPES } from '@/lib/workshopConfig'
import { isClickNotDrag, Point } from '@/lib/clickDetection'
import { calculateClickPlacementPosition } from '@/lib/shapeLayout'
import { selectAndStartEditing } from './editorHelpers'

interface UseCanvasClickPlacementParams {
  editor: Editor | null
  activeTool: ToolType | null
  onPlacementComplete: () => void
}

function createShapeAtPoint(
  editor: Editor,
  toolType: ToolType,
  pagePoint: { x: number; y: number }
): TLShapeId {
  const config = getDefaultProps(toolType)
  const position = calculateClickPlacementPosition(pagePoint, config)
  const newId = createShapeId()
  editor.createShape({
    id: newId,
    type: toolType,
    x: position.x,
    y: position.y,
    props: config,
  })
  return newId
}

function shouldSkipPlacement(
  activeTool: ToolType | null,
  editor: Editor | null,
  mouseDownPos: Point | null
): boolean {
  return !activeTool || !editor || !mouseDownPos
}

export function useCanvasClickPlacement({
  editor,
  activeTool,
  onPlacementComplete,
}: UseCanvasClickPlacementParams) {
  const mouseDownPosRef = useRef<Point | null>(null)

  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (!activeTool || !editor) return
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY }
  }, [activeTool, editor])

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (shouldSkipPlacement(activeTool, editor, mouseDownPosRef.current)) return

    const endPos = { x: e.clientX, y: e.clientY }
    const wasClick = isClickNotDrag(mouseDownPosRef.current!, endPos)
    mouseDownPosRef.current = null

    if (!wasClick) return

    const pagePoint = editor!.screenToPage({ x: e.clientX, y: e.clientY })
    const shapeAtPoint = editor!.getShapeAtPoint(pagePoint)
    if (shapeAtPoint) return

    const newId = createShapeAtPoint(editor!, activeTool!, pagePoint)

    if (EDITABLE_TYPES.includes(activeTool!)) {
      selectAndStartEditing(editor!, newId)
    }

    onPlacementComplete()
  }, [activeTool, editor, onPlacementComplete])

  useEffect(() => {
    if (!editor || !activeTool) return

    const container = document.querySelector('.tl-container')
    if (!container) return

    container.addEventListener('pointerdown', handlePointerDown as EventListener)
    container.addEventListener('pointerup', handlePointerUp as EventListener)

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown as EventListener)
      container.removeEventListener('pointerup', handlePointerUp as EventListener)
    }
  }, [editor, activeTool, handlePointerDown, handlePointerUp])
}
