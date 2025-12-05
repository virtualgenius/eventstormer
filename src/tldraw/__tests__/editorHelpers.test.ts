import { describe, it, expect } from 'vitest'
import {
  isFlowModeActive,
  isTextInputElement,
  getTextFromTextInput,
  hasTextChanged,
} from '../editorHelpers'

function mockElement(tagName: string, value?: string): HTMLElement {
  return { tagName, value } as unknown as HTMLElement
}

describe('isFlowModeActive', () => {
  it('returns true for process mode', () => {
    expect(isFlowModeActive('process')).toBe(true)
  })

  it('returns true for design mode', () => {
    expect(isFlowModeActive('design')).toBe(true)
  })

  it('returns false for big-picture mode', () => {
    expect(isFlowModeActive('big-picture')).toBe(false)
  })

  it('returns false for team-flow mode', () => {
    expect(isFlowModeActive('team-flow')).toBe(false)
  })
})

describe('isTextInputElement', () => {
  it('returns true for INPUT element', () => {
    expect(isTextInputElement(mockElement('INPUT'))).toBe(true)
  })

  it('returns true for TEXTAREA element', () => {
    expect(isTextInputElement(mockElement('TEXTAREA'))).toBe(true)
  })

  it('returns false for DIV element', () => {
    expect(isTextInputElement(mockElement('DIV'))).toBe(false)
  })

  it('returns false for BUTTON element', () => {
    expect(isTextInputElement(mockElement('BUTTON'))).toBe(false)
  })
})

describe('getTextFromTextInput', () => {
  it('returns value from input element', () => {
    expect(getTextFromTextInput(mockElement('INPUT', 'test value'))).toBe('test value')
  })

  it('returns value from textarea element', () => {
    expect(getTextFromTextInput(mockElement('TEXTAREA', 'multiline\ntext'))).toBe('multiline\ntext')
  })

  it('returns null for non-input element', () => {
    expect(getTextFromTextInput(mockElement('DIV'))).toBeNull()
  })

  it('returns empty string for empty input', () => {
    expect(getTextFromTextInput(mockElement('INPUT', ''))).toBe('')
  })
})

describe('hasTextChanged', () => {
  it('returns true when text differs', () => {
    expect(hasTextChanged('new text', { text: 'old text' })).toBe(true)
  })

  it('returns false when text is same', () => {
    expect(hasTextChanged('same', { text: 'same' })).toBe(false)
  })

  it('returns true when props.text is undefined', () => {
    expect(hasTextChanged('some text', {})).toBe(true)
  })

  it('returns false when both are empty strings', () => {
    expect(hasTextChanged('', { text: '' })).toBe(false)
  })

  it('returns true when current is empty but props has text', () => {
    expect(hasTextChanged('', { text: 'has text' })).toBe(true)
  })
})
