// EventStormer Board Format - official import/export format
export type StickyKind = 'event' | 'hotspot' | 'person' | 'system' | 'opportunity' | 'glossary' | 'command' | 'policy' | 'aggregate' | 'readmodel'

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
  aggregate: 'aggregate-sticky',
  readmodel: 'readmodel-sticky',
}

const HALF_HEIGHT_KINDS = ['person']
const WIDE_KINDS = ['system', 'policy', 'aggregate']
const DEFAULT_WIDTH = 120
const WIDE_WIDTH = 240
const FULL_HEIGHT = 100
const HALF_HEIGHT = 50

export function isEventStormerBoardFormat(data: unknown): data is EventStormerBoard {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return Array.isArray(obj.stickies)
}

const LINE_THICKNESS = 8

function convertStickyToShape(sticky: BoardSticky): ShapeToCreate | null {
  const type = KIND_TO_TYPE[sticky.kind]
  if (!type) return null

  const isHalf = HALF_HEIGHT_KINDS.includes(sticky.kind)
  const isWide = WIDE_KINDS.includes(sticky.kind)
  return {
    type,
    x: sticky.x,
    y: sticky.y,
    props: {
      text: sticky.text,
      w: isWide ? WIDE_WIDTH : DEFAULT_WIDTH,
      h: isHalf ? HALF_HEIGHT : FULL_HEIGHT,
    },
  }
}

function convertVerticalToShape(vertical: BoardVertical): ShapeToCreate {
  return {
    type: 'vertical-line',
    x: vertical.x,
    y: vertical.y1,
    props: { w: LINE_THICKNESS, h: vertical.y2 - vertical.y1 },
  }
}

function convertLaneToShape(lane: BoardLane): ShapeToCreate {
  return {
    type: 'horizontal-lane',
    x: lane.x1,
    y: lane.y,
    props: { w: lane.x2 - lane.x1, h: LINE_THICKNESS },
  }
}

function convertLabelToShape(label: BoardLabel): ShapeToCreate {
  return { type: 'label', x: label.x, y: label.y, props: { text: label.text } }
}

function convertThemeToShape(theme: BoardTheme): ShapeToCreate {
  return {
    type: 'theme-area',
    x: theme.x,
    y: theme.y,
    props: { name: theme.name, w: theme.width, h: theme.height },
  }
}

function convertStickies(stickies: BoardSticky[] | undefined): ShapeToCreate[] {
  return (stickies ?? []).map(convertStickyToShape).filter((s): s is ShapeToCreate => s !== null)
}

function convertVerticals(verticals: BoardVertical[] | undefined): ShapeToCreate[] {
  return (verticals ?? []).map(convertVerticalToShape)
}

function convertLanes(lanes: BoardLane[] | undefined): ShapeToCreate[] {
  return (lanes ?? []).map(convertLaneToShape)
}

function convertLabels(labels: BoardLabel[] | undefined): ShapeToCreate[] {
  return (labels ?? []).map(convertLabelToShape)
}

function convertThemes(themes: BoardTheme[] | undefined): ShapeToCreate[] {
  return (themes ?? []).map(convertThemeToShape)
}

export function convertBoardToShapes(data: EventStormerBoard): ShapeToCreate[] {
  return [
    ...convertStickies(data.stickies),
    ...convertVerticals(data.verticals),
    ...convertLanes(data.lanes),
    ...convertLabels(data.labels),
    ...convertThemes(data.themes),
  ]
}

export interface TldrawShapeRecord {
  id: string
  type: string
  typeName: string
  x: number
  y: number
  rotation?: number
  props: Record<string, unknown>
  parentId?: string
  index?: string
}

export interface TldrawSnapshotResult {
  shapes: TldrawShapeRecord[]
  error?: string
}

const EXCLUDED_RECORD_TYPES = ['document', 'page', 'camera', 'instance', 'instance_page_state', 'pointer']

function isValidObject(data: unknown): data is Record<string, unknown> {
  return data !== null && typeof data === 'object'
}

function getStoreFromObj(obj: Record<string, unknown>): Record<string, unknown> | null {
  if (isValidObject(obj.store)) return obj.store
  return null
}

function getStoreFromDocument(obj: Record<string, unknown>): Record<string, unknown> | null {
  if (!isValidObject(obj.document)) return null
  const doc = obj.document
  if (isValidObject(doc.store)) return doc.store
  return null
}

function isDirectStoreFormat(obj: Record<string, unknown>): boolean {
  const firstKey = Object.keys(obj)[0]
  if (!firstKey) return false
  return firstKey.startsWith('shape:') || firstKey.startsWith('page:') || firstKey.startsWith('document:')
}

export function extractStoreFromSnapshot(data: unknown): Record<string, unknown> | null {
  if (!isValidObject(data)) return null
  return getStoreFromObj(data) ?? getStoreFromDocument(data) ?? (isDirectStoreFormat(data) ? data : null)
}

export function filterShapeRecords(store: Record<string, unknown>): TldrawShapeRecord[] {
  return Object.values(store).filter((record): record is TldrawShapeRecord => {
    if (!record || typeof record !== 'object') return false
    const rec = record as Record<string, unknown>
    if (EXCLUDED_RECORD_TYPES.includes(rec.typeName as string)) return false
    return rec.typeName === 'shape'
  })
}

export function parseTldrawSnapshot(data: unknown): TldrawSnapshotResult {
  const store = extractStoreFromSnapshot(data)
  if (!store) {
    return { shapes: [], error: 'Invalid snapshot format: missing store data' }
  }

  const shapes = filterShapeRecords(store)
  return { shapes }
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
