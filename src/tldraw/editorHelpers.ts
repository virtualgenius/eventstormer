import type { WorkshopMode } from '@/lib/workshopConfig'

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
