import { describe, it, expect } from 'vitest'
import {
  GAP,
  VERTICAL_GAP,
  DUPLICATE_OFFSET,
  calculateFlowShapePosition,
  calculateCenterPosition,
  calculateDuplicatePosition,
  calculateNextStickyPosition,
  SourceShape,
} from '../shapeLayout'

describe('shapeLayout constants', () => {
  it('has correct GAP value', () => {
    expect(GAP).toBe(20)
  })

  it('has correct VERTICAL_GAP value', () => {
    expect(VERTICAL_GAP).toBe(15)
  })

  it('has correct DUPLICATE_OFFSET value', () => {
    expect(DUPLICATE_OFFSET).toBe(20)
  })
})

describe('calculateFlowShapePosition', () => {
  const sourceShape: SourceShape = {
    x: 100,
    y: 200,
    props: { w: 120, h: 100 },
  }

  it('calculates position to the right', () => {
    const result = calculateFlowShapePosition(sourceShape, 'event-sticky', 'right')
    expect(result).toEqual({
      x: 100 + 120 + GAP,
      y: 200,
    })
  })

  it('calculates position to the left', () => {
    const result = calculateFlowShapePosition(sourceShape, 'event-sticky', 'left')
    expect(result).toEqual({
      x: 100 - 120 - GAP,
      y: 200,
    })
  })

  it('calculates position to the left for wide shape', () => {
    const result = calculateFlowShapePosition(sourceShape, 'system-sticky', 'left')
    expect(result).toEqual({
      x: 100 - 240 - GAP,
      y: 200,
    })
  })

  it('calculates position down', () => {
    const result = calculateFlowShapePosition(sourceShape, 'event-sticky', 'down')
    expect(result).toEqual({
      x: 100,
      y: 200 + 100 + VERTICAL_GAP,
    })
  })
})

describe('calculateCenterPosition', () => {
  const viewportCenter = { x: 500, y: 400 }
  const shapeDims = { w: 120, h: 100 }

  it('calculates centered position for full-height shape', () => {
    const result = calculateCenterPosition(viewportCenter, shapeDims, false)
    expect(result).toEqual({
      x: 500 - 60,
      y: 400 - 50,
    })
  })

  it('calculates centered position for half-height shape', () => {
    const result = calculateCenterPosition(viewportCenter, shapeDims, true)
    expect(result).toEqual({
      x: 500 - 60,
      y: 400 - 25,
    })
  })

  it('handles wide shapes', () => {
    const wideDims = { w: 240, h: 100 }
    const result = calculateCenterPosition(viewportCenter, wideDims, false)
    expect(result).toEqual({
      x: 500 - 120,
      y: 400 - 50,
    })
  })
})

describe('calculateDuplicatePosition', () => {
  it('offsets position by DUPLICATE_OFFSET', () => {
    const result = calculateDuplicatePosition({ x: 100, y: 200 })
    expect(result).toEqual({
      x: 100 + DUPLICATE_OFFSET,
      y: 200 + DUPLICATE_OFFSET,
    })
  })

  it('works with negative coordinates', () => {
    const result = calculateDuplicatePosition({ x: -50, y: -100 })
    expect(result).toEqual({
      x: -50 + DUPLICATE_OFFSET,
      y: -100 + DUPLICATE_OFFSET,
    })
  })
})

describe('calculateNextStickyPosition', () => {
  it('positions to the right with GAP', () => {
    const sourceShape: SourceShape = {
      x: 100,
      y: 200,
      props: { w: 120, h: 100 },
    }
    const result = calculateNextStickyPosition(sourceShape)
    expect(result).toEqual({
      x: 100 + 120 + GAP,
      y: 200,
    })
  })

  it('maintains y position', () => {
    const sourceShape: SourceShape = {
      x: 0,
      y: 500,
      props: { w: 240, h: 50 },
    }
    const result = calculateNextStickyPosition(sourceShape)
    expect(result).toEqual({
      x: 240 + GAP,
      y: 500,
    })
  })
})
