// Workshop modes
export type WorkshopMode = 'big-picture' | 'process' | 'design' | 'team-flow'

export const WORKSHOP_MODES: { value: WorkshopMode; label: string; description: string }[] = [
  { value: 'process', label: 'Process', description: 'Model a specific process with commands, policies, and read models' },
  { value: 'design', label: 'Design', description: 'Design software components with commands, policies, and read models' },
  { value: 'big-picture', label: 'Big Picture', description: 'Explore the entire business domain timeline with events, actors, and systems' },
  { value: 'team-flow', label: 'Team Flow', description: 'Map team interactions and workflows across the organization' },
]

// Facilitation phases (only used for Big Picture and Team Flow)
export type FacilitationPhase =
  | 'chaotic-exploration'
  | 'enforce-timeline'
  | 'people-and-systems'
  | 'problems-and-opportunities'
  | 'next-steps'

export const ALL_PHASES: FacilitationPhase[] = [
  'chaotic-exploration',
  'enforce-timeline',
  'people-and-systems',
  'problems-and-opportunities',
  'next-steps',
]

// Tool definitions for the palette
export const TOOLS = {
  'event-sticky': {
    label: 'Event',
    color: '#fed7aa',
    description: 'A domain event that happened in the past (orange)',
    modes: ['big-picture', 'process', 'design', 'team-flow'] as WorkshopMode[],
    phases: ['chaotic-exploration', 'enforce-timeline', 'people-and-systems', 'problems-and-opportunities', 'next-steps'] as FacilitationPhase[],
  },
  'hotspot-sticky': {
    label: 'Hotspot',
    color: '#fecaca',
    description: 'A problem, risk, question, or area of uncertainty (red)',
    modes: ['big-picture', 'process', 'design', 'team-flow'] as WorkshopMode[],
    phases: ['chaotic-exploration', 'enforce-timeline', 'people-and-systems', 'problems-and-opportunities', 'next-steps'] as FacilitationPhase[],
  },
  'vertical-line': {
    label: 'Pivotal',
    color: '#cbd5e1',
    description: 'A pivotal event boundary separating process phases',
    modes: ['big-picture', 'process', 'design', 'team-flow'] as WorkshopMode[],
    phases: ['enforce-timeline', 'people-and-systems', 'problems-and-opportunities', 'next-steps'] as FacilitationPhase[],
  },
  'horizontal-lane': {
    label: 'Swimlane',
    color: '#e2e8f0',
    description: 'A horizontal lane to separate parallel processes',
    modes: ['big-picture', 'process', 'design', 'team-flow'] as WorkshopMode[],
    phases: ['enforce-timeline', 'people-and-systems', 'problems-and-opportunities', 'next-steps'] as FacilitationPhase[],
  },
  'theme-area': {
    label: 'Theme',
    color: 'rgba(226,232,240,0.5)',
    description: 'A rectangular area to group related elements by theme',
    modes: ['big-picture', 'process', 'design', 'team-flow'] as WorkshopMode[],
    phases: ALL_PHASES,
  },
  'label': {
    label: 'Label',
    color: 'transparent',
    description: 'A free-form text annotation',
    modes: ['big-picture', 'process', 'design', 'team-flow'] as WorkshopMode[],
    phases: ALL_PHASES,
  },
  'glossary-sticky': {
    label: 'Glossary',
    color: '#1e293b',
    description: 'A term definition for the ubiquitous language',
    modes: ['big-picture', 'process', 'design', 'team-flow'] as WorkshopMode[],
    phases: ['enforce-timeline', 'people-and-systems', 'problems-and-opportunities', 'next-steps'] as FacilitationPhase[],
  },
  'person-sticky': {
    label: 'Person',
    color: '#fef9c3',
    description: 'An actor or persona who triggers or participates in events (yellow)',
    modes: ['big-picture', 'process', 'design', 'team-flow'] as WorkshopMode[],
    phases: ['people-and-systems', 'problems-and-opportunities', 'next-steps'] as FacilitationPhase[],
  },
  'system-sticky': {
    label: 'System',
    color: '#fce7f3',
    description: 'An external system that triggers or receives events (pink)',
    modes: ['big-picture', 'process', 'design', 'team-flow'] as WorkshopMode[],
    phases: ['people-and-systems', 'problems-and-opportunities', 'next-steps'] as FacilitationPhase[],
  },
  'command-sticky': {
    label: 'Command',
    color: '#bfdbfe',
    description: 'An action or intent that triggers an event (blue)',
    modes: ['process', 'design'] as WorkshopMode[],
    phases: ALL_PHASES,
  },
  'policy-sticky': {
    label: 'Policy',
    color: '#c4b5fd',
    description: 'A business rule that reacts to events and triggers commands (purple)',
    modes: ['process', 'design'] as WorkshopMode[],
    phases: ALL_PHASES,
  },
  'aggregate-sticky': {
    label: 'Aggregate',
    color: '#fef9c3',
    description: 'A component or aggregate with coherent behavior, like a state machine (pale yellow)',
    modes: ['design'] as WorkshopMode[],
    phases: ALL_PHASES,
  },
  'readmodel-sticky': {
    label: 'Read Model',
    color: '#bbf7d0',
    description: 'Data that an actor needs to make a decision (green)',
    modes: ['process', 'design'] as WorkshopMode[],
    phases: ALL_PHASES,
  },
  'opportunity-sticky': {
    label: 'Opportunity',
    color: '#bbf7d0',
    description: 'An improvement idea or business opportunity (green)',
    modes: ['big-picture', 'team-flow'] as WorkshopMode[],
    phases: ['problems-and-opportunities', 'next-steps'] as FacilitationPhase[],
  },
} as const

export type ToolType = keyof typeof TOOLS

// Sticky types for Tab-to-create workflow
export const STICKY_TYPES: ToolType[] = [
  'event-sticky',
  'hotspot-sticky',
  'person-sticky',
  'system-sticky',
  'opportunity-sticky',
  'glossary-sticky',
  'command-sticky',
  'policy-sticky',
  'aggregate-sticky',
  'readmodel-sticky',
]

// Shape types that support editing
export const EDITABLE_TYPES: ToolType[] = [
  'event-sticky',
  'hotspot-sticky',
  'person-sticky',
  'system-sticky',
  'opportunity-sticky',
  'glossary-sticky',
  'command-sticky',
  'policy-sticky',
  'aggregate-sticky',
  'readmodel-sticky',
  'theme-area',
  'label',
]

export const BACKGROUND_SHAPE_TYPES = ['vertical-line', 'horizontal-lane', 'theme-area']

export const SHAPE_SHORTCUTS: Record<string, ToolType> = {
  'e': 'event-sticky',
  'h': 'hotspot-sticky',
  'p': 'person-sticky',
  's': 'system-sticky',
  'o': 'opportunity-sticky',
  'g': 'glossary-sticky',
  'c': 'command-sticky',
  'y': 'policy-sticky',
  'a': 'aggregate-sticky',
  'r': 'readmodel-sticky',
  '|': 'vertical-line',
  '-': 'horizontal-lane',
  't': 'theme-area',
  'l': 'label',
}

export const TLDRAW_TOOL_SHORTCUTS: Record<string, string> = {
  'x': 'eraser',
}

export const SHAPE_DIMENSIONS: Record<string, { w: number; h: number }> = {
  'event-sticky': { w: 120, h: 100 },
  'hotspot-sticky': { w: 120, h: 100 },
  'person-sticky': { w: 120, h: 50 },
  'system-sticky': { w: 240, h: 100 },
  'opportunity-sticky': { w: 120, h: 100 },
  'glossary-sticky': { w: 120, h: 100 },
  'command-sticky': { w: 120, h: 100 },
  'policy-sticky': { w: 240, h: 100 },
  'aggregate-sticky': { w: 240, h: 100 },
  'readmodel-sticky': { w: 120, h: 100 },
  'vertical-line': { w: 8, h: 400 },
  'horizontal-lane': { w: 800, h: 8 },
  'theme-area': { w: 400, h: 300 },
  'label': { w: 100, h: 24 },
}

export function usesPhases(mode: WorkshopMode): boolean {
  return mode === 'big-picture' || mode === 'team-flow'
}

export function isToolAvailable(toolType: ToolType, mode: WorkshopMode, phase: FacilitationPhase): boolean {
  const toolConfig = TOOLS[toolType]
  if (!toolConfig.modes.includes(mode)) return false
  if (usesPhases(mode) && !toolConfig.phases.includes(phase)) return false
  return true
}

export function getAvailableTools(mode: WorkshopMode, phase: FacilitationPhase): [ToolType, typeof TOOLS[ToolType]][] {
  return (Object.entries(TOOLS) as [ToolType, typeof TOOLS[ToolType]][]).filter(([type]) =>
    isToolAvailable(type, mode, phase)
  )
}

export function getShapeTypeForKey(key: string, mode: WorkshopMode, phase: FacilitationPhase): ToolType | null {
  const shapeType = SHAPE_SHORTCUTS[key]
  if (!shapeType) return null
  if (!isToolAvailable(shapeType, mode, phase)) return null
  return shapeType
}

export function getTldrawToolForKey(key: string): string | null {
  return TLDRAW_TOOL_SHORTCUTS[key] ?? null
}

export function getShapeDimensions(type: string): { w: number; h: number } {
  return SHAPE_DIMENSIONS[type] ?? { w: 120, h: 100 }
}

export function getDefaultProps(type: ToolType): { w: number; h: number; text?: string; label?: string; name?: string } {
  const dims = getShapeDimensions(type)
  if (type === 'vertical-line' || type === 'horizontal-lane') {
    return { ...dims, label: '' }
  }
  if (type === 'theme-area') {
    return { ...dims, name: '' }
  }
  return { ...dims, text: '' }
}

export function isHalfHeight(type: ToolType): boolean {
  return type === 'person-sticky'
}

export function isDoubleWide(type: ToolType): boolean {
  return type === 'system-sticky' || type === 'policy-sticky' || type === 'aggregate-sticky'
}
