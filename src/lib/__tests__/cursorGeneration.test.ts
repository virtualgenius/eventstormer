import { describe, it, expect } from 'vitest'
import {
  generateStickyPreviewSvg,
  buildCursorCssValue,
  generatePlacementCursor,
} from '../cursorGeneration'

describe('generateStickyPreviewSvg', () => {
  it('generates SVG with correct fill color', () => {
    const svg = generateStickyPreviewSvg('#fed7aa', '#fdba74')
    expect(svg).toContain('fill="#fed7aa"')
  })

  it('generates SVG with correct border color', () => {
    const svg = generateStickyPreviewSvg('#fed7aa', '#fdba74')
    expect(svg).toContain('stroke="#fdba74"')
  })

  it('generates valid SVG element', () => {
    const svg = generateStickyPreviewSvg('#fed7aa', '#fdba74')
    expect(svg).toMatch(/^<svg.*<\/svg>$/)
  })
})

describe('buildCursorCssValue', () => {
  it('builds CSS url() with data URI', () => {
    const css = buildCursorCssValue('data:image/svg+xml,test')
    expect(css).toBe('url(data:image/svg+xml,test) 12 12, crosshair')
  })
})

describe('generatePlacementCursor', () => {
  it('returns cursor CSS for event-sticky', () => {
    const cursor = generatePlacementCursor('event-sticky')
    expect(cursor).toContain('url(data:image/svg+xml,')
    expect(cursor).toContain('crosshair')
  })

  it('returns null for unknown tool type', () => {
    const cursor = generatePlacementCursor('vertical-line')
    expect(cursor).toBeNull()
  })

  it('returns different cursors for different sticky types', () => {
    const eventCursor = generatePlacementCursor('event-sticky')
    const hotspotCursor = generatePlacementCursor('hotspot-sticky')
    expect(eventCursor).not.toBe(hotspotCursor)
  })
})
