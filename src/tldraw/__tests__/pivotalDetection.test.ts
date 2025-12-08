import { describe, it, expect } from 'vitest'
import { Box } from 'tldraw'
import { doesBoundsOverlap } from '../pivotalDetection'

describe('doesBoundsOverlap', () => {
  const mockBounds = (x: number, w: number): Box => new Box(x, 0, w, 100)

  it('returns true when line is fully inside event bounds', () => {
    const line = mockBounds(50, 10)
    const event = mockBounds(0, 120)
    expect(doesBoundsOverlap(line, event)).toBe(true)
  })

  it('returns true when line overlaps left edge', () => {
    const line = mockBounds(0, 30)
    const event = mockBounds(20, 120)
    expect(doesBoundsOverlap(line, event)).toBe(true)
  })

  it('returns true when line overlaps right edge', () => {
    const line = mockBounds(100, 30)
    const event = mockBounds(0, 120)
    expect(doesBoundsOverlap(line, event)).toBe(true)
  })

  it('returns true when line touches event at exact edge', () => {
    const line = mockBounds(120, 10)
    const event = mockBounds(0, 120)
    expect(doesBoundsOverlap(line, event)).toBe(true)
  })

  it('returns false when line is in gap to left of event', () => {
    const line = mockBounds(0, 10)
    const event = mockBounds(50, 120)
    expect(doesBoundsOverlap(line, event)).toBe(false)
  })

  it('returns false when line is in gap to right of event', () => {
    const line = mockBounds(200, 10)
    const event = mockBounds(0, 120)
    expect(doesBoundsOverlap(line, event)).toBe(false)
  })

  it('returns true when event is fully inside line bounds', () => {
    const line = mockBounds(0, 200)
    const event = mockBounds(50, 50)
    expect(doesBoundsOverlap(line, event)).toBe(true)
  })

  it('handles zero-width line at event left edge', () => {
    const line = mockBounds(0, 0)
    const event = mockBounds(0, 120)
    expect(doesBoundsOverlap(line, event)).toBe(true)
  })

  it('handles zero-width line at event right edge', () => {
    const line = mockBounds(120, 0)
    const event = mockBounds(0, 120)
    expect(doesBoundsOverlap(line, event)).toBe(true)
  })

  it('handles negative x coordinates', () => {
    const line = mockBounds(-100, 50)
    const event = mockBounds(-80, 120)
    expect(doesBoundsOverlap(line, event)).toBe(true)
  })

  it('returns false for adjacent shapes with no overlap', () => {
    const line = mockBounds(0, 10)
    const event = mockBounds(11, 120)
    expect(doesBoundsOverlap(line, event)).toBe(false)
  })
})
