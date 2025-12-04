export type FlowElementType = 'person' | 'command' | 'system' | 'event' | 'policy' | 'readmodel'

export type FlowDirection = 'forward' | 'backward'

const FLOW_FORWARD: Record<FlowElementType, FlowElementType[]> = {
  person: ['command'],
  readmodel: ['person'],
  command: ['system'],
  system: ['event'],
  event: ['policy', 'readmodel', 'event'],
  policy: ['command'],
}

const FLOW_BACKWARD: Record<FlowElementType, FlowElementType[]> = {
  command: ['person', 'policy'],
  system: ['command'],
  event: ['system'],
  policy: ['event'],
  readmodel: ['event'],
  person: ['readmodel'],
}

export function getNextElements(type: FlowElementType, direction: FlowDirection): FlowElementType[] {
  return direction === 'forward' ? FLOW_FORWARD[type] : FLOW_BACKWARD[type]
}

export function getDefaultNext(type: FlowElementType, direction: FlowDirection): FlowElementType | null {
  const options = getNextElements(type, direction)
  return options?.[0] ?? null
}

export function cycleAlternative(
  sourceType: FlowElementType,
  direction: FlowDirection,
  currentIndex: number,
  cycleDirection: 'down' | 'up'
): { newType: FlowElementType; newIndex: number } | null {
  const options = getNextElements(sourceType, direction)
  if (!options || options.length <= 1) return null

  const delta = cycleDirection === 'down' ? 1 : -1
  const newIndex = (currentIndex + delta + options.length) % options.length
  return { newType: options[newIndex], newIndex }
}

export function canCreateBranch(type: FlowElementType): boolean {
  return type === 'command'
}

export function getBranchType(type: FlowElementType): FlowElementType | null {
  if (type === 'command') return 'command'
  return null
}

export function isFlowElement(type: string): type is FlowElementType {
  return ['person', 'command', 'system', 'event', 'policy', 'readmodel'].includes(type)
}

export function toStickyType(type: FlowElementType): string {
  return type === 'readmodel' ? 'readmodel-sticky' : `${type}-sticky`
}

export function fromStickyType(stickyType: string): FlowElementType | null {
  const match = stickyType.match(/^(person|command|system|event|policy|readmodel)-sticky$/)
  return match ? (match[1] as FlowElementType) : null
}
