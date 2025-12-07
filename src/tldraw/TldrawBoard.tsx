import { useState, useCallback, useEffect, useRef } from 'react'
import { Tldraw, TLComponents, Editor, TLShapeId, DefaultSharePanel } from 'tldraw'
import 'tldraw/tldraw.css'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Download, Upload } from 'lucide-react'
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
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import { useFileOperations } from './useFileOperations'
import { useTemplateLoader } from './useTemplateLoader'
import { useCanvasClickPlacement } from './useCanvasClickPlacement'
import { MAX_SHAPES_PER_PAGE } from './editorHelpers'
import {
  WorkshopMode,
  FacilitationPhase,
  ToolType,
  BACKGROUND_SHAPE_TYPES,
  usesPhases,
  getAvailableTools,
} from '@/lib/workshopConfig'
import {
  WorkshopModeSelector,
  PhaseSelector,
  ConnectionStatus,
  FacilitationPalette,
} from './BoardComponents'

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

const components: TLComponents = {
  TopPanel: () => null,
  MenuPanel: () => null,
  StylePanel: () => null,
  SharePanel: DefaultSharePanel,
}

const DEFER_TO_NEXT_TICK_MS = 0
const TOOLTIP_DELAY_MS = 0

function exposeEditorForTesting(editor: Editor): void {
  if (typeof window !== 'undefined') {
    (window as unknown as { __tldrawEditor: Editor }).__tldrawEditor = editor
  }
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
  const [workshopMode, setWorkshopMode] = useState<WorkshopMode>('process')
  const [phase, setPhase] = useState<FacilitationPhase>('chaotic-exploration')
  const [activeTool, setActiveTool] = useState<ToolType | null>(null)

  const { storeWithStatus, room } = useYjsStore({ roomId })

  useYjsPresence({ editor, room, userName })
  useKeyboardShortcuts({ editor, workshopMode, phase })
  const { fileInputRef, handleExportJSON, handleImportJSON, handleFileChange } = useFileOperations({ editor, roomId })
  useTemplateLoader({ editor, templateFile, storeStatus: storeWithStatus.status })

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor)
    exposeEditorForTesting(editor)

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

  const handleToolSelect = useCallback((type: ToolType) => {
    const shouldToggleOff = activeTool === type
    setActiveTool(shouldToggleOff ? null : type)
  }, [activeTool])

  const handlePlacementComplete = useCallback(() => {
    setActiveTool(null)
  }, [])

  useCanvasClickPlacement({
    editor,
    activeTool,
    onPlacementComplete: handlePlacementComplete,
  })

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
