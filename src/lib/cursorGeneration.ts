import { ToolType } from './workshopConfig'
import { getShapeColors } from './shapeColors'

const CURSOR_SIZE_PX = 24
const CURSOR_HOTSPOT_CENTER_PX = 12

// Generate SVG for sticky note cursor (square with rounded corners)
export const generateStickyPreviewSvg = (fillColor: string, borderColor: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CURSOR_SIZE_PX}" height="${CURSOR_SIZE_PX}" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" fill="${fillColor}" stroke="${borderColor}" stroke-width="1"/></svg>`

const generateHalfHeightStickyPreviewSvg = (fillColor: string, borderColor: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CURSOR_SIZE_PX}" height="${CURSOR_SIZE_PX}" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2" fill="${fillColor}" stroke="${borderColor}" stroke-width="1"/></svg>`

const generateWideStickyPreviewSvg = (fillColor: string, borderColor: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CURSOR_SIZE_PX}" height="${CURSOR_SIZE_PX}" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" fill="${fillColor}" stroke="${borderColor}" stroke-width="1"/></svg>`

const generateVerticalLinePreviewSvg = (color: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CURSOR_SIZE_PX}" height="${CURSOR_SIZE_PX}" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="22" stroke="${color}" stroke-width="3" stroke-linecap="round"/></svg>`

const generateHorizontalLanePreviewSvg = (color: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CURSOR_SIZE_PX}" height="${CURSOR_SIZE_PX}" viewBox="0 0 24 24"><line x1="2" y1="12" x2="22" y2="12" stroke="${color}" stroke-width="3" stroke-linecap="round"/></svg>`

const generateThemeAreaPreviewSvg = (borderColor: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CURSOR_SIZE_PX}" height="${CURSOR_SIZE_PX}" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="#e2e8f0" fill-opacity="0.3" stroke="${borderColor}" stroke-width="1.5" stroke-dasharray="4 2"/></svg>`

const generateLabelPreviewSvg = (color: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CURSOR_SIZE_PX}" height="${CURSOR_SIZE_PX}" viewBox="0 0 24 24"><text x="12" y="16" font-family="sans-serif" font-size="14" font-weight="bold" fill="${color}" text-anchor="middle">T</text></svg>`

// Speech bubble cursor for hotspot - no rotation (browsers reject rotated SVG cursors that overflow viewBox)
const generateHotspotBubblePreviewSvg = (): string => {
  const path = 'M 4,3 H 20 Q 21,3 21,4 V 14 Q 21,15 20,15 H 10 L 6,19 L 7,15 H 4 Q 3,15 3,14 V 4 Q 3,3 4,3 Z'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CURSOR_SIZE_PX}" height="${CURSOR_SIZE_PX}" viewBox="0 0 24 24"><path d="${path}" fill="#ffffff" stroke="#b91c1c" stroke-width="1.5"/></svg>`
}

export const buildCursorCssValue = (dataUri: string): string =>
  `url(${dataUri}) ${CURSOR_HOTSPOT_CENTER_PX} ${CURSOR_HOTSPOT_CENTER_PX}, crosshair`

type SvgGenerator = (fill: string, border: string) => string

// Map tool types to their SVG generators
const SVG_GENERATORS: Record<string, SvgGenerator> = {
  'vertical-line': (_fill, border) => generateVerticalLinePreviewSvg(border),
  'horizontal-lane': (_fill, border) => generateHorizontalLanePreviewSvg(border),
  'theme-area': (_fill, border) => generateThemeAreaPreviewSvg(border),
  'label': (_fill, border) => generateLabelPreviewSvg(border),
  'hotspot-sticky': () => generateHotspotBubblePreviewSvg(),
  'person-sticky': generateHalfHeightStickyPreviewSvg,
  'system-sticky': generateWideStickyPreviewSvg,
  'policy-sticky': generateWideStickyPreviewSvg,
  'aggregate-sticky': generateWideStickyPreviewSvg,
}

const getSvgForTool = (toolType: ToolType, fill: string, border: string): string => {
  const generator = SVG_GENERATORS[toolType]
  if (generator) return generator(fill, border)
  return generateStickyPreviewSvg(fill, border)
}

export const generatePlacementCursor = (toolType: ToolType): string | null => {
  const colors = getShapeColors(toolType)
  if (!colors) return null

  const svg = getSvgForTool(toolType, colors.fill, colors.border)
  const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`
  return buildCursorCssValue(dataUri)
}
