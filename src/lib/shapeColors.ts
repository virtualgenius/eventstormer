import { ToolType } from './workshopConfig'

export interface ShapeColorSet {
  fill: string
  border: string
  text: string
}

// Single source of truth for all shape colors
export const SHAPE_COLORS: Record<string, ShapeColorSet> = {
  event: { fill: '#fed7aa', border: '#fdba74', text: '#1e293b' },
  hotspot: { fill: '#fecaca', border: '#fca5a5', text: '#1e293b' },
  person: { fill: '#ffef00', border: '#fde047', text: '#1e293b' },
  system: { fill: '#fce7f3', border: '#fbcfe8', text: '#1e293b' },
  opportunity: { fill: '#bbf7d0', border: '#86efac', text: '#1e293b' },
  glossary: { fill: '#1e293b', border: '#334155', text: '#ffffff' },
  command: { fill: '#bfdbfe', border: '#93c5fd', text: '#1e293b' },
  policy: { fill: '#c4b5fd', border: '#a78bfa', text: '#1e293b' },
  aggregate: { fill: '#fef9c3', border: '#fef08a', text: '#1e293b' },
  readmodel: { fill: '#bbf7d0', border: '#86efac', text: '#1e293b' },
  // Structural elements
  'vertical-line': { fill: '#cbd5e1', border: '#94a3b8', text: '#1e293b' },
  'horizontal-lane': { fill: '#e2e8f0', border: '#cbd5e1', text: '#1e293b' },
  'theme-area': { fill: 'rgba(226,232,240,0.3)', border: '#cbd5e1', text: '#1e293b' },
  label: { fill: 'transparent', border: '#64748b', text: '#64748b' },
}

// Map tool type (e.g., 'event-sticky') to color key (e.g., 'event')
const extractColorKey = (toolType: ToolType): string => {
  if (toolType.endsWith('-sticky')) {
    return toolType.replace('-sticky', '')
  }
  return toolType
}

// Get colors for a tool type, returns null if not found
export const getShapeColors = (toolType: ToolType): ShapeColorSet | null => {
  const colorKey = extractColorKey(toolType)
  return SHAPE_COLORS[colorKey] ?? null
}
