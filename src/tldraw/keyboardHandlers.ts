import type { Editor, TLShape, TLShapeId } from 'tldraw'
import type { WorkshopMode, FacilitationPhase, ToolType } from '@/lib/workshopConfig'
import type { FlowDirection, FlowElementType } from '@/lib/flowSequence'
import {
  getDefaultNext,
  cycleAlternative,
  canCreateBranch,
  getBranchType,
  fromStickyType,
  toStickyType,
} from '@/lib/flowSequence'
import {
  getShapeTypeForKey,
  getTldrawToolForKey,
} from '@/lib/workshopConfig'
import {
  isFlowModeActive,
  isUnmodifiedArrowKey,
  getEditingOrSelectedShape,
  saveEditingShapeText,
} from './editorHelpers'

export interface FlowState {
  lastCreatedId: TLShapeId
  direction: FlowDirection
  sourceType: FlowElementType
  alternativeIndex: number
}

export interface KeyboardContext {
  editor: Editor
  event: KeyboardEvent
  target: HTMLElement
  isInTextInput: boolean
  workshopMode: WorkshopMode
  phase: FacilitationPhase
  flowState: FlowState | null
}

export interface HandlerResult {
  handled: boolean
  newFlowState?: FlowState | null
}

// ============================================================================
// Predicate Functions
// ============================================================================

export function shouldHandleTabNavigation(e: KeyboardEvent): boolean {
  return e.key === 'Tab' && !e.shiftKey
}

export function shouldHandleFlowNavigation(
  e: KeyboardEvent,
  workshopMode: WorkshopMode
): boolean {
  return (
    isFlowModeActive(workshopMode) &&
    isUnmodifiedArrowKey(e, ['ArrowRight', 'ArrowLeft'])
  )
}

export function shouldCycleAlternative(
  e: KeyboardEvent,
  workshopMode: WorkshopMode,
  flowState: FlowState | null
): boolean {
  return (
    isFlowModeActive(workshopMode) &&
    isUnmodifiedArrowKey(e, ['ArrowDown', 'ArrowUp']) &&
    flowState !== null
  )
}

export function shouldCreateBranch(
  e: KeyboardEvent,
  workshopMode: WorkshopMode,
  sourceShape: TLShape | null
): boolean {
  if (!isFlowModeActive(workshopMode)) return false
  if (e.key !== 'ArrowDown') return false
  if (!isUnmodifiedArrowKey(e, ['ArrowDown'])) return false
  if (!sourceShape) return false

  const flowType = fromStickyType(sourceShape.type)
  return flowType !== null && canCreateBranch(flowType)
}

export function shouldHandleDuplicateShortcut(e: KeyboardEvent): boolean {
  return e.key === 'd' && (e.metaKey || e.ctrlKey)
}

export function shouldHandleShapeCreationShortcut(e: KeyboardEvent): boolean {
  return !e.metaKey && !e.ctrlKey && !e.altKey
}

// ============================================================================
// Handler Functions
// ============================================================================

export function handleTabToNextSticky(
  ctx: KeyboardContext,
  createNextSticky: () => void
): HandlerResult {
  if (!shouldHandleTabNavigation(ctx.event)) {
    return { handled: false }
  }

  ctx.event.preventDefault()
  createNextSticky()
  return { handled: true }
}

export function handleFlowNavigation(
  ctx: KeyboardContext,
  createFlowShape: (
    sourceShape: { x: number; y: number; props: { w: number; h: number } },
    targetStickyType: string,
    direction: 'right' | 'left' | 'down'
  ) => TLShapeId | null
): HandlerResult {
  if (!shouldHandleFlowNavigation(ctx.event, ctx.workshopMode)) {
    return { handled: false }
  }

  const sourceShape = getEditingOrSelectedShape(ctx.editor)
  if (!sourceShape) return { handled: false }

  const flowType = fromStickyType(sourceShape.type)
  if (!flowType) return { handled: false }

  const direction = ctx.event.key === 'ArrowRight' ? 'forward' : 'backward'
  const nextType = getDefaultNext(flowType, direction)
  if (!nextType) return { handled: false }

  ctx.event.preventDefault()
  ctx.event.stopPropagation()

  const editingId = ctx.editor.getEditingShapeId()
  if (editingId && ctx.isInTextInput) {
    saveEditingShapeText(ctx.editor, ctx.target)
  }

  const newId = createFlowShape(
    {
      x: sourceShape.x,
      y: sourceShape.y,
      props: sourceShape.props as { w: number; h: number },
    },
    toStickyType(nextType),
    ctx.event.key === 'ArrowRight' ? 'right' : 'left'
  )

  if (newId) {
    return {
      handled: true,
      newFlowState: {
        lastCreatedId: newId,
        direction,
        sourceType: flowType,
        alternativeIndex: 0,
      },
    }
  }

  return { handled: true }
}

export function handleAlternativeCycle(
  ctx: KeyboardContext,
  swapShapeType: (shapeId: TLShapeId, newStickyType: string) => void
): HandlerResult {
  if (!ctx.flowState) return { handled: false }
  if (!shouldCycleAlternative(ctx.event, ctx.workshopMode, ctx.flowState)) {
    return { handled: false }
  }

  const cycleDir = ctx.event.key === 'ArrowDown' ? 'down' : 'up'
  const result = cycleAlternative(
    ctx.flowState.sourceType,
    ctx.flowState.direction,
    ctx.flowState.alternativeIndex,
    cycleDir
  )

  if (!result) return { handled: false }

  ctx.event.preventDefault()
  ctx.event.stopPropagation()
  saveEditingShapeText(ctx.editor, ctx.target)
  swapShapeType(ctx.flowState.lastCreatedId, toStickyType(result.newType))

  return {
    handled: true,
    newFlowState: { ...ctx.flowState, alternativeIndex: result.newIndex },
  }
}

export function handleBranchCreation(
  ctx: KeyboardContext,
  createFlowShape: (
    sourceShape: { x: number; y: number; props: { w: number; h: number } },
    targetStickyType: string,
    direction: 'right' | 'left' | 'down'
  ) => TLShapeId | null
): HandlerResult {
  if (!isFlowModeActive(ctx.workshopMode)) return { handled: false }
  if (!isUnmodifiedArrowKey(ctx.event, ['ArrowDown'])) return { handled: false }

  const sourceShape = getEditingOrSelectedShape(ctx.editor)
  if (!sourceShape) return { handled: false }

  const flowType = fromStickyType(sourceShape.type)
  if (!flowType || !canCreateBranch(flowType)) return { handled: false }

  ctx.event.preventDefault()
  ctx.event.stopPropagation()
  saveEditingShapeText(ctx.editor, ctx.target)

  const branchType = getBranchType(flowType)
  if (branchType) {
    createFlowShape(
      {
        x: sourceShape.x,
        y: sourceShape.y,
        props: sourceShape.props as { w: number; h: number },
      },
      toStickyType(branchType),
      'down'
    )
  }

  return { handled: true, newFlowState: null }
}

export function handleDuplicateShortcut(
  ctx: KeyboardContext,
  duplicateSelected: () => void
): HandlerResult {
  if (!shouldHandleDuplicateShortcut(ctx.event)) {
    return { handled: false }
  }

  ctx.event.preventDefault()
  duplicateSelected()
  return { handled: true }
}

export function handleShapeCreationShortcut(
  ctx: KeyboardContext,
  createShape: (type: ToolType) => void
): HandlerResult {
  if (!shouldHandleShapeCreationShortcut(ctx.event)) {
    return { handled: false }
  }

  const shapeType = getShapeTypeForKey(ctx.event.key, ctx.workshopMode, ctx.phase)
  if (shapeType) {
    ctx.event.preventDefault()
    ctx.event.stopPropagation()
    createShape(shapeType)
    return { handled: true }
  }

  const tldrawTool = getTldrawToolForKey(ctx.event.key)
  if (tldrawTool) {
    ctx.event.preventDefault()
    ctx.event.stopPropagation()
    ctx.editor.setCurrentTool(tldrawTool)
    return { handled: true }
  }

  return { handled: false }
}
