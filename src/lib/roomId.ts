const ROOM_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/

export function isValidRoomId(id: string): boolean {
  return ROOM_ID_PATTERN.test(id)
}
