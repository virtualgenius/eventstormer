import { getShapeDimensions } from './workshopConfig'

export const GAP = 20
export const VERTICAL_GAP = 15
export const DUPLICATE_OFFSET = 20

export type FlowDirection = 'right' | 'left' | 'down'

export interface ShapePosition {
  x: number
  y: number
}

export interface ShapeDimensions {
  w: number
  h: number
}

export interface SourceShape {
  x: number
  y: number
  props: ShapeDimensions
}

export function calculateFlowShapePosition(
  sourceShape: SourceShape,
  targetStickyType: string,
  direction: FlowDirection
): ShapePosition {
  const targetDims = getShapeDimensions(targetStickyType)

  let newX = sourceShape.x
  let newY = sourceShape.y

  if (direction === 'right') {
    newX = sourceShape.x + sourceShape.props.w + GAP
  } else if (direction === 'left') {
    newX = sourceShape.x - targetDims.w - GAP
  } else if (direction === 'down') {
    newY = sourceShape.y + sourceShape.props.h + VERTICAL_GAP
  }

  return { x: newX, y: newY }
}

export function calculateCenterPosition(
  viewportCenter: ShapePosition,
  shapeDims: ShapeDimensions,
  halfHeight: boolean
): ShapePosition {
  return {
    x: viewportCenter.x - (shapeDims.w / 2),
    y: viewportCenter.y - (halfHeight ? 25 : 50),
  }
}

export function calculateDuplicatePosition(
  shapePosition: ShapePosition
): ShapePosition {
  return {
    x: shapePosition.x + DUPLICATE_OFFSET,
    y: shapePosition.y + DUPLICATE_OFFSET,
  }
}

export function calculateNextStickyPosition(
  sourceShape: SourceShape
): ShapePosition {
  return {
    x: sourceShape.x + sourceShape.props.w + GAP,
    y: sourceShape.y,
  }
}
