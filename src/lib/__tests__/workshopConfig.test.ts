import { describe, it, expect } from 'vitest'
import {
  usesPhases,
  isToolAvailable,
  getAvailableTools,
  getShapeTypeForKey,
  getTldrawToolForKey,
  getShapeDimensions,
  getDefaultProps,
  isHalfHeight,
  isDoubleWide,
  TOOLS,
  SHAPE_SHORTCUTS,
  STICKY_TYPES,
  EDITABLE_TYPES,
  BACKGROUND_SHAPE_TYPES,
} from '../workshopConfig'

describe('workshopConfig', () => {
  describe('usesPhases', () => {
    it('returns true for big-picture mode', () => {
      expect(usesPhases('big-picture')).toBe(true)
    })

    it('returns true for team-flow mode', () => {
      expect(usesPhases('team-flow')).toBe(true)
    })

    it('returns false for process mode', () => {
      expect(usesPhases('process')).toBe(false)
    })

    it('returns false for design mode', () => {
      expect(usesPhases('design')).toBe(false)
    })
  })

  describe('isToolAvailable', () => {
    describe('mode filtering', () => {
      it('event-sticky is available in all modes', () => {
        expect(isToolAvailable('event-sticky', 'big-picture', 'chaotic-exploration')).toBe(true)
        expect(isToolAvailable('event-sticky', 'process', 'chaotic-exploration')).toBe(true)
        expect(isToolAvailable('event-sticky', 'design', 'chaotic-exploration')).toBe(true)
        expect(isToolAvailable('event-sticky', 'team-flow', 'chaotic-exploration')).toBe(true)
      })

      it('command-sticky is only available in process and design modes', () => {
        expect(isToolAvailable('command-sticky', 'process', 'chaotic-exploration')).toBe(true)
        expect(isToolAvailable('command-sticky', 'design', 'chaotic-exploration')).toBe(true)
        expect(isToolAvailable('command-sticky', 'big-picture', 'chaotic-exploration')).toBe(false)
        expect(isToolAvailable('command-sticky', 'team-flow', 'chaotic-exploration')).toBe(false)
      })

      it('aggregate-sticky is only available in design mode', () => {
        expect(isToolAvailable('aggregate-sticky', 'design', 'chaotic-exploration')).toBe(true)
        expect(isToolAvailable('aggregate-sticky', 'process', 'chaotic-exploration')).toBe(false)
        expect(isToolAvailable('aggregate-sticky', 'big-picture', 'chaotic-exploration')).toBe(false)
      })

      it('opportunity-sticky is only available in big-picture and team-flow modes', () => {
        expect(isToolAvailable('opportunity-sticky', 'big-picture', 'problems-and-opportunities')).toBe(true)
        expect(isToolAvailable('opportunity-sticky', 'team-flow', 'problems-and-opportunities')).toBe(true)
        expect(isToolAvailable('opportunity-sticky', 'process', 'problems-and-opportunities')).toBe(false)
        expect(isToolAvailable('opportunity-sticky', 'design', 'problems-and-opportunities')).toBe(false)
      })
    })

    describe('phase filtering (only for big-picture and team-flow)', () => {
      it('person-sticky requires people-and-systems phase or later in big-picture', () => {
        expect(isToolAvailable('person-sticky', 'big-picture', 'chaotic-exploration')).toBe(false)
        expect(isToolAvailable('person-sticky', 'big-picture', 'enforce-timeline')).toBe(false)
        expect(isToolAvailable('person-sticky', 'big-picture', 'people-and-systems')).toBe(true)
        expect(isToolAvailable('person-sticky', 'big-picture', 'problems-and-opportunities')).toBe(true)
      })

      it('person-sticky is always available in process mode (no phase filtering)', () => {
        expect(isToolAvailable('person-sticky', 'process', 'chaotic-exploration')).toBe(true)
      })

      it('vertical-line requires enforce-timeline phase or later in big-picture', () => {
        expect(isToolAvailable('vertical-line', 'big-picture', 'chaotic-exploration')).toBe(false)
        expect(isToolAvailable('vertical-line', 'big-picture', 'enforce-timeline')).toBe(true)
      })

      it('opportunity-sticky requires problems-and-opportunities phase or later', () => {
        expect(isToolAvailable('opportunity-sticky', 'big-picture', 'people-and-systems')).toBe(false)
        expect(isToolAvailable('opportunity-sticky', 'big-picture', 'problems-and-opportunities')).toBe(true)
        expect(isToolAvailable('opportunity-sticky', 'big-picture', 'next-steps')).toBe(true)
      })
    })
  })

  describe('getAvailableTools', () => {
    it('returns only event and hotspot in chaotic-exploration phase', () => {
      const tools = getAvailableTools('big-picture', 'chaotic-exploration')
      const toolTypes = tools.map(([type]) => type)

      expect(toolTypes).toContain('event-sticky')
      expect(toolTypes).toContain('hotspot-sticky')
      expect(toolTypes).toContain('theme-area')
      expect(toolTypes).toContain('label')
      expect(toolTypes).not.toContain('vertical-line')
      expect(toolTypes).not.toContain('person-sticky')
    })

    it('returns more tools in later phases', () => {
      const earlyTools = getAvailableTools('big-picture', 'chaotic-exploration')
      const laterTools = getAvailableTools('big-picture', 'people-and-systems')

      expect(laterTools.length).toBeGreaterThan(earlyTools.length)
    })

    it('returns command-sticky in process mode', () => {
      const tools = getAvailableTools('process', 'chaotic-exploration')
      const toolTypes = tools.map(([type]) => type)

      expect(toolTypes).toContain('command-sticky')
      expect(toolTypes).toContain('policy-sticky')
      expect(toolTypes).toContain('readmodel-sticky')
    })
  })

  describe('getShapeTypeForKey', () => {
    it('returns event-sticky for "e" key in big-picture mode', () => {
      expect(getShapeTypeForKey('e', 'big-picture', 'chaotic-exploration')).toBe('event-sticky')
    })

    it('returns null for "c" key in big-picture mode (command not available)', () => {
      expect(getShapeTypeForKey('c', 'big-picture', 'chaotic-exploration')).toBeNull()
    })

    it('returns command-sticky for "c" key in process mode', () => {
      expect(getShapeTypeForKey('c', 'process', 'chaotic-exploration')).toBe('command-sticky')
    })

    it('returns null for person-sticky in early phase', () => {
      expect(getShapeTypeForKey('p', 'big-picture', 'chaotic-exploration')).toBeNull()
    })

    it('returns person-sticky in later phase', () => {
      expect(getShapeTypeForKey('p', 'big-picture', 'people-and-systems')).toBe('person-sticky')
    })

    it('returns null for unknown key', () => {
      expect(getShapeTypeForKey('z', 'big-picture', 'chaotic-exploration')).toBeNull()
    })
  })

  describe('getTldrawToolForKey', () => {
    it('returns eraser for "x" key', () => {
      expect(getTldrawToolForKey('x')).toBe('eraser')
    })

    it('returns null for unknown key', () => {
      expect(getTldrawToolForKey('z')).toBeNull()
    })
  })

  describe('getShapeDimensions', () => {
    it('returns correct dimensions for event-sticky', () => {
      expect(getShapeDimensions('event-sticky')).toEqual({ w: 120, h: 100 })
    })

    it('returns correct dimensions for person-sticky (half height)', () => {
      expect(getShapeDimensions('person-sticky')).toEqual({ w: 120, h: 50 })
    })

    it('returns correct dimensions for system-sticky (double wide)', () => {
      expect(getShapeDimensions('system-sticky')).toEqual({ w: 240, h: 100 })
    })

    it('returns correct dimensions for vertical-line', () => {
      expect(getShapeDimensions('vertical-line')).toEqual({ w: 8, h: 400 })
    })

    it('returns default dimensions for unknown type', () => {
      expect(getShapeDimensions('unknown-type')).toEqual({ w: 120, h: 100 })
    })
  })

  describe('getDefaultProps', () => {
    it('returns text prop for sticky types', () => {
      const props = getDefaultProps('event-sticky')
      expect(props).toHaveProperty('text', '')
      expect(props).toHaveProperty('w', 120)
      expect(props).toHaveProperty('h', 100)
    })

    it('returns label prop for vertical-line', () => {
      const props = getDefaultProps('vertical-line')
      expect(props).toHaveProperty('label', '')
      expect(props).not.toHaveProperty('text')
    })

    it('returns label prop for horizontal-lane', () => {
      const props = getDefaultProps('horizontal-lane')
      expect(props).toHaveProperty('label', '')
    })

    it('returns name prop for theme-area', () => {
      const props = getDefaultProps('theme-area')
      expect(props).toHaveProperty('name', '')
      expect(props).not.toHaveProperty('text')
    })
  })

  describe('isHalfHeight', () => {
    it('returns true for person-sticky', () => {
      expect(isHalfHeight('person-sticky')).toBe(true)
    })

    it('returns false for event-sticky', () => {
      expect(isHalfHeight('event-sticky')).toBe(false)
    })
  })

  describe('isDoubleWide', () => {
    it('returns true for system-sticky', () => {
      expect(isDoubleWide('system-sticky')).toBe(true)
    })

    it('returns true for policy-sticky', () => {
      expect(isDoubleWide('policy-sticky')).toBe(true)
    })

    it('returns true for aggregate-sticky', () => {
      expect(isDoubleWide('aggregate-sticky')).toBe(true)
    })

    it('returns false for event-sticky', () => {
      expect(isDoubleWide('event-sticky')).toBe(false)
    })
  })

  describe('constants', () => {
    it('TOOLS has all expected tool types', () => {
      const toolTypes = Object.keys(TOOLS)
      expect(toolTypes).toContain('event-sticky')
      expect(toolTypes).toContain('command-sticky')
      expect(toolTypes).toContain('vertical-line')
      expect(toolTypes).toContain('theme-area')
    })

    it('SHAPE_SHORTCUTS maps keys to tool types', () => {
      expect(SHAPE_SHORTCUTS['e']).toBe('event-sticky')
      expect(SHAPE_SHORTCUTS['c']).toBe('command-sticky')
      expect(SHAPE_SHORTCUTS['|']).toBe('vertical-line')
    })

    it('STICKY_TYPES contains only sticky types', () => {
      expect(STICKY_TYPES).toContain('event-sticky')
      expect(STICKY_TYPES).not.toContain('vertical-line')
      expect(STICKY_TYPES).not.toContain('theme-area')
    })

    it('EDITABLE_TYPES includes stickies plus theme-area and label', () => {
      expect(EDITABLE_TYPES).toContain('event-sticky')
      expect(EDITABLE_TYPES).toContain('theme-area')
      expect(EDITABLE_TYPES).toContain('label')
      expect(EDITABLE_TYPES).not.toContain('vertical-line')
    })

    it('BACKGROUND_SHAPE_TYPES contains correct types', () => {
      expect(BACKGROUND_SHAPE_TYPES).toContain('vertical-line')
      expect(BACKGROUND_SHAPE_TYPES).toContain('horizontal-lane')
      expect(BACKGROUND_SHAPE_TYPES).toContain('theme-area')
      expect(BACKGROUND_SHAPE_TYPES).not.toContain('event-sticky')
    })
  })
})
