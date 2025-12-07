import { describe, it, expect } from 'vitest'
import { getShapeColors, SHAPE_COLORS } from '../shapeColors'

describe('SHAPE_COLORS', () => {
  it('contains colors for event sticky', () => {
    expect(SHAPE_COLORS.event).toEqual({
      fill: '#fed7aa',
      border: '#fdba74',
      text: '#1e293b',
    })
  })

  it('contains colors for all sticky types', () => {
    const expectedTypes = [
      'event',
      'hotspot',
      'person',
      'system',
      'opportunity',
      'glossary',
      'command',
      'policy',
      'aggregate',
      'readmodel',
    ]
    expectedTypes.forEach(type => {
      expect(SHAPE_COLORS[type]).toBeDefined()
      expect(SHAPE_COLORS[type].fill).toBeDefined()
      expect(SHAPE_COLORS[type].border).toBeDefined()
      expect(SHAPE_COLORS[type].text).toBeDefined()
    })
  })

  it('glossary has white text for contrast', () => {
    expect(SHAPE_COLORS.glossary.text).toBe('#ffffff')
  })
})

describe('getShapeColors', () => {
  it('returns colors for event-sticky tool type', () => {
    const colors = getShapeColors('event-sticky')
    expect(colors).toEqual({
      fill: '#fed7aa',
      border: '#fdba74',
      text: '#1e293b',
    })
  })

  it('returns colors for hotspot-sticky tool type', () => {
    const colors = getShapeColors('hotspot-sticky')
    expect(colors).toEqual({
      fill: '#fecaca',
      border: '#fca5a5',
      text: '#1e293b',
    })
  })

  it('returns null for unknown tool type', () => {
    const colors = getShapeColors('unknown-tool' as never)
    expect(colors).toBeNull()
  })

  it('returns colors for structural tools', () => {
    expect(getShapeColors('vertical-line')).toBeDefined()
    expect(getShapeColors('horizontal-lane')).toBeDefined()
    expect(getShapeColors('theme-area')).toBeDefined()
    expect(getShapeColors('label')).toBeDefined()
  })
})
