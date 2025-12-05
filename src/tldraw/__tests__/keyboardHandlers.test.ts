import { describe, it, expect } from 'vitest'
import {
  shouldHandleTabNavigation,
  shouldHandleFlowNavigation,
  shouldCycleAlternative,
  shouldCreateBranch,
  shouldHandleDuplicateShortcut,
  shouldHandleShapeCreationShortcut,
  FlowState,
} from '../keyboardHandlers'
import type { TLShape, TLShapeId, TLPageId, IndexKey } from 'tldraw'

function createKeyboardEvent(
  key: string,
  options: Partial<KeyboardEvent> = {}
): KeyboardEvent {
  return {
    key,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    ...options,
  } as KeyboardEvent
}

describe('shouldHandleTabNavigation', () => {
  it('returns true for Tab without shift', () => {
    const e = createKeyboardEvent('Tab')
    expect(shouldHandleTabNavigation(e)).toBe(true)
  })

  it('returns false for Tab with shift', () => {
    const e = createKeyboardEvent('Tab', { shiftKey: true })
    expect(shouldHandleTabNavigation(e)).toBe(false)
  })

  it('returns false for other keys', () => {
    const e = createKeyboardEvent('Enter')
    expect(shouldHandleTabNavigation(e)).toBe(false)
  })
})

function createMockShape(type: string): TLShape {
  return {
    id: 'shape:test' as TLShapeId,
    type,
    x: 0,
    y: 0,
    rotation: 0,
    isLocked: false,
    opacity: 1,
    props: { w: 200, h: 120, text: '' },
    parentId: 'page:page' as TLPageId,
    index: 'a1' as IndexKey,
    typeName: 'shape',
    meta: {},
  }
}

describe('shouldHandleFlowNavigation', () => {
  it('returns true for ArrowRight in process mode', () => {
    const e = createKeyboardEvent('ArrowRight')
    expect(shouldHandleFlowNavigation(e, 'process')).toBe(true)
  })

  it('returns true for ArrowLeft in design mode', () => {
    const e = createKeyboardEvent('ArrowLeft')
    expect(shouldHandleFlowNavigation(e, 'design')).toBe(true)
  })

  it('returns false for arrow keys in big-picture mode', () => {
    const e = createKeyboardEvent('ArrowRight')
    expect(shouldHandleFlowNavigation(e, 'big-picture')).toBe(false)
  })

  it('returns false for arrow keys with modifiers', () => {
    const e = createKeyboardEvent('ArrowRight', { metaKey: true })
    expect(shouldHandleFlowNavigation(e, 'process')).toBe(false)
  })

  it('returns false for up/down arrows', () => {
    const e = createKeyboardEvent('ArrowDown')
    expect(shouldHandleFlowNavigation(e, 'process')).toBe(false)
  })
})

describe('shouldCycleAlternative', () => {
  const mockFlowState: FlowState = {
    lastCreatedId: 'shape:test' as TLShapeId,
    direction: 'forward',
    sourceType: 'command',
    alternativeIndex: 0,
  }

  it('returns true for ArrowDown with flow state in process mode', () => {
    const e = createKeyboardEvent('ArrowDown')
    expect(shouldCycleAlternative(e, 'process', mockFlowState)).toBe(true)
  })

  it('returns true for ArrowUp with flow state in design mode', () => {
    const e = createKeyboardEvent('ArrowUp')
    expect(shouldCycleAlternative(e, 'design', mockFlowState)).toBe(true)
  })

  it('returns false when flowState is null', () => {
    const e = createKeyboardEvent('ArrowDown')
    expect(shouldCycleAlternative(e, 'process', null)).toBe(false)
  })

  it('returns false in non-flow mode', () => {
    const e = createKeyboardEvent('ArrowDown')
    expect(shouldCycleAlternative(e, 'big-picture', mockFlowState)).toBe(false)
  })

  it('returns false for left/right arrows', () => {
    const e = createKeyboardEvent('ArrowRight')
    expect(shouldCycleAlternative(e, 'process', mockFlowState)).toBe(false)
  })
})

describe('shouldCreateBranch', () => {
  it('returns true for ArrowDown on command sticky in process mode', () => {
    const e = createKeyboardEvent('ArrowDown')
    const shape = createMockShape('command-sticky')
    expect(shouldCreateBranch(e, 'process', shape)).toBe(true)
  })

  it('returns false in non-flow mode', () => {
    const e = createKeyboardEvent('ArrowDown')
    const shape = createMockShape('command-sticky')
    expect(shouldCreateBranch(e, 'big-picture', shape)).toBe(false)
  })

  it('returns false for non-branchable types', () => {
    const e = createKeyboardEvent('ArrowDown')
    const shape = createMockShape('event-sticky')
    expect(shouldCreateBranch(e, 'process', shape)).toBe(false)
  })

  it('returns false when shape is null', () => {
    const e = createKeyboardEvent('ArrowDown')
    expect(shouldCreateBranch(e, 'process', null)).toBe(false)
  })

  it('returns false for ArrowUp', () => {
    const e = createKeyboardEvent('ArrowUp')
    const shape = createMockShape('command-sticky')
    expect(shouldCreateBranch(e, 'process', shape)).toBe(false)
  })
})

describe('shouldHandleDuplicateShortcut', () => {
  it('returns true for Cmd+D', () => {
    const e = createKeyboardEvent('d', { metaKey: true })
    expect(shouldHandleDuplicateShortcut(e)).toBe(true)
  })

  it('returns true for Ctrl+D', () => {
    const e = createKeyboardEvent('d', { ctrlKey: true })
    expect(shouldHandleDuplicateShortcut(e)).toBe(true)
  })

  it('returns false for D without modifier', () => {
    const e = createKeyboardEvent('d')
    expect(shouldHandleDuplicateShortcut(e)).toBe(false)
  })

  it('returns false for other keys with Cmd', () => {
    const e = createKeyboardEvent('c', { metaKey: true })
    expect(shouldHandleDuplicateShortcut(e)).toBe(false)
  })
})

describe('shouldHandleShapeCreationShortcut', () => {
  it('returns true for unmodified key press', () => {
    const e = createKeyboardEvent('e')
    expect(shouldHandleShapeCreationShortcut(e)).toBe(true)
  })

  it('returns false with meta key', () => {
    const e = createKeyboardEvent('e', { metaKey: true })
    expect(shouldHandleShapeCreationShortcut(e)).toBe(false)
  })

  it('returns false with ctrl key', () => {
    const e = createKeyboardEvent('e', { ctrlKey: true })
    expect(shouldHandleShapeCreationShortcut(e)).toBe(false)
  })

  it('returns false with alt key', () => {
    const e = createKeyboardEvent('e', { altKey: true })
    expect(shouldHandleShapeCreationShortcut(e)).toBe(false)
  })
})
