import { useEffect, useCallback, useState } from 'react'
import { Editor, TLShapeId, TLShape, createShapeId } from 'tldraw'
import { WorkshopMode, FacilitationPhase, ToolType, STICKY_TYPES, EDITABLE_TYPES } from '@/lib/workshopConfig'
import { calculateFlowShapePosition, calculateClickPlacementPosition, calculateDuplicatePosition, calculateNextStickyPosition } from '@/lib/shapeLayout'
import { getDefaultProps, getShapeDimensions } from '@/lib/workshopConfig'
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

function useFinishEditing(editor: Editor | null) {
  return useCallback(() => {
    if (!editor) return
    const editingId = editor.getEditingShapeId()
    if (!editingId) return
    const activeEl = document.activeElement as HTMLElement
    if (activeEl) saveEditingShapeText(editor, activeEl)
    else editor.setEditingShape(null)
  }, [editor])
}

function useCreateShape(editor: Editor | null) {
  return useCallback((type: ToolType) => {
    if (!editor) return
    const cursorPoint = editor.inputs.currentPagePoint
    const config = getDefaultProps(type)
    const position = calculateClickPlacementPosition(cursorPoint, config)
    const newId = createShapeId()
    editor.createShape({ id: newId, type, x: position.x, y: position.y, props: config })
    if (EDITABLE_TYPES.includes(type)) selectAndStartEditing(editor, newId)
  }, [editor])
}

function useCreateNextSticky(editor: Editor | null, finishCurrentEditing: () => void) {
  return useCallback(() => {
    if (!editor) return
    const sourceShape = getEditingOrSelectedShape(editor)
    if (!sourceShape) return
    const shapeType = sourceShape.type as ToolType
    if (!STICKY_TYPES.includes(shapeType)) return
    finishCurrentEditing()
    const props = sourceShape.props as { w: number; h: number; text?: string }
    const position = calculateNextStickyPosition({ x: sourceShape.x, y: sourceShape.y, props })
    const newId = createShapeId()
    editor.createShape({ id: newId, type: shapeType, x: position.x, y: position.y, props: { text: '', w: props.w, h: props.h } })
    selectAndStartEditing(editor, newId)
  }, [editor, finishCurrentEditing])
}

function duplicateShape(editor: Editor, shape: TLShape): TLShapeId {
  const newId = createShapeId()
  const position = calculateDuplicatePosition({ x: shape.x, y: shape.y })
  editor.createShape({ id: newId, type: shape.type, x: position.x, y: position.y, props: { ...shape.props } })
  return newId
}

function useDuplicateSelected(editor: Editor | null) {
  return useCallback(() => {
    if (!editor) return
    const selectedShapes = editor.getSelectedShapes()
    if (selectedShapes.length === 0) return
    const newIds = selectedShapes.map(shape => duplicateShape(editor, shape))
    editor.select(...newIds)
  }, [editor])
}

function useCreateFlowShape(editor: Editor | null) {
  return useCallback((
    sourceShape: { x: number; y: number; props: { w: number; h: number } },
    targetStickyType: string,
    direction: 'right' | 'left' | 'down'
  ): TLShapeId | null => {
    if (!editor) return null
    const targetDims = getShapeDimensions(targetStickyType)
    const position = calculateFlowShapePosition(sourceShape, targetStickyType, direction)
    const newId = createShapeId()
    editor.createShape({ id: newId, type: targetStickyType, x: position.x, y: position.y, props: { text: '', w: targetDims.w, h: targetDims.h } })
    selectAndStartEditing(editor, newId)
    return newId
  }, [editor])
}

function useSwapShapeType(editor: Editor | null) {
  return useCallback((shapeId: TLShapeId, newStickyType: string) => {
    if (!editor) return
    const shape = editor.getShape(shapeId)
    if (!shape) return
    const newDims = getShapeDimensions(newStickyType)
    const props = shape.props as { text?: string }
    editor.deleteShapes([shapeId])
    editor.createShape({ id: shapeId, type: newStickyType, x: shape.x, y: shape.y, props: { text: props.text || '', w: newDims.w, h: newDims.h } })
    selectAndStartEditing(editor, shapeId)
  }, [editor])
}

function useApplyFlowStateUpdate(setFlowState: (state: FlowState | null) => void) {
  return useCallback((result: HandlerResult): boolean => {
    if (!result.handled) return false
    if (result.newFlowState !== undefined) setFlowState(result.newFlowState)
    return true
  }, [setFlowState])
}

function buildKeyboardContext(
  editor: Editor, e: KeyboardEvent, workshopMode: WorkshopMode, phase: FacilitationPhase, flowState: FlowState | null
): KeyboardContext {
  const target = e.target as HTMLElement
  return { editor, event: e, target, isInTextInput: isTextInputElement(target), workshopMode, phase, flowState }
}

type FlowShapeCreator = (
  sourceShape: { x: number; y: number; props: { w: number; h: number } },
  targetStickyType: string,
  direction: 'right' | 'left' | 'down'
) => TLShapeId | null

interface KeyboardHandlers {
  createNextSticky: () => void
  createFlowShape: FlowShapeCreator
  swapShapeType: (shapeId: TLShapeId, newStickyType: string) => void
  duplicateSelected: () => void
  createShape: (type: ToolType) => void
  applyFlowStateUpdate: (result: HandlerResult) => boolean
}

function processFlowHandlers(ctx: KeyboardContext, handlers: KeyboardHandlers): boolean {
  if (handlers.applyFlowStateUpdate(handleFlowNavigation(ctx, handlers.createFlowShape))) return true
  if (handlers.applyFlowStateUpdate(handleAlternativeCycle(ctx, handlers.swapShapeType))) return true
  if (handlers.applyFlowStateUpdate(handleBranchCreation(ctx, handlers.createFlowShape))) return true
  return false
}

function processKeyDown(ctx: KeyboardContext, handlers: KeyboardHandlers): void {
  if (handleTabToNextSticky(ctx, handlers.createNextSticky).handled) return
  if (processFlowHandlers(ctx, handlers)) return
  if (ctx.isInTextInput) return
  if (handleDuplicateShortcut(ctx, handlers.duplicateSelected).handled) return
  handleShapeCreationShortcut(ctx, handlers.createShape)
}

export function useKeyboardShortcuts({ editor, workshopMode, phase }: UseKeyboardShortcutsParams) {
  const [flowState, setFlowState] = useState<FlowState | null>(null)
  const finishCurrentEditing = useFinishEditing(editor)
  const createShape = useCreateShape(editor)
  const createNextSticky = useCreateNextSticky(editor, finishCurrentEditing)
  const duplicateSelected = useDuplicateSelected(editor)
  const createFlowShape = useCreateFlowShape(editor)
  const swapShapeType = useSwapShapeType(editor)
  const applyFlowStateUpdate = useApplyFlowStateUpdate(setFlowState)

  useEffect(() => {
    if (!editor) return
    const handlers: KeyboardHandlers = { createNextSticky, createFlowShape, swapShapeType, duplicateSelected, createShape, applyFlowStateUpdate }
    const handleKeyDown = (e: KeyboardEvent) => processKeyDown(buildKeyboardContext(editor, e, workshopMode, phase, flowState), handlers)
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [editor, workshopMode, phase, flowState, createNextSticky, duplicateSelected, createShape, createFlowShape, swapShapeType, applyFlowStateUpdate])

  return { createShape, flowState }
}
