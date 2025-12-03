// EventStormer Board Format - official import/export format
export type StickyKind = 'event' | 'hotspot' | 'person' | 'system' | 'opportunity' | 'glossary' | 'command' | 'policy' | 'readmodel'

export interface BoardSticky {
  id: string
  kind: StickyKind
  text: string
  x: number
  y: number
}

export interface BoardVertical {
  id: string
  x: number
  y1: number
  y2: number
}

export interface BoardLane {
  id: string
  y: number
  x1: number
  x2: number
}

export interface BoardLabel {
  id: string
  text: string
  x: number
  y: number
}

export interface BoardTheme {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
}

export interface EventStormerBoard {
  id?: string
  name?: string
  stickies?: BoardSticky[]
  verticals?: BoardVertical[]
  lanes?: BoardLane[]
  labels?: BoardLabel[]
  themes?: BoardTheme[]
  sessionMode?: string
  phase?: string
  createdAt?: string
  updatedAt?: string
}

// Shape data to create via tldraw editor.createShapes()
export interface ShapeToCreate {
  type: string
  x: number
  y: number
  props: Record<string, unknown>
}

const KIND_TO_TYPE: Record<string, string> = {
  event: 'event-sticky',
  hotspot: 'hotspot-sticky',
  person: 'person-sticky',
  system: 'system-sticky',
  opportunity: 'opportunity-sticky',
  glossary: 'glossary-sticky',
  command: 'command-sticky',
  policy: 'policy-sticky',
  readmodel: 'readmodel-sticky',
}

const HALF_HEIGHT_KINDS = ['person']
const WIDE_KINDS = ['system', 'policy']
const DEFAULT_WIDTH = 120
const WIDE_WIDTH = 240
const FULL_HEIGHT = 100
const HALF_HEIGHT = 50

export function isEventStormerBoardFormat(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return Array.isArray(obj.stickies)
}

export function convertBoardToShapes(data: EventStormerBoard): ShapeToCreate[] {
  const shapes: ShapeToCreate[] = []

  // Convert stickies
  if (data.stickies) {
    for (const sticky of data.stickies) {
      const type = KIND_TO_TYPE[sticky.kind]
      if (!type) continue

      const isHalfHeight = HALF_HEIGHT_KINDS.includes(sticky.kind)
      const isWide = WIDE_KINDS.includes(sticky.kind)
      shapes.push({
        type,
        x: sticky.x,
        y: sticky.y,
        props: {
          text: sticky.text,
          w: isWide ? WIDE_WIDTH : DEFAULT_WIDTH,
          h: isHalfHeight ? HALF_HEIGHT : FULL_HEIGHT,
        },
      })
    }
  }

  // Convert vertical lines
  if (data.verticals) {
    for (const vertical of data.verticals) {
      shapes.push({
        type: 'vertical-line',
        x: vertical.x,
        y: vertical.y1,
        props: {
          w: 8,
          h: vertical.y2 - vertical.y1,
        },
      })
    }
  }

  // Convert horizontal lanes
  if (data.lanes) {
    for (const lane of data.lanes) {
      shapes.push({
        type: 'horizontal-lane',
        x: lane.x1,
        y: lane.y,
        props: {
          w: lane.x2 - lane.x1,
          h: 8,
        },
      })
    }
  }

  // Convert labels
  if (data.labels) {
    for (const label of data.labels) {
      shapes.push({
        type: 'label',
        x: label.x,
        y: label.y,
        props: {
          text: label.text,
        },
      })
    }
  }

  // Convert themes
  if (data.themes) {
    for (const theme of data.themes) {
      shapes.push({
        type: 'theme-area',
        x: theme.x,
        y: theme.y,
        props: {
          name: theme.name,
          w: theme.width,
          h: theme.height,
        },
      })
    }
  }

  return shapes
}

// Backwards compatibility aliases
export type LegacySticky = BoardSticky
export type LegacyVertical = BoardVertical
export type LegacyLane = BoardLane
export type LegacyLabel = BoardLabel
export type LegacyTheme = BoardTheme
export type LegacyBoard = EventStormerBoard
export const isLegacyBoardFormat = isEventStormerBoardFormat
export const convertLegacyBoardToShapes = convertBoardToShapes
