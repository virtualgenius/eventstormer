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
  HandlerResult,
  handleTabToNextSticky,
  handleFlowNavigation,
  handleAlternativeCycle,
  handleBranchCreation,
  handleDuplicateShortcut,
  handleShapeCreationShortcut,
} from './keyboardHandlers'

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

// Keep share panel for presence avatars
const components: TLComponents = {
  TopPanel: () => null,
  MenuPanel: () => null,
  StylePanel: () => null,
  SharePanel: DefaultSharePanel,
}

const DEFER_TO_NEXT_TICK_MS = 0
const JSON_INDENT_SPACES = 2
const TOOLTIP_DELAY_MS = 0
const TOOLTIP_SIDE_OFFSET_SM = 5
const TOOLTIP_SIDE_OFFSET_MD = 8

const PALETTE_ICON_SIZE_DEFAULT = 24
const PALETTE_ICON_SIZE_WIDE = 32
const PALETTE_ICON_SIZE_HALF = 12

const STRUCTURAL_TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'vertical-line': SeparatorVertical,
  'horizontal-lane': SeparatorHorizontal,
  'theme-area': RectangleHorizontal,
  'label': Type,
}

const STRUCTURAL_TOOL_CLASSES: Record<string, string> = {
  'vertical-line': 'w-6 h-6 text-slate-500',
  'horizontal-lane': 'w-6 h-6 text-slate-500',
  'theme-area': 'w-6 h-6 text-slate-400',
  'label': 'w-6 h-6 text-slate-500',
}

function renderToolIcon(type: ToolType, config: { color: string }) {
  const IconComponent = STRUCTURAL_TOOL_ICONS[type]
  if (IconComponent) {
    return <IconComponent className={STRUCTURAL_TOOL_CLASSES[type]} />
  }

  return (
    <div
      className="rounded"
      style={{
        width: isDoubleWide(type) ? PALETTE_ICON_SIZE_WIDE : PALETTE_ICON_SIZE_DEFAULT,
        height: isHalfHeight(type) ? PALETTE_ICON_SIZE_HALF : PALETTE_ICON_SIZE_DEFAULT,
        backgroundColor: config.color,
        border: '1px solid rgba(0,0,0,0.1)',
      }}
    />
  )
}

interface WorkshopModeSelectorProps {
  workshopMode: WorkshopMode
  onModeChange: (mode: WorkshopMode) => void
}

interface WorkshopModeButtonProps {
  mode: { value: WorkshopMode; label: string; description: string }
  isActive: boolean
  onClick: () => void
}

function WorkshopModeButton({ mode, isActive, onClick }: WorkshopModeButtonProps) {
  const buttonClass = isActive ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button onClick={onClick} className={`px-3 py-1.5 text-sm font-medium transition-colors ${buttonClass}`}>{mode.label}</button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="bg-slate-800 text-white text-xs px-3 py-2 rounded-md shadow-lg max-w-xs" sideOffset={TOOLTIP_SIDE_OFFSET_SM}>
          {mode.description}<Tooltip.Arrow className="fill-slate-800" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

function WorkshopModeSelector({ workshopMode, onModeChange }: WorkshopModeSelectorProps) {
  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
      {WORKSHOP_MODES.map((mode) => (
        <WorkshopModeButton
          key={mode.value}
          mode={mode}
          isActive={workshopMode === mode.value}
          onClick={() => onModeChange(mode.value)}
        />
      ))}
    </div>
  )
}

interface PhaseSelectorProps {
  phase: FacilitationPhase
  onPhaseChange: (phase: FacilitationPhase) => void
}

function PhaseSelector({ phase, onPhaseChange }: PhaseSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500">Phase:</span>
      <select
        value={phase}
        onChange={(e) => onPhaseChange(e.target.value as FacilitationPhase)}
        className="px-3 py-1.5 text-sm border border-slate-200 rounded-md bg-white"
      >
        <option value="chaotic-exploration">1. Chaotic Exploration</option>
        <option value="enforce-timeline">2. Enforce Timeline</option>
        <option value="people-and-systems">3. People & Systems</option>
        <option value="problems-and-opportunities">4. Value & Opportunities</option>
        <option value="next-steps">5. Next Steps</option>
      </select>
    </div>
  )
}

interface ConnectionStatusProps {
  status: string
}

function ConnectionStatus({ status }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor(status)}`} />
      <span className="text-xs text-slate-500">
        {getConnectionStatusText(status)}
      </span>
    </div>
  )
}

interface PaletteToolButtonProps {
  type: ToolType
  config: { color: string; label: string; description: string }
  isActive: boolean
  onClick: () => void
}

function PaletteToolButton({ type, config, isActive, onClick }: PaletteToolButtonProps) {
  const buttonClass = isActive ? 'border-2 border-blue-500 bg-blue-50' : 'border border-slate-200 hover:bg-slate-50'
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button onClick={onClick} className={`flex items-center justify-center p-2 rounded transition-colors ${buttonClass}`}>{renderToolIcon(type, config)}</button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="bg-slate-800 text-white text-xs px-3 py-2 rounded-md shadow-lg max-w-xs" side="right" sideOffset={TOOLTIP_SIDE_OFFSET_MD}>
          <span className="font-semibold">{config.label}</span> - {config.description}<Tooltip.Arrow className="fill-slate-800" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

interface FacilitationPaletteProps {
  availableTools: [ToolType, { color: string; label: string; description: string }][]
  activeTool: ToolType | null
  onToolSelect: (type: ToolType) => void
}

function FacilitationPalette({ availableTools, activeTool, onToolSelect }: FacilitationPaletteProps) {
  return (
    <div className="absolute top-3 left-3 z-10 bg-white p-1.5 rounded-lg shadow-md flex flex-col gap-1">
      {availableTools.map(([type, config]) => (
        <PaletteToolButton
          key={type}
          type={type}
          config={config}
          isActive={activeTool === type}
          onClick={() => onToolSelect(type)}
        />
      ))}
    </div>
  )
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

  useYjsPresence({ editor, room, userName })

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor)

    const handleBackgroundShapeCreated = (shape: { id: TLShapeId; type: string }) => {
      if (!BACKGROUND_SHAPE_TYPES.includes(shape.type)) return

      const sendToBackAfterCreation = () => editor.sendToBack([shape.id])
      setTimeout(sendToBackAfterCreation, DEFER_TO_NEXT_TICK_MS)
    }

    editor.sideEffects.registerAfterCreateHandler('shape', handleBackgroundShapeCreated)
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

  const shouldLoadTemplate = useCallback(() => {
    if (!editor || !templateFile || hasLoadedTemplateRef.current) return false
    if (storeWithStatus.status !== 'synced-remote') return false
    const existingShapes = editor.getCurrentPageShapes()
    return existingShapes.length === 0
  }, [editor, templateFile, storeWithStatus.status])

  const loadAndImportTemplate = useCallback((templatePath: string) => {
    fetch(`/samples/${templatePath}`)
      .then(res => res.json())
      .then(data => {
        if (!editor) return
        if (isEventStormerBoardFormat(data)) {
          const shapes = convertBoardToShapes(data)
          importEventStormerShapes(editor, shapes, { zoomToFit: true })
        }
      })
      .catch(err => console.error('Failed to load template board:', err))
  }, [editor])

  useEffect(function loadTemplateBoard() {
    if (!shouldLoadTemplate()) {
      if (editor && templateFile && storeWithStatus.status === 'synced-remote') {
        hasLoadedTemplateRef.current = true
      }
      return
    }
    hasLoadedTemplateRef.current = true
    loadAndImportTemplate(templateFile!)
  }, [shouldLoadTemplate, loadAndImportTemplate, editor, templateFile, storeWithStatus.status])

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

  const finishCurrentEditing = useCallback(() => {
    if (!editor) return
    const editingId = editor.getEditingShapeId()
    if (!editingId) return

    const activeEl = document.activeElement as HTMLElement
    if (activeEl) {
      saveEditingShapeText(editor, activeEl)
    } else {
      editor.setEditingShape(null)
    }
  }, [editor])

  const createNextSticky = useCallback(() => {
    if (!editor) return

    const sourceShape = getEditingOrSelectedShape(editor)
    if (!sourceShape) return

    const shapeType = sourceShape.type as ToolType
    if (!STICKY_TYPES.includes(shapeType)) return

    finishCurrentEditing()

    const props = sourceShape.props as { w: number; h: number; text?: string }
    const position = calculateNextStickyPosition({ x: sourceShape.x, y: sourceShape.y, props })

    const newId = createShapeId()
    editor.createShape({
      id: newId,
      type: shapeType,
      x: position.x,
      y: position.y,
      props: { text: '', w: props.w, h: props.h },
    })

    selectAndStartEditing(editor, newId)
  }, [editor, finishCurrentEditing])

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

    const applyFlowStateUpdate = (result: HandlerResult): boolean => {
      if (!result.handled) return false
      if (result.newFlowState !== undefined) {
        setFlowState(result.newFlowState)
      }
      return true
    }

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

      if (handleTabToNextSticky(ctx, createNextSticky).handled) return
      if (applyFlowStateUpdate(handleFlowNavigation(ctx, createFlowShape))) return
      if (applyFlowStateUpdate(handleAlternativeCycle(ctx, swapShapeType))) return
      if (applyFlowStateUpdate(handleBranchCreation(ctx, createFlowShape))) return
      if (ctx.isInTextInput) return
      if (handleDuplicateShortcut(ctx, duplicateSelected).handled) return
      handleShapeCreationShortcut(ctx, createShape)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [editor, createNextSticky, duplicateSelected, workshopMode, phase, createShape, flowState, createFlowShape, swapShapeType])

  const handleExportJSON = useCallback(() => {
    if (!editor) return

    const snapshot = editor.getSnapshot()
    const json = JSON.stringify(snapshot, null, JSON_INDENT_SPACES)
    downloadAsJsonFile(json, `board-${roomId}.json`)
  }, [editor, roomId])

  const handleImportJSON = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const clearExistingShapes = useCallback(() => {
    if (!editor) return
    const currentIds = editor.getCurrentPageShapeIds()
    if (currentIds.size > 0) {
      editor.deleteShapes([...currentIds])
    }
  }, [editor])

  const importBoardData = useCallback((data: unknown) => {
    if (!editor) return

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
  }, [editor])

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      clearExistingShapes()
      importBoardData(data)
    } catch (error) {
      console.error('Failed to import board:', error)
      alert('Failed to import board JSON. Please check the file format.')
    } finally {
      resetFileInput()
    }
  }, [editor, clearExistingShapes, importBoardData, resetFileInput])

  const handleToolSelect = useCallback((type: ToolType) => {
    setActiveTool(type)
    createShape(type)
  }, [createShape])

  const showPhaseSelector = usesPhases(workshopMode)
  const availableTools = getAvailableTools(workshopMode, phase)
  const connectionStatus = storeWithStatus.status === 'synced-remote'
    ? storeWithStatus.connectionStatus
    : storeWithStatus.status

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
    <Tooltip.Provider delayDuration={TOOLTIP_DELAY_MS}>
      <div className="flex flex-col h-full w-full relative">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 z-10">
        <div className="flex items-center gap-4">
          <WorkshopModeSelector
            workshopMode={workshopMode}
            onModeChange={setWorkshopMode}
          />
          {showPhaseSelector && (
            <PhaseSelector phase={phase} onPhaseChange={setPhase} />
          )}
        </div>

        {!renderHeaderRight && (
          <div className="flex items-center gap-4">
            <ConnectionStatus status={connectionStatus} />

            <span className="text-xs text-slate-400">
              Room: {roomId}
            </span>

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

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex-1 relative">
        <FacilitationPalette
          availableTools={availableTools}
          activeTool={activeTool}
          onToolSelect={handleToolSelect}
        />

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
