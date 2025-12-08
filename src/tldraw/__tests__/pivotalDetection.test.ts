import { describe, it, expect } from 'vitest'
import { doesLineOverlapEvent } from '../pivotalDetection'

describe('doesLineOverlapEvent', () => {
  const mockShape = (x: number, w: number) => ({ x, props: { w } })

  it('returns true when line is fully inside event bounds', () => {
    const line = mockShape(50, 10)
    const event = mockShape(0, 120)
    expect(doesLineOverlapEvent(line, event)).toBe(true)
  })

  it('returns true when line overlaps left edge', () => {
    const line = mockShape(0, 30)
    const event = mockShape(20, 120)
    expect(doesLineOverlapEvent(line, event)).toBe(true)
  })

  it('returns true when line overlaps right edge', () => {
    const line = mockShape(100, 30)
    const event = mockShape(0, 120)
    expect(doesLineOverlapEvent(line, event)).toBe(true)
  })

  it('returns true when line touches event at exact edge', () => {
    const line = mockShape(120, 10)
    const event = mockShape(0, 120)
    expect(doesLineOverlapEvent(line, event)).toBe(true)
  })

  it('returns false when line is in gap to left of event', () => {
    const line = mockShape(0, 10)
    const event = mockShape(50, 120)
    expect(doesLineOverlapEvent(line, event)).toBe(false)
  })

  it('returns false when line is in gap to right of event', () => {
    const line = mockShape(200, 10)
    const event = mockShape(0, 120)
    expect(doesLineOverlapEvent(line, event)).toBe(false)
  })

  it('returns true when event is fully inside line bounds', () => {
    const line = mockShape(0, 200)
    const event = mockShape(50, 50)
    expect(doesLineOverlapEvent(line, event)).toBe(true)
  })

  it('handles zero-width line at event left edge', () => {
    const line = mockShape(0, 0)
    const event = mockShape(0, 120)
    expect(doesLineOverlapEvent(line, event)).toBe(true)
  })

  it('handles zero-width line at event right edge', () => {
    const line = mockShape(120, 0)
    const event = mockShape(0, 120)
    expect(doesLineOverlapEvent(line, event)).toBe(true)
  })

  it('handles negative x coordinates', () => {
    const line = mockShape(-100, 50)
    const event = mockShape(-80, 120)
    expect(doesLineOverlapEvent(line, event)).toBe(true)
  })

  it('returns false for adjacent shapes with no overlap', () => {
    const line = mockShape(0, 10)
    const event = mockShape(11, 120)
    expect(doesLineOverlapEvent(line, event)).toBe(false)
  })
})
