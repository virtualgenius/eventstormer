import { ToolType } from './workshopConfig'

const CURSOR_SIZE_PX = 24
const CURSOR_HOTSPOT_CENTER_PX = 12

// Shape colors matching StickyShapes.tsx (source of truth for rendered shapes)
const SHAPE_COLORS: Record<string, { fill: string; border: string }> = {
  'event-sticky': { fill: '#fed7aa', border: '#fdba74' },
  'hotspot-sticky': { fill: '#fecaca', border: '#fca5a5' },
  'person-sticky': { fill: '#ffef00', border: '#fde047' },
  'system-sticky': { fill: '#fce7f3', border: '#fbcfe8' },
  'opportunity-sticky': { fill: '#bbf7d0', border: '#86efac' },
  'glossary-sticky': { fill: '#1e293b', border: '#334155' },
  'command-sticky': { fill: '#bfdbfe', border: '#93c5fd' },
  'policy-sticky': { fill: '#c4b5fd', border: '#a78bfa' },
  'aggregate-sticky': { fill: '#fef9c3', border: '#fef08a' },
  'readmodel-sticky': { fill: '#bbf7d0', border: '#86efac' },
  'vertical-line': { fill: '#cbd5e1', border: '#94a3b8' },
  'horizontal-lane': { fill: '#e2e8f0', border: '#cbd5e1' },
  'theme-area': { fill: 'rgba(226,232,240,0.3)', border: '#cbd5e1' },
  'label': { fill: 'transparent', border: '#64748b' },
}

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

export const buildCursorCssValue = (dataUri: string): string =>
  `url(${dataUri}) ${CURSOR_HOTSPOT_CENTER_PX} ${CURSOR_HOTSPOT_CENTER_PX}, crosshair`

type SvgGenerator = (fill: string, border: string) => string

// Map tool types to their SVG generators
const SVG_GENERATORS: Record<string, SvgGenerator> = {
  'vertical-line': (_fill, border) => generateVerticalLinePreviewSvg(border),
  'horizontal-lane': (_fill, border) => generateHorizontalLanePreviewSvg(border),
  'theme-area': (_fill, border) => generateThemeAreaPreviewSvg(border),
  'label': (_fill, border) => generateLabelPreviewSvg(border),
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
  const colors = SHAPE_COLORS[toolType]
  if (!colors) return null

  const svg = getSvgForTool(toolType, colors.fill, colors.border)
  const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`
  return buildCursorCssValue(dataUri)
}
