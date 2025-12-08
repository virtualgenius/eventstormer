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
  describe('sticky types', () => {
    it('returns cursor CSS for event-sticky', () => {
      const cursor = generatePlacementCursor('event-sticky')
      expect(cursor).toContain('url(data:image/svg+xml,')
      expect(cursor).toContain('crosshair')
    })

    it('returns different cursors for different sticky types', () => {
      const eventCursor = generatePlacementCursor('event-sticky')
      const hotspotCursor = generatePlacementCursor('hotspot-sticky')
      expect(eventCursor).not.toBe(hotspotCursor)
    })

    it('returns cursor with correct color for person-sticky (light yellow)', () => {
      const cursor = generatePlacementCursor('person-sticky')
      expect(cursor).toContain('%23fef9c3') // URL-encoded #fef9c3
    })
  })

  describe('non-sticky tools', () => {
    it('returns cursor for vertical-line', () => {
      const cursor = generatePlacementCursor('vertical-line')
      expect(cursor).toContain('url(data:image/svg+xml,')
      expect(cursor).toContain('crosshair')
    })

    it('returns cursor for horizontal-lane', () => {
      const cursor = generatePlacementCursor('horizontal-lane')
      expect(cursor).toContain('url(data:image/svg+xml,')
    })

    it('returns cursor for theme-area', () => {
      const cursor = generatePlacementCursor('theme-area')
      expect(cursor).toContain('url(data:image/svg+xml,')
    })

    it('returns cursor for label', () => {
      const cursor = generatePlacementCursor('label')
      expect(cursor).toContain('url(data:image/svg+xml,')
    })
  })

  describe('cursor shape variations', () => {
    it('person-sticky uses half-height shape', () => {
      const cursor = generatePlacementCursor('person-sticky')
      // Half-height has y="7" and height="10"
      expect(cursor).toContain('y%3D%227%22') // URL-encoded y="7"
    })

    it('system-sticky uses wide shape', () => {
      const cursor = generatePlacementCursor('system-sticky')
      // Wide has width="22"
      expect(cursor).toContain('width%3D%2222%22') // URL-encoded width="22"
    })

    it('event-sticky uses standard square shape', () => {
      const cursor = generatePlacementCursor('event-sticky')
      // Standard has width="20" height="20"
      expect(cursor).toContain('width%3D%2220%22')
      expect(cursor).toContain('height%3D%2220%22')
    })

    it('hotspot-sticky uses speech bubble shape with rotation', () => {
      const cursor = generatePlacementCursor('hotspot-sticky')
      // Should contain path element (not rect)
      expect(cursor).toContain('path')
      // Should NOT contain rect element
      expect(cursor).not.toContain('%3Crect') // URL-encoded <rect
      // Should have white fill
      expect(cursor).toContain('%23ffffff') // URL-encoded #ffffff
      // Should have dark red stroke
      expect(cursor).toContain('%23b91c1c') // URL-encoded #b91c1c
      // Should have rotation transform
      expect(cursor).toContain('rotate')
    })
  })
})
