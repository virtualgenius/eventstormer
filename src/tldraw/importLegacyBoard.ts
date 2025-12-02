// Types for the legacy board format (pre-tldraw migration)
export type StickyKind = 'event' | 'hotspot' | 'person' | 'system' | 'opportunity' | 'glossary'

export interface LegacySticky {
  id: string
  kind: StickyKind
  text: string
  x: number
  y: number
}

export interface LegacyVertical {
  id: string
  x: number
  y1: number
  y2: number
}

export interface LegacyLane {
  id: string
  y: number
  x1: number
  x2: number
}

export interface LegacyLabel {
  id: string
  text: string
  x: number
  y: number
}

export interface LegacyTheme {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
}

export interface LegacyBoard {
  stickies?: LegacySticky[]
  verticals?: LegacyVertical[]
  lanes?: LegacyLane[]
  labels?: LegacyLabel[]
  themes?: LegacyTheme[]
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
}

const HALF_HEIGHT_TYPES = ['person', 'system']
const STICKY_WIDTH = 120
const FULL_HEIGHT = 100
const HALF_HEIGHT = 50

export function isLegacyBoardFormat(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return Array.isArray(obj.stickies)
}

export function convertLegacyBoardToShapes(data: LegacyBoard): ShapeToCreate[] {
  const shapes: ShapeToCreate[] = []

  // Convert stickies
  if (data.stickies) {
    for (const sticky of data.stickies) {
      const type = KIND_TO_TYPE[sticky.kind]
      if (!type) continue

      const isHalfHeight = HALF_HEIGHT_TYPES.includes(sticky.kind)
      shapes.push({
        type,
        x: sticky.x,
        y: sticky.y,
        props: {
          text: sticky.text,
          w: STICKY_WIDTH,
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
