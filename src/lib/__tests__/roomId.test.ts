import { describe, it, expect } from 'vitest'
import { isValidRoomId } from '../roomId'

describe('isValidRoomId', () => {
  it('rejects empty string', () => {
    expect(isValidRoomId('')).toBe(false)
  })

  it('rejects string longer than 64 characters', () => {
    const tooLong = 'a'.repeat(65)
    expect(isValidRoomId(tooLong)).toBe(false)
  })

  it('rejects special characters', () => {
    expect(isValidRoomId('room!@#$')).toBe(false)
  })

  it('rejects spaces', () => {
    expect(isValidRoomId('room id')).toBe(false)
  })

  it('accepts valid nanoid (21 chars A-Za-z0-9_-)', () => {
    expect(isValidRoomId('V1StGXR8_Z5jdHi6B-myT')).toBe(true)
  })

  it('accepts valid old-style base36 ID (8 chars)', () => {
    expect(isValidRoomId('k5x8z9a2')).toBe(true)
  })

  it('accepts single character', () => {
    expect(isValidRoomId('a')).toBe(true)
  })

  it('accepts exactly 64 characters', () => {
    const maxLength = 'a'.repeat(64)
    expect(isValidRoomId(maxLength)).toBe(true)
  })

  it('accepts hyphens', () => {
    expect(isValidRoomId('room-id-test')).toBe(true)
  })

  it('accepts underscores', () => {
    expect(isValidRoomId('room_id_test')).toBe(true)
  })

  it('rejects dots', () => {
    expect(isValidRoomId('room.id')).toBe(false)
  })

  it('rejects forward slashes', () => {
    expect(isValidRoomId('room/id')).toBe(false)
  })
})
