/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { applyPlacementCursor } from '../usePlacementCursor'

describe('applyPlacementCursor', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.className = 'tl-container'
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container)
    }
  })

  it('applies custom cursor when activeTool is a sticky type', () => {
    applyPlacementCursor('event-sticky')

    expect(container.style.cursor).toContain('url(data:image/svg+xml,')
  })

  it('resets cursor when activeTool is null', () => {
    container.style.cursor = 'pointer'

    applyPlacementCursor(null)

    expect(container.style.cursor).toBe('')
  })

  it('does not crash when container is not found', () => {
    document.body.removeChild(container)
    container = null as unknown as HTMLElement // Prevent afterEach from trying to remove again

    expect(() => applyPlacementCursor('event-sticky')).not.toThrow()
  })

  it('applies custom cursor for non-sticky tool types like vertical-line', () => {
    applyPlacementCursor('vertical-line')

    expect(container.style.cursor).toContain('url(data:image/svg+xml,')
  })
})
