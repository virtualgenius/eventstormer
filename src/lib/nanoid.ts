const BASE_36_RADIX = 36
const NANOID_START_INDEX = 2
const NANOID_END_INDEX = 10

export const nanoid = () =>
  Math.random().toString(BASE_36_RADIX).substring(NANOID_START_INDEX, NANOID_END_INDEX)
