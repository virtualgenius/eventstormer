import { useEffect, useCallback, useState } from 'react'
import { Editor, TLShapeId, createShapeId } from 'tldraw'
import { WorkshopMode, FacilitationPhase, ToolType, STICKY_TYPES, EDITABLE_TYPES } from '@/lib/workshopConfig'
import { calculateFlowShapePosition, calculateCenterPosition, calculateDuplicatePosition, calculateNextStickyPosition } from '@/lib/shapeLayout'
import { getDefaultProps, getShapeDimensions, isHalfHeight } from '@/lib/workshopConfig'
import { isTextInputElement, getEditingOrSelectedShape, selectAndStartEditing, saveEditingShapeText } from './editorHelpers'
import {
  FlowState,
  KeyboardContext,
  HandlerResult,
  handleTabToNextSticky,
  handleFlowNavigation,
  handleAlternativeCycle,
  handleBranchCreation,
  handleDuplicateShortcut,
  handleShapeCreationShortcut,
} from './keyboardHandlers'

interface UseKeyboardShortcutsParams {
  editor: Editor | null
  workshopMode: WorkshopMode
  phase: FacilitationPhase
}

export function useKeyboardShortcuts({ editor, workshopMode, phase }: UseKeyboardShortcutsParams) {
  const [flowState, setFlowState] = useState<FlowState | null>(null)

  const finishCurrentEditing = useCallback(() => {
    if (!editor) return
    const editingId = editor.getEditingShapeId()
    if (!editingId) return

    const activeEl = document.activeElement as HTMLElement
    if (activeEl) {
      saveEditingShapeText(editor, activeEl)
    } else {
      editor.setEditingShape(null)
    }
  }, [editor])

  const createShape = useCallback((type: ToolType) => {
    if (!editor) return

    const viewportCenter = editor.getViewportScreenCenter()
    const pagePoint = editor.screenToPage(viewportCenter)

    const config = getDefaultProps(type)
    const position = calculateCenterPosition(pagePoint, config, isHalfHeight(type))
    const newId = createShapeId()
    editor.createShape({ id: newId, type, x: position.x, y: position.y, props: config })

    if (EDITABLE_TYPES.includes(type)) {
      selectAndStartEditing(editor, newId)
    }
  }, [editor])

  const createNextSticky = useCallback(() => {
    if (!editor) return

    const sourceShape = getEditingOrSelectedShape(editor)
    if (!sourceShape) return

    const shapeType = sourceShape.type as ToolType
    if (!STICKY_TYPES.includes(shapeType)) return

    finishCurrentEditing()

    const props = sourceShape.props as { w: number; h: number; text?: string }
    const position = calculateNextStickyPosition({ x: sourceShape.x, y: sourceShape.y, props })

    const newId = createShapeId()
    editor.createShape({
      id: newId,
      type: shapeType,
      x: position.x,
      y: position.y,
      props: { text: '', w: props.w, h: props.h },
    })

    selectAndStartEditing(editor, newId)
  }, [editor, finishCurrentEditing])

  const duplicateSelected = useCallback(() => {
    if (!editor) return

    const selectedShapes = editor.getSelectedShapes()
    if (selectedShapes.length === 0) return

    const newIds: TLShapeId[] = []

    for (const shape of selectedShapes) {
      const newId = createShapeId()
      newIds.push(newId)

      const position = calculateDuplicatePosition({ x: shape.x, y: shape.y })
      editor.createShape({
        id: newId,
        type: shape.type,
        x: position.x,
        y: position.y,
        props: { ...shape.props },
      })
    }

    editor.select(...newIds)
  }, [editor])

  const createFlowShape = useCallback((
    sourceShape: { x: number; y: number; props: { w: number; h: number } },
    targetStickyType: string,
    direction: 'right' | 'left' | 'down'
  ): TLShapeId | null => {
    if (!editor) return null

    const targetDims = getShapeDimensions(targetStickyType)
    const position = calculateFlowShapePosition(sourceShape, targetStickyType, direction)

    const newId = createShapeId()
    editor.createShape({
      id: newId,
      type: targetStickyType,
      x: position.x,
      y: position.y,
      props: { text: '', w: targetDims.w, h: targetDims.h },
    })

    selectAndStartEditing(editor, newId)
    return newId
  }, [editor])

  const swapShapeType = useCallback((shapeId: TLShapeId, newStickyType: string) => {
    if (!editor) return

    const shape = editor.getShape(shapeId)
    if (!shape) return

    const newDims = getShapeDimensions(newStickyType)
    const props = shape.props as { text?: string }

    editor.deleteShapes([shapeId])
    editor.createShape({
      id: shapeId,
      type: newStickyType,
      x: shape.x,
      y: shape.y,
      props: { text: props.text || '', w: newDims.w, h: newDims.h },
    })

    selectAndStartEditing(editor, shapeId)
  }, [editor])

  const applyFlowStateUpdate = useCallback((result: HandlerResult): boolean => {
    if (!result.handled) return false
    if (result.newFlowState !== undefined) {
      setFlowState(result.newFlowState)
    }
    return true
  }, [])

  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const ctx: KeyboardContext = {
        editor,
        event: e,
        target,
        isInTextInput: isTextInputElement(target),
        workshopMode,
        phase,
        flowState,
      }

      if (handleTabToNextSticky(ctx, createNextSticky).handled) return
      if (applyFlowStateUpdate(handleFlowNavigation(ctx, createFlowShape))) return
      if (applyFlowStateUpdate(handleAlternativeCycle(ctx, swapShapeType))) return
      if (applyFlowStateUpdate(handleBranchCreation(ctx, createFlowShape))) return
      if (ctx.isInTextInput) return
      if (handleDuplicateShortcut(ctx, duplicateSelected).handled) return
      handleShapeCreationShortcut(ctx, createShape)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [editor, workshopMode, phase, flowState, createNextSticky, duplicateSelected, createShape, createFlowShape, swapShapeType, applyFlowStateUpdate])

  return { createShape, flowState }
}
