import type { WorkshopMode } from '@/lib/workshopConfig'
import type { Editor, TLShape, TLShapeId } from 'tldraw'

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
  requestAnimationFrame(() => editor.setEditingShape(shapeId))
}
