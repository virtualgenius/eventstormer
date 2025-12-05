import { describe, it, expect } from 'vitest'
import {
  isFlowModeActive,
  isTextInputElement,
  getTextFromTextInput,
  hasTextChanged,
  isUnmodifiedArrowKey,
  getConnectionStatusText,
  getConnectionStatusColor,
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

function mockKeyboardEvent(key: string, modifiers: { meta?: boolean; ctrl?: boolean; alt?: boolean } = {}): KeyboardEvent {
  return {
    key,
    metaKey: modifiers.meta ?? false,
    ctrlKey: modifiers.ctrl ?? false,
    altKey: modifiers.alt ?? false,
  } as KeyboardEvent
}

describe('isUnmodifiedArrowKey', () => {
  it('returns true for matching key without modifiers', () => {
    expect(isUnmodifiedArrowKey(mockKeyboardEvent('ArrowRight'), ['ArrowRight', 'ArrowLeft'])).toBe(true)
  })

  it('returns true for second matching key', () => {
    expect(isUnmodifiedArrowKey(mockKeyboardEvent('ArrowLeft'), ['ArrowRight', 'ArrowLeft'])).toBe(true)
  })

  it('returns false for non-matching key', () => {
    expect(isUnmodifiedArrowKey(mockKeyboardEvent('ArrowUp'), ['ArrowRight', 'ArrowLeft'])).toBe(false)
  })

  it('returns false when meta key is pressed', () => {
    expect(isUnmodifiedArrowKey(mockKeyboardEvent('ArrowRight', { meta: true }), ['ArrowRight'])).toBe(false)
  })

  it('returns false when ctrl key is pressed', () => {
    expect(isUnmodifiedArrowKey(mockKeyboardEvent('ArrowRight', { ctrl: true }), ['ArrowRight'])).toBe(false)
  })

  it('returns false when alt key is pressed', () => {
    expect(isUnmodifiedArrowKey(mockKeyboardEvent('ArrowRight', { alt: true }), ['ArrowRight'])).toBe(false)
  })
})

describe('getConnectionStatusText', () => {
  it('returns Connected for online', () => {
    expect(getConnectionStatusText('online')).toBe('Connected')
  })

  it('returns Offline for offline', () => {
    expect(getConnectionStatusText('offline')).toBe('Offline')
  })

  it('returns Connecting... for loading', () => {
    expect(getConnectionStatusText('loading')).toBe('Connecting...')
  })

  it('returns Syncing... for not-synced', () => {
    expect(getConnectionStatusText('not-synced')).toBe('Syncing...')
  })

  it('returns Loading... for unknown status', () => {
    expect(getConnectionStatusText('unknown')).toBe('Loading...')
  })
})

describe('getConnectionStatusColor', () => {
  it('returns green for online', () => {
    expect(getConnectionStatusColor('online')).toBe('bg-green-500')
  })

  it('returns red for offline', () => {
    expect(getConnectionStatusColor('offline')).toBe('bg-red-500')
  })

  it('returns yellow for loading', () => {
    expect(getConnectionStatusColor('loading')).toBe('bg-yellow-500')
  })

  it('returns slate for unknown status', () => {
    expect(getConnectionStatusColor('unknown')).toBe('bg-slate-400')
  })

  it('returns slate for not-synced', () => {
    expect(getConnectionStatusColor('not-synced')).toBe('bg-slate-400')
  })
})
