import { useState, useCallback, useEffect } from 'react'
import {
  Tldraw,
  TLComponents,
  Editor,
  createShapeId,
  TLShapeId,
} from 'tldraw'
import 'tldraw/tldraw.css'
import {
  EventStickyShapeUtil,
  HotspotStickyShapeUtil,
  PersonStickyShapeUtil,
  SystemStickyShapeUtil,
  OpportunityStickyShapeUtil,
  GlossaryStickyShapeUtil,
} from './shapes/StickyShapes'
import { VerticalLineShapeUtil } from './shapes/VerticalLineShape'
import { HorizontalLaneShapeUtil } from './shapes/HorizontalLaneShape'
import { ThemeAreaShapeUtil } from './shapes/ThemeAreaShape'
import { LabelShapeUtil } from './shapes/LabelShape'

// Register all custom shape utils
const customShapeUtils = [
  EventStickyShapeUtil,
  HotspotStickyShapeUtil,
  PersonStickyShapeUtil,
  SystemStickyShapeUtil,
  OpportunityStickyShapeUtil,
  GlossaryStickyShapeUtil,
  VerticalLineShapeUtil,
  HorizontalLaneShapeUtil,
  ThemeAreaShapeUtil,
  LabelShapeUtil,
]

// Facilitation phases
type FacilitationPhase =
  | 'chaotic-exploration'
  | 'enforce-timeline'
  | 'people-and-systems'
  | 'problems-and-opportunities'
  | 'glossary'

// Tool definitions for the palette
const TOOLS = {
  'event-sticky': { label: 'Event', color: '#fed7aa', phases: ['chaotic-exploration', 'enforce-timeline', 'people-and-systems', 'problems-and-opportunities', 'glossary'] },
  'hotspot-sticky': { label: 'Hotspot', color: '#fecaca', phases: ['chaotic-exploration', 'enforce-timeline', 'people-and-systems', 'problems-and-opportunities', 'glossary'] },
  'vertical-line': { label: 'Pivotal', color: '#cbd5e1', phases: ['enforce-timeline', 'people-and-systems', 'problems-and-opportunities', 'glossary'] },
  'horizontal-lane': { label: 'Swimlane', color: '#e2e8f0', phases: ['enforce-timeline', 'people-and-systems', 'problems-and-opportunities', 'glossary'] },
  'person-sticky': { label: 'Person', color: '#fef9c3', phases: ['people-and-systems', 'problems-and-opportunities', 'glossary'] },
  'system-sticky': { label: 'System', color: '#e9d5ff', phases: ['people-and-systems', 'problems-and-opportunities', 'glossary'] },
  'opportunity-sticky': { label: 'Opportunity', color: '#bbf7d0', phases: ['problems-and-opportunities', 'glossary'] },
  'glossary-sticky': { label: 'Glossary', color: '#f1f5f9', phases: ['glossary'] },
  'theme-area': { label: 'Theme', color: 'rgba(226,232,240,0.5)', phases: ['chaotic-exploration', 'enforce-timeline', 'people-and-systems', 'problems-and-opportunities', 'glossary'] },
  'label': { label: 'Label', color: 'transparent', phases: ['chaotic-exploration', 'enforce-timeline', 'people-and-systems', 'problems-and-opportunities', 'glossary'] },
} as const

type ToolType = keyof typeof TOOLS

// Sticky types for Tab-to-create workflow
const STICKY_TYPES: ToolType[] = [
  'event-sticky',
  'hotspot-sticky',
  'person-sticky',
  'system-sticky',
  'opportunity-sticky',
  'glossary-sticky',
]

// Sample texts for performance testing
const sampleTexts: Record<string, string[]> = {
  'event-sticky': ['User submitted form', 'Payment processed', 'Order confirmed', 'Email sent', 'Account created', 'Item added to cart', 'Checkout started', 'Shipment dispatched', 'Delivery completed', 'Review submitted'],
  'hotspot-sticky': ['Slow response time', 'User confusion here', 'Missing validation', 'Error handling needed', 'Security concern'],
  'person-sticky': ['Customer', 'Admin', 'Support Agent', 'Developer', 'Manager'],
  'system-sticky': ['Payment Gateway', 'Email Service', 'Database', 'Cache', 'Analytics'],
  'opportunity-sticky': ['Automate this', 'Simplify flow', 'Add monitoring', 'Improve UX'],
  'glossary-sticky': ['Domain term', 'Technical term', 'Business concept'],
}

function getRandomText(kind: string): string {
  const texts = sampleTexts[kind]
  if (!texts) return ''
  return texts[Math.floor(Math.random() * texts.length)]
}

// Custom UI hiding tldraw's top panel
const components: TLComponents = {
  TopPanel: () => null,
}

export default function App() {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [shapeCount, setShapeCount] = useState(0)
  const [phase, setPhase] = useState<FacilitationPhase>('chaotic-exploration')
  const [activeTool, setActiveTool] = useState<ToolType | null>(null)

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor)
    editor.store.listen(() => {
      const shapes = editor.getCurrentPageShapes()
      setShapeCount(shapes.length)
    })
  }, [])

  // Shape types that support editing
  const EDITABLE_TYPES: ToolType[] = [
    'event-sticky',
    'hotspot-sticky',
    'person-sticky',
    'system-sticky',
    'opportunity-sticky',
    'glossary-sticky',
    'theme-area',
    'label',
  ]

  // Create shape at center of viewport
  const createShape = useCallback((type: ToolType) => {
    if (!editor) return

    const viewportCenter = editor.getViewportScreenCenter()
    const pagePoint = editor.screenToPage(viewportCenter)

    const isHalfHeight = type === 'person-sticky' || type === 'system-sticky'

    const shapeConfig: Record<string, object> = {
      'event-sticky': { text: '', w: 120, h: 100 },
      'hotspot-sticky': { text: '', w: 120, h: 100 },
      'person-sticky': { text: '', w: 120, h: 50 },
      'system-sticky': { text: '', w: 120, h: 50 },
      'opportunity-sticky': { text: '', w: 120, h: 100 },
      'glossary-sticky': { text: '', w: 120, h: 100 },
      'vertical-line': { w: 8, h: 400, label: '' },
      'horizontal-lane': { w: 800, h: 8, label: '' },
      'theme-area': { w: 400, h: 300, name: '' },
      'label': { text: '', w: 100, h: 24 },
    }

    const newId = createShapeId()
    editor.createShape({
      id: newId,
      type,
      x: pagePoint.x - 60,
      y: pagePoint.y - (isHalfHeight ? 25 : 50),
      props: shapeConfig[type],
    })

    // Select and enter edit mode for editable shapes
    if (EDITABLE_TYPES.includes(type)) {
      editor.select(newId)
      requestAnimationFrame(() => {
        editor.setEditingShape(newId)
      })
    }
  }, [editor])

  // Generate test shapes for performance testing
  const generateTestShapes = useCallback((count: number) => {
    if (!editor) return
    const start = performance.now()

    const STICKY_WIDTH = 120
    const STICKY_HEIGHT = 100
    const GAP_X = 20
    const GAP_Y = 30
    const STICKIES_PER_ROW = 50
    const START_X = 100
    const START_Y = 100

    const kinds: ToolType[] = ['event-sticky', 'hotspot-sticky', 'person-sticky', 'system-sticky', 'opportunity-sticky']
    const weights = [50, 20, 10, 10, 10]

    function getRandomKind(): ToolType {
      const total = weights.reduce((sum, w) => sum + w, 0)
      let random = Math.random() * total
      for (let i = 0; i < kinds.length; i++) {
        random -= weights[i]
        if (random <= 0) return kinds[i]
      }
      return kinds[0]
    }

    const shapes = []
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / STICKIES_PER_ROW)
      const col = i % STICKIES_PER_ROW
      const kind = getRandomKind()
      const isHalfHeight = kind === 'person-sticky' || kind === 'system-sticky'
      const jitterX = (Math.random() - 0.5) * 20
      const jitterY = (Math.random() - 0.5) * 20

      shapes.push({
        id: createShapeId(),
        type: kind,
        x: START_X + col * (STICKY_WIDTH + GAP_X) + jitterX,
        y: START_Y + row * (STICKY_HEIGHT + GAP_Y) + jitterY,
        props: {
          text: getRandomText(kind),
          w: STICKY_WIDTH,
          h: isHalfHeight ? STICKY_HEIGHT / 2 : STICKY_HEIGHT,
        },
      })
    }

    editor.createShapes(shapes)
    console.log(`Generated ${count} shapes in ${(performance.now() - start).toFixed(2)}ms`)
  }, [editor])

  const clearAll = useCallback(() => {
    if (!editor) return
    const shapes = editor.getCurrentPageShapes()
    editor.deleteShapes(shapes.map(s => s.id))
  }, [editor])

  // Create a new sticky to the right of selected shape (Tab workflow)
  const createNextSticky = useCallback(() => {
    if (!editor) return

    // Get the shape to base the new sticky on
    const editingId = editor.getEditingShapeId()
    let sourceShape = editingId ? editor.getShape(editingId) : null

    // If not editing, use selected shape
    if (!sourceShape) {
      const selectedShapes = editor.getSelectedShapes()
      if (selectedShapes.length !== 1) return
      sourceShape = selectedShapes[0]
    }

    if (!sourceShape) return

    const shapeType = sourceShape.type as ToolType

    // Only works for sticky types
    if (!STICKY_TYPES.includes(shapeType)) return

    // If editing, save the current text directly from the DOM before exiting
    if (editingId) {
      const activeEl = document.activeElement
      const textarea = activeEl as HTMLTextAreaElement | HTMLInputElement
      if (textarea && (textarea.tagName === 'TEXTAREA' || textarea.tagName === 'INPUT')) {
        const currentText = textarea.value
        const currentProps = sourceShape.props as { text?: string }
        if (currentText !== currentProps.text) {
          editor.updateShape({
            id: editingId,
            type: sourceShape.type,
            props: { text: currentText },
          })
        }
      }
      editor.setEditingShape(null)
    }

    const GAP = 20
    const props = sourceShape.props as { w: number; h: number; text?: string }
    const newX = sourceShape.x + props.w + GAP
    const newY = sourceShape.y

    const newId = createShapeId()
    editor.createShape({
      id: newId,
      type: shapeType,
      x: newX,
      y: newY,
      props: {
        text: '',
        w: props.w,
        h: props.h,
      },
    })

    // Select the new shape and enter edit mode
    editor.select(newId)
    requestAnimationFrame(() => {
      editor.setEditingShape(newId)
    })
  }, [editor])

  // Duplicate selected shapes (Cmd+D)
  const duplicateSelected = useCallback(() => {
    if (!editor) return

    const selectedShapes = editor.getSelectedShapes()
    if (selectedShapes.length === 0) return

    const OFFSET = 20
    const newIds: TLShapeId[] = []

    for (const shape of selectedShapes) {
      const newId = createShapeId()
      newIds.push(newId)

      editor.createShape({
        id: newId,
        type: shape.type,
        x: shape.x + OFFSET,
        y: shape.y + OFFSET,
        props: { ...shape.props },
      })
    }

    // Select the duplicated shapes
    editor.select(...newIds)
  }, [editor])

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement

      // Tab: Create next sticky (works from edit mode or selection)
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        createNextSticky()
        return
      }

      // Don't intercept other keys if we're in an input/textarea
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      // Cmd+D / Ctrl+D: Duplicate
      if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        duplicateSelected()
        return
      }
    }

    // Use capture phase to catch events before they're stopped by stopPropagation
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [editor, createNextSticky, duplicateSelected])

  // Get tools available for current phase
  const availableTools = Object.entries(TOOLS).filter(
    ([_, config]) => config.phases.includes(phase)
  )

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 48,
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        zIndex: 1000,
        gap: 16,
      }}>
        <span style={{ fontWeight: 700, fontSize: 18 }}>EventStormer</span>
        <span style={{ color: '#64748b' }}>|</span>
        <span style={{ color: '#64748b', fontSize: 14 }}>Shapes: {shapeCount}</span>

        {/* Phase Selector */}
        <select
          value={phase}
          onChange={(e) => setPhase(e.target.value as FacilitationPhase)}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            borderRadius: 4,
            border: '1px solid #e2e8f0',
            fontSize: 14,
          }}
        >
          <option value="chaotic-exploration">1. Chaotic Exploration</option>
          <option value="enforce-timeline">2. Enforce Timeline</option>
          <option value="people-and-systems">3. People & Systems</option>
          <option value="problems-and-opportunities">4. Problems & Opportunities</option>
          <option value="glossary">5. Glossary</option>
        </select>

        {/* Performance Test Buttons */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => generateTestShapes(100)} style={smallButtonStyle}>+100</button>
          <button onClick={() => generateTestShapes(1000)} style={smallButtonStyle}>+1K</button>
          <button onClick={() => generateTestShapes(5000)} style={smallButtonStyle}>+5K</button>
          <button onClick={clearAll} style={{ ...smallButtonStyle, background: '#fee2e2' }}>Clear</button>
        </div>
      </div>

      {/* Facilitation Palette */}
      <div style={{
        position: 'absolute',
        top: 60,
        left: 12,
        zIndex: 1000,
        background: 'white',
        padding: 8,
        borderRadius: 8,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {availableTools.map(([type, config]) => (
          <button
            key={type}
            onClick={() => {
              setActiveTool(type as ToolType)
              createShape(type as ToolType)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 4,
              border: activeTool === type ? '2px solid #3b82f6' : '1px solid #e2e8f0',
              background: 'white',
              cursor: 'pointer',
              fontSize: 13,
              minWidth: 120,
            }}
          >
            <div style={{
              width: 20,
              height: type === 'person-sticky' || type === 'system-sticky' ? 10 : 20,
              backgroundColor: config.color,
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 2,
            }} />
            {config.label}
          </button>
        ))}
      </div>

      {/* tldraw Canvas */}
      <div style={{ position: 'absolute', top: 48, left: 0, right: 0, bottom: 0 }}>
        <Tldraw
          shapeUtils={customShapeUtils}
          components={components}
          onMount={handleMount}
          options={{
            maxShapesPerPage: 10000,
          }}
        />
      </div>
    </div>
  )
}

const smallButtonStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 4,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  cursor: 'pointer',
  fontSize: 12,
}
