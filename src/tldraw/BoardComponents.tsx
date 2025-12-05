import * as Tooltip from '@radix-ui/react-tooltip'
import { SeparatorVertical, SeparatorHorizontal, RectangleHorizontal, Type } from 'lucide-react'
import {
  WorkshopMode,
  FacilitationPhase,
  ToolType,
  WORKSHOP_MODES,
  isHalfHeight,
  isDoubleWide,
} from '@/lib/workshopConfig'
import { getConnectionStatusText, getConnectionStatusColor } from './editorHelpers'

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

export function WorkshopModeSelector({ workshopMode, onModeChange }: WorkshopModeSelectorProps) {
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

export function PhaseSelector({ phase, onPhaseChange }: PhaseSelectorProps) {
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

export function ConnectionStatus({ status }: ConnectionStatusProps) {
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

export function FacilitationPalette({ availableTools, activeTool, onToolSelect }: FacilitationPaletteProps) {
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
