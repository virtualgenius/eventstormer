import { ToolType } from './workshopConfig'

const CURSOR_PREVIEW_SIZE_PX = 24
const CURSOR_HOTSPOT_CENTER_PX = 12

const STICKY_COLORS: Record<string, { fill: string; border: string }> = {
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
}

export const generateStickyPreviewSvg = (fillColor: string, borderColor: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CURSOR_PREVIEW_SIZE_PX}" height="${CURSOR_PREVIEW_SIZE_PX}" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" fill="${fillColor}" stroke="${borderColor}" stroke-width="1"/></svg>`

export const buildCursorCssValue = (dataUri: string): string =>
  `url(${dataUri}) ${CURSOR_HOTSPOT_CENTER_PX} ${CURSOR_HOTSPOT_CENTER_PX}, crosshair`

export const generatePlacementCursor = (toolType: ToolType): string | null => {
  const colors = STICKY_COLORS[toolType]
  if (!colors) return null
  const svg = generateStickyPreviewSvg(colors.fill, colors.border)
  const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`
  return buildCursorCssValue(dataUri)
}
