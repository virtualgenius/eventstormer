import { describe, it, expect } from 'vitest'
import { calculateDistance, isClickNotDrag, CLICK_VS_DRAG_THRESHOLD_PX } from '../clickDetection'

describe('calculateDistance', () => {
  it('returns 0 for same point', () => {
    expect(calculateDistance({ x: 100, y: 100 }, { x: 100, y: 100 })).toBe(0)
  })

  it('calculates horizontal distance', () => {
    expect(calculateDistance({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3)
  })

  it('calculates vertical distance', () => {
    expect(calculateDistance({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(4)
  })

  it('calculates diagonal distance (3-4-5 triangle)', () => {
    expect(calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })

  it('works with negative coordinates', () => {
    expect(calculateDistance({ x: -5, y: -5 }, { x: -2, y: -1 })).toBe(5)
  })
})

describe('isClickNotDrag', () => {
  it('returns true when distance is zero', () => {
    expect(isClickNotDrag({ x: 100, y: 100 }, { x: 100, y: 100 })).toBe(true)
  })

  it('returns true when distance is 1px', () => {
    expect(isClickNotDrag({ x: 100, y: 100 }, { x: 101, y: 100 })).toBe(true)
  })

  it('returns true when distance below threshold (4px)', () => {
    expect(isClickNotDrag({ x: 100, y: 100 }, { x: 104, y: 100 })).toBe(true)
  })

  it('returns false when distance equals threshold (5px)', () => {
    expect(isClickNotDrag({ x: 100, y: 100 }, { x: 105, y: 100 })).toBe(false)
  })

  it('returns false when distance exceeds threshold (10px)', () => {
    expect(isClickNotDrag({ x: 100, y: 100 }, { x: 110, y: 100 })).toBe(false)
  })

  it('threshold is 5px', () => {
    expect(CLICK_VS_DRAG_THRESHOLD_PX).toBe(5)
  })
})
