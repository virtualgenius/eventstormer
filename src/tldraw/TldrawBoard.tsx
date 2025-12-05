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
import { isEventStormerBoardFormat, convertBoardToShapes, parseTldrawSnapshot } from './boardFormat'
import { Download, Upload, SeparatorVertical, SeparatorHorizontal, RectangleHorizontal, Type } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import {
  WorkshopMode,
  FacilitationPhase,
  ToolType,
  WORKSHOP_MODES,
  STICKY_TYPES,
  EDITABLE_TYPES,
  BACKGROUND_SHAPE_TYPES,
  usesPhases,
  getAvailableTools,
  getShapeDimensions,
  getDefaultProps,
  isHalfHeight,
  isDoubleWide,
} from '@/lib/workshopConfig'
import {
  calculateFlowShapePosition,
  calculateCenterPosition,
  calculateDuplicatePosition,
  calculateNextStickyPosition,
} from '@/lib/shapeLayout'
import {
  isTextInputElement,
  getConnectionStatusText,
  getConnectionStatusColor,
  getEditingOrSelectedShape,
  selectAndStartEditing,
  downloadAsJsonFile,
  saveEditingShapeText,
  importEventStormerShapes,
  importTldrawShapes,
  MAX_SHAPES_PER_PAGE,
} from './editorHelpers'
import {
  FlowState,
  KeyboardContext,
  handleTabToNextSticky,
  handleFlowNavigation,
  handleAlternativeCycle,
  handleBranchCreation,
  handleDuplicateShortcut,
  handleShapeCreationShortcut,
} from './keyboardHandlers'

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

  const [flowState, setFlowState] = useState<FlowState | null>(null)

  const { storeWithStatus, room } = useYjsStore({ roomId })

  // Set up presence sync
  useYjsPresence({ editor, room, userName })

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
          importEventStormerShapes(editor, shapes, { zoomToFit: true })
        }
      })
      .catch(err => console.error('Failed to load template board:', err))
  }, [editor, templateFile, storeWithStatus.status])

  const createShape = useCallback((type: ToolType) => {
    if (!editor) return

    const viewportCenter = editor.getViewportScreenCenter()
    const pagePoint = editor.screenToPage(viewportCenter)

    const config = getDefaultProps(type)
    const position = calculateCenterPosition(pagePoint, config, isHalfHeight(type))
    const newId = createShapeId()
    editor.createShape({
      id: newId,
      type,
      x: position.x,
      y: position.y,
      props: config,
    })

    if (EDITABLE_TYPES.includes(type)) {
      selectAndStartEditing(editor, newId)
    }
  }, [editor])

  const createNextSticky = useCallback(() => {
    if (!editor) return

    const sourceShape = getEditingOrSelectedShape(editor)
    if (!sourceShape) return

    const editingId = editor.getEditingShapeId()

    const shapeType = sourceShape.type as ToolType

    // Only works for sticky types
    if (!STICKY_TYPES.includes(shapeType)) return

    if (editingId) {
      const activeEl = document.activeElement as HTMLElement
      if (activeEl) {
        saveEditingShapeText(editor, activeEl)
      } else {
        editor.setEditingShape(null)
      }
    }

    const props = sourceShape.props as { w: number; h: number; text?: string }
    const position = calculateNextStickyPosition({ x: sourceShape.x, y: sourceShape.y, props })

    const newId = createShapeId()
    editor.createShape({
      id: newId,
      type: shapeType,
      x: position.x,
      y: position.y,
      props: {
        text: '',
        w: props.w,
        h: props.h,
      },
    })

    selectAndStartEditing(editor, newId)
  }, [editor])

  const duplicateSelected = useCallback(() => {
    if (!editor) return

    const selectedShapes = editor.getSelectedShapes()
    if (selectedShapes.length === 0) return

    const newIds: TLShapeId[] = []

    for (const shape of selectedShapes) {
      const newId = createShapeId()
      newIds.push(newId)

      const position = calculateDuplicatePosition({ x: shape.x, y: shape.y })
      editor.createShape({
        id: newId,
        type: shape.type,
        x: position.x,
        y: position.y,
        props: { ...shape.props },
      })
    }

    editor.select(...newIds)
  }, [editor])

  const createFlowShape = useCallback((
    sourceShape: { x: number; y: number; props: { w: number; h: number } },
    targetStickyType: string,
    direction: 'right' | 'left' | 'down'
  ): TLShapeId | null => {
    if (!editor) return null

    const targetDims = getShapeDimensions(targetStickyType)
    const position = calculateFlowShapePosition(sourceShape, targetStickyType, direction)

    const newId = createShapeId()
    editor.createShape({
      id: newId,
      type: targetStickyType,
      x: position.x,
      y: position.y,
      props: { text: '', w: targetDims.w, h: targetDims.h },
    })

    selectAndStartEditing(editor, newId)

    return newId
  }, [editor])

  const swapShapeType = useCallback((shapeId: TLShapeId, newStickyType: string) => {
    if (!editor) return

    const shape = editor.getShape(shapeId)
    if (!shape) return

    const newDims = getShapeDimensions(newStickyType)
    const props = shape.props as { text?: string }

    editor.deleteShapes([shapeId])
    editor.createShape({
      id: shapeId,
      type: newStickyType,
      x: shape.x,
      y: shape.y,
      props: { text: props.text || '', w: newDims.w, h: newDims.h },
    })

    selectAndStartEditing(editor, shapeId)
  }, [editor])

  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const ctx: KeyboardContext = {
        editor,
        event: e,
        target,
        isInTextInput: isTextInputElement(target),
        workshopMode,
        phase,
        flowState,
      }

      // Tab: create next sticky in sequence
      const tabResult = handleTabToNextSticky(ctx, createNextSticky)
      if (tabResult.handled) return

      // Arrow Left/Right: flow navigation (create next element in flow)
      const flowResult = handleFlowNavigation(ctx, createFlowShape)
      if (flowResult.handled) {
        if (flowResult.newFlowState !== undefined) {
          setFlowState(flowResult.newFlowState)
        }
        return
      }

      // Arrow Up/Down: cycle through alternative types
      const cycleResult = handleAlternativeCycle(ctx, swapShapeType)
      if (cycleResult.handled) {
        if (cycleResult.newFlowState !== undefined) {
          setFlowState(cycleResult.newFlowState)
        }
        return
      }

      // Arrow Down: create branch (e.g., policy from command)
      const branchResult = handleBranchCreation(ctx, createFlowShape)
      if (branchResult.handled) {
        if (branchResult.newFlowState !== undefined) {
          setFlowState(branchResult.newFlowState)
        }
        return
      }

      // Skip remaining shortcuts when in text input
      if (ctx.isInTextInput) return

      // Cmd/Ctrl+D: duplicate selected shapes
      const dupResult = handleDuplicateShortcut(ctx, duplicateSelected)
      if (dupResult.handled) return

      // Single-key shortcuts: create shapes or switch tldraw tools
      handleShapeCreationShortcut(ctx, createShape)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [editor, createNextSticky, duplicateSelected, workshopMode, phase, createShape, flowState, createFlowShape, swapShapeType])

  const handleExportJSON = useCallback(() => {
    if (!editor) return

    const snapshot = editor.getSnapshot()
    const json = JSON.stringify(snapshot, null, 2)
    downloadAsJsonFile(json, `board-${roomId}.json`)
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

      const currentIds = editor.getCurrentPageShapeIds()
      if (currentIds.size > 0) {
        editor.deleteShapes([...currentIds])
      }

      if (isEventStormerBoardFormat(data)) {
        const shapes = convertBoardToShapes(data)
        importEventStormerShapes(editor, shapes)
        console.log(`Imported ${shapes.length} shapes from EventStormer format`)
        return
      }

      const result = parseTldrawSnapshot(data)
      if (result.error) {
        throw new Error(result.error)
      }

      importTldrawShapes(editor, result.shapes)
      console.log(`Imported ${result.shapes.length} shapes from tldraw format`)
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
  const showPhaseSelector = usesPhases(workshopMode)

  // Get tools available for current mode and phase
  const availableTools = getAvailableTools(workshopMode, phase)

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
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor(connectionStatus)}`} />
              <span className="text-xs text-slate-500">
                {getConnectionStatusText(connectionStatus)}
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
          {availableTools.map(([type, config]) => (
              <Tooltip.Root key={type}>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => {
                      setActiveTool(type)
                      createShape(type)
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
                          width: isDoubleWide(type) ? 32 : 24,
                          height: isHalfHeight(type) ? 12 : 24,
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
          ))}
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
            maxShapesPerPage: MAX_SHAPES_PER_PAGE,
          }}
        />
      </div>
      </div>
    </Tooltip.Provider>
  )
}
