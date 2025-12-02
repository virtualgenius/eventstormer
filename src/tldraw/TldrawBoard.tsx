import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Tldraw,
  TLComponents,
  Editor,
  createShapeId,
  TLShapeId,
  DefaultSharePanel,
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
import { useYjsStore } from './useYjsStore'
import { useYjsPresence } from './useYjsPresence'
import { Download, Upload } from 'lucide-react'

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

// Custom UI: hide tldraw chrome, keep share panel for presence avatars
const components: TLComponents = {
  TopPanel: () => null,
  MenuPanel: () => null,
  SharePanel: DefaultSharePanel,
}

interface TldrawBoardProps {
  roomId: string
  renderHeaderRight?: (props: {
    connectionStatus: string
    roomId: string
    onExport: () => void
    onImport: () => void
  }) => React.ReactNode
}

export function TldrawBoard({ roomId, renderHeaderRight }: TldrawBoardProps) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [phase, setPhase] = useState<FacilitationPhase>('chaotic-exploration')
  const [activeTool, setActiveTool] = useState<ToolType | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { storeWithStatus, room } = useYjsStore({ roomId })

  // Set up presence sync
  useYjsPresence({ editor, room })

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor)
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

  // Export board as JSON
  const handleExportJSON = useCallback(() => {
    if (!editor) return

    const snapshot = editor.getSnapshot()
    const json = JSON.stringify(snapshot, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `board-${roomId}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [editor, roomId])

  // Import board from JSON
  const handleImportJSON = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    try {
      const text = await file.text()
      const snapshot = JSON.parse(text)
      editor.loadSnapshot(snapshot)
    } catch (error) {
      console.error('Failed to import board:', error)
      alert('Failed to import board JSON. Please check the file format.')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [editor])

  // Get tools available for current phase
  const availableTools = Object.entries(TOOLS).filter(
    ([_, config]) => (config.phases as readonly string[]).includes(phase)
  )

  // Connection status indicator
  const connectionStatus = storeWithStatus.status === 'synced-remote'
    ? storeWithStatus.connectionStatus
    : storeWithStatus.status

  // Notify parent of state changes via render prop callback
  useEffect(() => {
    if (renderHeaderRight) {
      renderHeaderRight({
        connectionStatus,
        roomId,
        onExport: handleExportJSON,
        onImport: handleImportJSON,
      })
    }
  }, [renderHeaderRight, connectionStatus, roomId, handleExportJSON, handleImportJSON])

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Header bar with phase selector */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 z-10">
        {/* Phase Selector */}
        <select
          value={phase}
          onChange={(e) => setPhase(e.target.value as FacilitationPhase)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-md bg-white"
        >
          <option value="chaotic-exploration">1. Chaotic Exploration</option>
          <option value="enforce-timeline">2. Enforce Timeline</option>
          <option value="people-and-systems">3. People & Systems</option>
          <option value="problems-and-opportunities">4. Problems & Opportunities</option>
          <option value="glossary">5. Glossary</option>
        </select>

        {/* Render header right content if no external render prop */}
        {!renderHeaderRight && (
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'online' ? 'bg-green-500' :
                  connectionStatus === 'offline' ? 'bg-red-500' :
                  connectionStatus === 'loading' ? 'bg-yellow-500' : 'bg-slate-400'
                }`}
              />
              <span className="text-xs text-slate-500">
                {connectionStatus === 'online' ? 'Connected' :
                 connectionStatus === 'offline' ? 'Offline' :
                 connectionStatus === 'loading' ? 'Connecting...' :
                 connectionStatus === 'not-synced' ? 'Syncing...' : 'Loading...'}
              </span>
            </div>

            {/* Room ID */}
            <span className="text-xs text-slate-400">
              Room: {roomId}
            </span>

            {/* Import/Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                title="Export board as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              <button
                onClick={handleImportJSON}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                title="Import board from JSON"
              >
                <Upload className="w-3.5 h-3.5" />
                Import
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main content area */}
      <div className="flex-1 relative">
        {/* Facilitation Palette */}
        <div className="absolute top-3 left-3 z-10 bg-white p-2 rounded-lg shadow-md flex flex-col gap-1">
          {availableTools.map(([type, config]) => (
            <button
              key={type}
              onClick={() => {
                setActiveTool(type as ToolType)
                createShape(type as ToolType)
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm min-w-[120px] transition-colors ${
                activeTool === type
                  ? 'border-2 border-blue-500 bg-blue-50'
                  : 'border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div
                className="w-5 rounded"
                style={{
                  height: type === 'person-sticky' || type === 'system-sticky' ? 10 : 20,
                  backgroundColor: config.color,
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              />
              {config.label}
            </button>
          ))}
        </div>

        {/* tldraw Canvas */}
        <Tldraw
          store={storeWithStatus}
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
