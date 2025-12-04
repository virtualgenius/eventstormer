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
  CommandStickyShapeUtil,
  PolicyStickyShapeUtil,
  AggregateStickyShapeUtil,
  ReadModelStickyShapeUtil,
} from './shapes/StickyShapes'
import { VerticalLineShapeUtil } from './shapes/VerticalLineShape'
import { HorizontalLaneShapeUtil } from './shapes/HorizontalLaneShape'
import { ThemeAreaShapeUtil } from './shapes/ThemeAreaShape'
import { LabelShapeUtil } from './shapes/LabelShape'
import { useYjsStore } from './useYjsStore'
import { useYjsPresence } from './useYjsPresence'
import { isEventStormerBoardFormat, convertBoardToShapes } from './boardFormat'
import { Download, Upload, SeparatorVertical, SeparatorHorizontal, RectangleHorizontal, Type } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'

// Register all custom shape utils
const customShapeUtils = [
  EventStickyShapeUtil,
  HotspotStickyShapeUtil,
  PersonStickyShapeUtil,
  SystemStickyShapeUtil,
  OpportunityStickyShapeUtil,
  GlossaryStickyShapeUtil,
  CommandStickyShapeUtil,
  PolicyStickyShapeUtil,
  AggregateStickyShapeUtil,
  ReadModelStickyShapeUtil,
  VerticalLineShapeUtil,
  HorizontalLaneShapeUtil,
  ThemeAreaShapeUtil,
  LabelShapeUtil,
]

// Workshop modes
type WorkshopMode = 'big-picture' | 'process' | 'design' | 'team-flow'

const WORKSHOP_MODES: { value: WorkshopMode; label: string; description: string }[] = [
  { value: 'big-picture', label: 'Big Picture', description: 'Explore the entire business domain timeline with events, actors, and systems' },
  { value: 'process', label: 'Process', description: 'Model a specific process with commands, policies, and read models' },
  { value: 'design', label: 'Design', description: 'Design software components with commands, policies, and read models' },
  { value: 'team-flow', label: 'Team Flow', description: 'Map team interactions and workflows across the organization' },
]

// Facilitation phases (only used for Big Picture and Team Flow)
type FacilitationPhase =
  | 'chaotic-exploration'
  | 'enforce-timeline'
  | 'people-and-systems'
  | 'problems-and-opportunities'
  | 'next-steps'

const ALL_PHASES: FacilitationPhase[] = [
  'chaotic-exploration',
  'enforce-timeline',
  'people-and-systems',
  'problems-and-opportunities',
  'next-steps',
]

// Tool definitions for the palette
const TOOLS = {
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

type ToolType = keyof typeof TOOLS

// Sticky types for Tab-to-create workflow
const STICKY_TYPES: ToolType[] = [
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

// Custom UI: hide tldraw chrome, keep share panel for presence avatars
const components: TLComponents = {
  TopPanel: () => null,
  MenuPanel: () => null,
  StylePanel: () => null,
  SharePanel: DefaultSharePanel,
}

interface TldrawBoardProps {
  roomId: string
  userName: string
  templateFile?: string
  renderHeaderRight?: (props: {
    connectionStatus: string
    roomId: string
    onExport: () => void
    onImport: () => void
  }) => React.ReactNode
}

export function TldrawBoard({ roomId, userName, templateFile, renderHeaderRight }: TldrawBoardProps) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [workshopMode, setWorkshopMode] = useState<WorkshopMode>('big-picture')
  const [phase, setPhase] = useState<FacilitationPhase>('chaotic-exploration')
  const [activeTool, setActiveTool] = useState<ToolType | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { storeWithStatus, room } = useYjsStore({ roomId })

  // Set up presence sync
  useYjsPresence({ editor, room, userName })

  const BACKGROUND_SHAPE_TYPES = ['vertical-line', 'horizontal-lane', 'theme-area']

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor)

    editor.sideEffects.registerAfterCreateHandler('shape', (shape) => {
      if (BACKGROUND_SHAPE_TYPES.includes(shape.type)) {
        setTimeout(() => editor.sendToBack([shape.id]), 0)
      }
    })
  }, [])

  const hasMigratedRef = useRef(false)
  useEffect(function sendBackgroundShapesToBack() {
    if (!editor) return
    if (storeWithStatus.status !== 'synced-remote') return
    if (hasMigratedRef.current) return
    hasMigratedRef.current = true

    const allShapes = editor.getCurrentPageShapes()
    const backgroundShapes = allShapes.filter(s => BACKGROUND_SHAPE_TYPES.includes(s.type))
    if (backgroundShapes.length > 0) {
      editor.sendToBack(backgroundShapes.map(s => s.id))
    }
  }, [editor, storeWithStatus.status])

  const hasLoadedTemplateRef = useRef(false)
  useEffect(function loadTemplateBoard() {
    if (!editor || !templateFile || hasLoadedTemplateRef.current) return
    if (storeWithStatus.status !== 'synced-remote') return

    const existingShapes = editor.getCurrentPageShapes()
    if (existingShapes.length > 0) {
      hasLoadedTemplateRef.current = true
      return
    }

    hasLoadedTemplateRef.current = true
    fetch(`/samples/${templateFile}`)
      .then(res => res.json())
      .then(data => {
        if (isEventStormerBoardFormat(data)) {
          const shapes = convertBoardToShapes(data)
          if (shapes.length > 0) {
            editor.createShapes(shapes.map(shape => ({
              id: createShapeId(),
              type: shape.type,
              x: shape.x,
              y: shape.y,
              props: shape.props,
            })))
            editor.zoomToFit({ animation: { duration: 200 } })
          }
        }
      })
      .catch(err => console.error('Failed to load template board:', err))
  }, [editor, templateFile, storeWithStatus.status])

  // Shape types that support editing
  const EDITABLE_TYPES: ToolType[] = [
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

  // Create shape at center of viewport
  const createShape = useCallback((type: ToolType) => {
    if (!editor) return

    const viewportCenter = editor.getViewportScreenCenter()
    const pagePoint = editor.screenToPage(viewportCenter)

    const isHalfHeight = type === 'person-sticky'

    const shapeConfig: Record<string, { w: number; h: number; text?: string; label?: string; name?: string }> = {
      'event-sticky': { text: '', w: 120, h: 100 },
      'hotspot-sticky': { text: '', w: 120, h: 100 },
      'person-sticky': { text: '', w: 120, h: 50 },
      'system-sticky': { text: '', w: 240, h: 100 },
      'opportunity-sticky': { text: '', w: 120, h: 100 },
      'glossary-sticky': { text: '', w: 120, h: 100 },
      'command-sticky': { text: '', w: 120, h: 100 },
      'policy-sticky': { text: '', w: 240, h: 100 },
      'aggregate-sticky': { text: '', w: 240, h: 100 },
      'readmodel-sticky': { text: '', w: 120, h: 100 },
      'vertical-line': { w: 8, h: 400, label: '' },
      'horizontal-lane': { w: 800, h: 8, label: '' },
      'theme-area': { w: 400, h: 300, name: '' },
      'label': { text: '', w: 100, h: 24 },
    }

    const config = shapeConfig[type]
    const newId = createShapeId()
    editor.createShape({
      id: newId,
      type,
      x: pagePoint.x - (config.w / 2),
      y: pagePoint.y - (isHalfHeight ? 25 : 50),
      props: config,
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

  const SHAPE_SHORTCUTS: Record<string, ToolType> = {
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

  const TLDRAW_TOOL_SHORTCUTS: Record<string, string> = {
    'x': 'eraser',
  }

  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement

      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        createNextSticky()
        return
      }

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        duplicateSelected()
        return
      }

      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const shapeType = SHAPE_SHORTCUTS[e.key]
        if (shapeType) {
          const toolConfig = TOOLS[shapeType]
          const usesPhases = workshopMode === 'big-picture' || workshopMode === 'team-flow'
          const isAvailable = toolConfig.modes.includes(workshopMode) &&
            (!usesPhases || toolConfig.phases.includes(phase))
          if (isAvailable) {
            e.preventDefault()
            e.stopPropagation()
            createShape(shapeType)
            return
          }
        }

        const tldrawTool = TLDRAW_TOOL_SHORTCUTS[e.key]
        if (tldrawTool) {
          e.preventDefault()
          e.stopPropagation()
          editor.setCurrentTool(tldrawTool)
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [editor, createNextSticky, duplicateSelected, workshopMode, phase, createShape])

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
      const data = JSON.parse(text)

      // Delete existing shapes first
      const currentIds = editor.getCurrentPageShapeIds()
      if (currentIds.size > 0) {
        editor.deleteShapes([...currentIds])
      }

      // Check if this is EventStormer board format
      if (isEventStormerBoardFormat(data)) {
        const shapes = convertBoardToShapes(data)
        if (shapes.length > 0) {
          editor.createShapes(shapes.map((shape) => ({
            id: createShapeId(),
            type: shape.type,
            x: shape.x,
            y: shape.y,
            props: shape.props,
          })))
        }
        console.log(`Imported ${shapes.length} shapes from EventStormer format`)
        return
      }

      // Handle tldraw snapshot format
      const store = data.store || data.document?.store || data

      // Check if this is a direct store format (keys are record IDs)
      const firstKey = Object.keys(store)[0]
      const isDirectStore = firstKey && (firstKey.startsWith('shape:') || firstKey.startsWith('page:') || firstKey.startsWith('document:'))

      if (!isDirectStore && !data.store && !data.document?.store) {
        throw new Error('Invalid snapshot format: missing store data')
      }

      // Filter and add new records from snapshot
      const recordsToAdd = Object.values(store).filter((record: any) => {
        if (record.typeName === 'document') return false
        if (record.typeName === 'page') return false
        if (record.typeName === 'camera') return false
        if (record.typeName === 'instance') return false
        if (record.typeName === 'instance_page_state') return false
        if (record.typeName === 'pointer') return false
        return record.typeName === 'shape'
      })

      if (recordsToAdd.length > 0) {
        editor.createShapes(recordsToAdd.map((record: any) => ({
          id: record.id,
          type: record.type,
          x: record.x,
          y: record.y,
          rotation: record.rotation,
          props: record.props,
          parentId: record.parentId,
          index: record.index,
        })))
      }

      console.log(`Imported ${recordsToAdd.length} shapes from tldraw format`)
    } catch (error) {
      console.error('Failed to import board:', error)
      alert('Failed to import board JSON. Please check the file format.')
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [editor])

  // Check if phase selector should be shown (only for Big Picture and Team Flow)
  const showPhaseSelector = workshopMode === 'big-picture' || workshopMode === 'team-flow'

  // Get tools available for current mode and phase
  const availableTools = Object.entries(TOOLS).filter(([_, config]) => {
    if (!config.modes.includes(workshopMode)) return false
    if (showPhaseSelector && !config.phases.includes(phase)) return false
    return true
  })

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
    <Tooltip.Provider delayDuration={0}>
      <div className="flex flex-col h-full w-full relative">
      {/* Header bar with mode and phase selector */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 z-10">
        {/* Mode Selector (Segmented Control) and Phase Selector */}
        <div className="flex items-center gap-4">
          {/* Workshop Mode Segmented Control */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {WORKSHOP_MODES.map((mode) => (
              <Tooltip.Root key={mode.value}>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => setWorkshopMode(mode.value)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      workshopMode === mode.value
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {mode.label}
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-slate-800 text-white text-xs px-3 py-2 rounded-md shadow-lg max-w-xs"
                    sideOffset={5}
                  >
                    {mode.description}
                    <Tooltip.Arrow className="fill-slate-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            ))}
          </div>

          {/* Phase Selector - only show for Big Picture and Team Flow */}
          {showPhaseSelector && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Phase:</span>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value as FacilitationPhase)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-md bg-white"
              >
                <option value="chaotic-exploration">1. Chaotic Exploration</option>
                <option value="enforce-timeline">2. Enforce Timeline</option>
                <option value="people-and-systems">3. People & Systems</option>
                <option value="problems-and-opportunities">4. Value & Opportunities</option>
                <option value="next-steps">5. Next Steps</option>
              </select>
            </div>
          )}
        </div>

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
        <div className="absolute top-3 left-3 z-10 bg-white p-1.5 rounded-lg shadow-md flex flex-col gap-1">
          {availableTools.map(([type, config]) => {
            const isHalfHeight = type === 'person-sticky'
            const isDoubleWide = type === 'system-sticky' || type === 'policy-sticky' || type === 'aggregate-sticky'
            return (
              <Tooltip.Root key={type}>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => {
                      setActiveTool(type as ToolType)
                      createShape(type as ToolType)
                    }}
                    className={`flex items-center justify-center p-2 rounded transition-colors ${
                      activeTool === type
                        ? 'border-2 border-blue-500 bg-blue-50'
                        : 'border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {type === 'vertical-line' ? (
                      <SeparatorVertical className="w-6 h-6 text-slate-500" />
                    ) : type === 'horizontal-lane' ? (
                      <SeparatorHorizontal className="w-6 h-6 text-slate-500" />
                    ) : type === 'theme-area' ? (
                      <RectangleHorizontal className="w-6 h-6 text-slate-400" />
                    ) : type === 'label' ? (
                      <Type className="w-6 h-6 text-slate-500" />
                    ) : (
                      <div
                        className="rounded"
                        style={{
                          width: isDoubleWide ? 32 : 24,
                          height: isHalfHeight ? 12 : 24,
                          backgroundColor: config.color,
                          border: '1px solid rgba(0,0,0,0.1)',
                        }}
                      />
                    )}
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-slate-800 text-white text-xs px-3 py-2 rounded-md shadow-lg max-w-xs"
                    side="right"
                    sideOffset={8}
                  >
                    <span className="font-semibold">{config.label}</span> - {config.description}
                    <Tooltip.Arrow className="fill-slate-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            )
          })}
        </div>

        {/* tldraw Canvas */}
        <Tldraw
          licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
          store={storeWithStatus}
          shapeUtils={customShapeUtils}
          components={components}
          onMount={handleMount}
          inferDarkMode={false}
          options={{
            maxShapesPerPage: 10000,
          }}
        />
      </div>
      </div>
    </Tooltip.Provider>
  )
}
