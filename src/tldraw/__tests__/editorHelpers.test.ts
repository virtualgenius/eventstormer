import { describe, it, expect, vi } from 'vitest'
import {
  isFlowModeActive,
  isTextInputElement,
  getTextFromTextInput,
  hasTextChanged,
  isUnmodifiedArrowKey,
  getConnectionStatusText,
  getConnectionStatusColor,
  ZOOM_TO_FIT_ANIMATION_DURATION_MS,
  MAX_SHAPES_PER_PAGE,
  downloadAsJsonFile,
  saveEditingShapeText,
  importEventStormerShapes,
  importTldrawShapes,
} from '../editorHelpers'
import type { Editor } from 'tldraw'

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

describe('constants', () => {
  it('ZOOM_TO_FIT_ANIMATION_DURATION_MS is 200', () => {
    expect(ZOOM_TO_FIT_ANIMATION_DURATION_MS).toBe(200)
  })

  it('MAX_SHAPES_PER_PAGE is 10000', () => {
    expect(MAX_SHAPES_PER_PAGE).toBe(10000)
  })
})

describe('downloadAsJsonFile', () => {
  it('is a function that accepts content and filename', () => {
    expect(typeof downloadAsJsonFile).toBe('function')
    expect(downloadAsJsonFile.length).toBe(2)
  })
})

function mockEditor(overrides: Partial<Editor> = {}): Editor {
  return {
    getEditingShapeId: vi.fn().mockReturnValue(null),
    getShape: vi.fn().mockReturnValue(null),
    updateShape: vi.fn(),
    setEditingShape: vi.fn(),
    createShapes: vi.fn(),
    zoomToFit: vi.fn(),
    ...overrides,
  } as unknown as Editor
}

describe('saveEditingShapeText', () => {
  it('does nothing for non-text input elements', () => {
    const editor = mockEditor()
    const element = mockElement('DIV')

    saveEditingShapeText(editor, element)

    expect(editor.getEditingShapeId).not.toHaveBeenCalled()
  })

  it('does nothing when no shape is being edited', () => {
    const editor = mockEditor({ getEditingShapeId: vi.fn().mockReturnValue(null) })
    const element = mockElement('INPUT', 'test')

    saveEditingShapeText(editor, element)

    expect(editor.updateShape).not.toHaveBeenCalled()
  })

  it('does nothing when editing shape not found', () => {
    const editor = mockEditor({
      getEditingShapeId: vi.fn().mockReturnValue('shape:123'),
      getShape: vi.fn().mockReturnValue(null),
    })
    const element = mockElement('INPUT', 'test')

    saveEditingShapeText(editor, element)

    expect(editor.updateShape).not.toHaveBeenCalled()
  })

  it('updates shape when text has changed', () => {
    const mockShape = { id: 'shape:123', type: 'event-sticky', props: { text: 'old text' } }
    const editor = mockEditor({
      getEditingShapeId: vi.fn().mockReturnValue('shape:123'),
      getShape: vi.fn().mockReturnValue(mockShape),
    })
    const element = mockElement('TEXTAREA', 'new text')

    saveEditingShapeText(editor, element)

    expect(editor.updateShape).toHaveBeenCalledWith({
      id: 'shape:123',
      type: 'event-sticky',
      props: { text: 'new text' },
    })
    expect(editor.setEditingShape).toHaveBeenCalledWith(null)
  })

  it('does not update shape when text is unchanged', () => {
    const mockShape = { id: 'shape:123', type: 'event-sticky', props: { text: 'same text' } }
    const editor = mockEditor({
      getEditingShapeId: vi.fn().mockReturnValue('shape:123'),
      getShape: vi.fn().mockReturnValue(mockShape),
    })
    const element = mockElement('INPUT', 'same text')

    saveEditingShapeText(editor, element)

    expect(editor.updateShape).not.toHaveBeenCalled()
    expect(editor.setEditingShape).toHaveBeenCalledWith(null)
  })
})

describe('importEventStormerShapes', () => {
  it('does nothing for empty shapes array', () => {
    const editor = mockEditor()

    importEventStormerShapes(editor, [])

    expect(editor.createShapes).not.toHaveBeenCalled()
  })

  it('creates shapes from EventStormer format', () => {
    const editor = mockEditor()
    const shapes = [
      { type: 'event-sticky', x: 100, y: 200, props: { text: 'Event 1', w: 120, h: 100 } },
      { type: 'hotspot-sticky', x: 300, y: 200, props: { text: 'Hotspot', w: 120, h: 100 } },
    ]

    importEventStormerShapes(editor, shapes)

    expect(editor.createShapes).toHaveBeenCalledTimes(1)
    const createdShapes = (editor.createShapes as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createdShapes).toHaveLength(2)
    expect(createdShapes[0].type).toBe('event-sticky')
    expect(createdShapes[0].x).toBe(100)
    expect(createdShapes[0].y).toBe(200)
    expect(createdShapes[1].type).toBe('hotspot-sticky')
  })

  it('zooms to fit when option is set', () => {
    const editor = mockEditor()
    const shapes = [{ type: 'event-sticky', x: 100, y: 200, props: { text: 'Test', w: 120, h: 100 } }]

    importEventStormerShapes(editor, shapes, { zoomToFit: true })

    expect(editor.zoomToFit).toHaveBeenCalledWith({
      animation: { duration: ZOOM_TO_FIT_ANIMATION_DURATION_MS },
    })
  })

  it('does not zoom when option is false', () => {
    const editor = mockEditor()
    const shapes = [{ type: 'event-sticky', x: 100, y: 200, props: { text: 'Test', w: 120, h: 100 } }]

    importEventStormerShapes(editor, shapes, { zoomToFit: false })

    expect(editor.zoomToFit).not.toHaveBeenCalled()
  })
})

describe('importTldrawShapes', () => {
  it('does nothing for empty shapes array', () => {
    const editor = mockEditor()

    importTldrawShapes(editor, [])

    expect(editor.createShapes).not.toHaveBeenCalled()
  })

  it('creates shapes from tldraw snapshot format', () => {
    const editor = mockEditor()
    const shapes = [
      {
        id: 'shape:abc123',
        type: 'event-sticky',
        typeName: 'shape',
        x: 100,
        y: 200,
        rotation: 0,
        props: { text: 'Event', w: 120, h: 100 },
        parentId: 'page:page1',
        index: 'a1',
      },
    ]

    importTldrawShapes(editor, shapes)

    expect(editor.createShapes).toHaveBeenCalledTimes(1)
    const createdShapes = (editor.createShapes as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createdShapes).toHaveLength(1)
    expect(createdShapes[0].id).toBe('shape:abc123')
    expect(createdShapes[0].type).toBe('event-sticky')
    expect(createdShapes[0].x).toBe(100)
    expect(createdShapes[0].y).toBe(200)
  })
})
