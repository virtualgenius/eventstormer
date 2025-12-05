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

function isValidBranchSourceShape(sourceShape: TLShape | null): boolean {
  if (!sourceShape) return false
  const flowType = fromStickyType(sourceShape.type)
  return flowType !== null && canCreateBranch(flowType)
}

export function shouldCreateBranch(
  e: KeyboardEvent,
  workshopMode: WorkshopMode,
  sourceShape: TLShape | null
): boolean {
  const isValidKey = e.key === 'ArrowDown' && isUnmodifiedArrowKey(e, ['ArrowDown'])
  return isFlowModeActive(workshopMode) && isValidKey && isValidBranchSourceShape(sourceShape)
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

type FlowShapeCreator = (
  sourceShape: { x: number; y: number; props: { w: number; h: number } },
  targetStickyType: string,
  direction: 'right' | 'left' | 'down'
) => TLShapeId | null

interface FlowNavigationParams {
  sourceShape: TLShape
  flowType: FlowElementType
  direction: FlowDirection
  nextType: FlowElementType
}

function getFlowNavigationParams(
  ctx: KeyboardContext
): FlowNavigationParams | null {
  const sourceShape = getEditingOrSelectedShape(ctx.editor)
  if (!sourceShape) return null

  const flowType = fromStickyType(sourceShape.type)
  if (!flowType) return null

  const direction = ctx.event.key === 'ArrowRight' ? 'forward' : 'backward'
  const nextType = getDefaultNext(flowType, direction as FlowDirection)
  if (!nextType) return null

  return { sourceShape, flowType, direction: direction as FlowDirection, nextType }
}

function createFlowStateFromNavigation(
  newId: TLShapeId,
  params: FlowNavigationParams
): FlowState {
  return {
    lastCreatedId: newId,
    direction: params.direction,
    sourceType: params.flowType,
    alternativeIndex: 0,
  }
}

function saveEditingTextIfNeeded(ctx: KeyboardContext): void {
  if (ctx.editor.getEditingShapeId() && ctx.isInTextInput) {
    saveEditingShapeText(ctx.editor, ctx.target)
  }
}

export function handleFlowNavigation(
  ctx: KeyboardContext,
  createFlowShape: FlowShapeCreator
): HandlerResult {
  if (!shouldHandleFlowNavigation(ctx.event, ctx.workshopMode)) return { handled: false }

  const params = getFlowNavigationParams(ctx)
  if (!params) return { handled: false }

  ctx.event.preventDefault()
  ctx.event.stopPropagation()
  saveEditingTextIfNeeded(ctx)

  const layoutDirection = ctx.event.key === 'ArrowRight' ? 'right' : 'left'
  const shapeData = { x: params.sourceShape.x, y: params.sourceShape.y, props: params.sourceShape.props as { w: number; h: number } }
  const newId = createFlowShape(shapeData, toStickyType(params.nextType), layoutDirection)

  return newId
    ? { handled: true, newFlowState: createFlowStateFromNavigation(newId, params) }
    : { handled: true }
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

interface BranchCreationParams {
  sourceShape: TLShape
  flowType: FlowElementType
  branchType: FlowElementType
}

function getBranchCreationParams(ctx: KeyboardContext): BranchCreationParams | null {
  const sourceShape = getEditingOrSelectedShape(ctx.editor)
  if (!sourceShape) return null

  const flowType = fromStickyType(sourceShape.type)
  if (!flowType || !canCreateBranch(flowType)) return null

  const branchType = getBranchType(flowType)
  if (!branchType) return null

  return { sourceShape, flowType, branchType }
}

export function handleBranchCreation(
  ctx: KeyboardContext,
  createFlowShape: FlowShapeCreator
): HandlerResult {
  if (!isFlowModeActive(ctx.workshopMode) || !isUnmodifiedArrowKey(ctx.event, ['ArrowDown'])) {
    return { handled: false }
  }

  const params = getBranchCreationParams(ctx)
  if (!params) return { handled: false }

  ctx.event.preventDefault()
  ctx.event.stopPropagation()
  saveEditingShapeText(ctx.editor, ctx.target)

  createFlowShape(
    { x: params.sourceShape.x, y: params.sourceShape.y, props: params.sourceShape.props as { w: number; h: number } },
    toStickyType(params.branchType),
    'down'
  )

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
