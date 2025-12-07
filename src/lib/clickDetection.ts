export const CLICK_VS_DRAG_THRESHOLD_PX = 5

export interface Point {
  x: number
  y: number
}

export const calculateDistance = (start: Point, end: Point): number =>
  Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2)

export const isClickNotDrag = (start: Point, end: Point): boolean =>
  calculateDistance(start, end) < CLICK_VS_DRAG_THRESHOLD_PX
