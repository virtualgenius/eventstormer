import type { WorkshopMode } from '@/lib/workshopConfig'
import type { Editor, TLShape, TLShapeId } from 'tldraw'
import { createShapeId } from 'tldraw'
import type { ShapeToCreate, TldrawShapeRecord } from './boardFormat'

export const ZOOM_TO_FIT_ANIMATION_DURATION_MS = 200
export const MAX_SHAPES_PER_PAGE = 10000

export function isFlowModeActive(mode: WorkshopMode): boolean {
  return mode === 'process' || mode === 'design'
}

export function isTextInputElement(element: HTMLElement): boolean {
  return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA'
}

export function getTextFromTextInput(element: HTMLElement): string | null {
  if (!isTextInputElement(element)) return null
  return (element as HTMLTextAreaElement | HTMLInputElement).value
}

export function hasTextChanged(currentText: string, props: { text?: string }): boolean {
  return currentText !== props.text
}

export function isUnmodifiedArrowKey(e: KeyboardEvent, keys: string[]): boolean {
  return keys.includes(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey
}

const CONNECTION_STATUS_TEXT: Record<string, string> = {
  online: 'Connected',
  offline: 'Offline',
  loading: 'Connecting...',
  'not-synced': 'Syncing...',
}

export function getConnectionStatusText(status: string): string {
  return CONNECTION_STATUS_TEXT[status] ?? 'Loading...'
}

const CONNECTION_STATUS_COLOR: Record<string, string> = {
  online: 'bg-green-500',
  offline: 'bg-red-500',
  loading: 'bg-yellow-500',
}

export function getConnectionStatusColor(status: string): string {
  return CONNECTION_STATUS_COLOR[status] ?? 'bg-slate-400'
}

export function getEditingOrSelectedShape(editor: Editor): TLShape | null {
  const editingId = editor.getEditingShapeId()
  if (editingId) {
    const shape = editor.getShape(editingId)
    if (shape) return shape
  }

  const selectedShapes = editor.getSelectedShapes()
  if (selectedShapes.length === 1) {
    return selectedShapes[0]
  }

  return null
}

export function selectAndStartEditing(editor: Editor, shapeId: TLShapeId): void {
  editor.select(shapeId)
  const startEditingAfterSelection = () => editor.setEditingShape(shapeId)
  requestAnimationFrame(startEditingAfterSelection)
}

export function downloadAsJsonFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function saveEditingShapeText(
  editor: Editor,
  activeElement: HTMLElement
): void {
  if (!isTextInputElement(activeElement)) return

  const editingId = editor.getEditingShapeId()
  if (!editingId) return

  const editingShape = editor.getShape(editingId)
  if (!editingShape) return

  const currentText = getTextFromTextInput(activeElement)
  const currentProps = editingShape.props as { text?: string }

  if (currentText !== null && hasTextChanged(currentText, currentProps)) {
    editor.updateShape({
      id: editingId,
      type: editingShape.type,
      props: { text: currentText },
    })
  }

  editor.setEditingShape(null)
}

export interface ImportOptions {
  zoomToFit?: boolean
}

export function importEventStormerShapes(
  editor: Editor,
  shapes: ShapeToCreate[],
  options: ImportOptions = {}
): void {
  if (shapes.length === 0) return

  editor.createShapes(shapes.map(shape => ({
    id: createShapeId(),
    type: shape.type,
    x: shape.x,
    y: shape.y,
    props: shape.props,
  })))

  if (options.zoomToFit) {
    editor.zoomToFit({ animation: { duration: ZOOM_TO_FIT_ANIMATION_DURATION_MS } })
  }
}

export function importTldrawShapes(
  editor: Editor,
  shapes: TldrawShapeRecord[]
): void {
  if (shapes.length === 0) return

  // Type assertions needed due to tldraw's branded types
  editor.createShapes(shapes.map(record => ({
    id: record.id,
    type: record.type,
    x: record.x,
    y: record.y,
    rotation: record.rotation,
    props: record.props,
    parentId: record.parentId,
    index: record.index,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any)
}
