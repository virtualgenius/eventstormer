import { useState, useCallback, useEffect, useRef } from 'react'
import {
  ShapeUtil,
  TLBaseShape,
  HTMLContainer,
  Rectangle2d,
  T,
  RecordPropsType,
  useEditor,
  useValue,
} from 'tldraw'
import { SHAPE_COLORS } from '@/lib/shapeColors'
import { usePivotalPreviewStore } from '../pivotalPreviewStore'

// Shared props schema - define validators first, then derive types
const stickyShapeProps = {
  text: T.string,
  w: T.number,
  h: T.number,
  isPivotal: T.boolean,
}

type StickyProps = RecordPropsType<typeof stickyShapeProps>

// Type definitions for each sticky kind
type EventStickyShape = TLBaseShape<'event-sticky', StickyProps>
type HotspotStickyShape = TLBaseShape<'hotspot-sticky', StickyProps>
type PersonStickyShape = TLBaseShape<'person-sticky', StickyProps>
type SystemStickyShape = TLBaseShape<'system-sticky', StickyProps>
type OpportunityStickyShape = TLBaseShape<'opportunity-sticky', StickyProps>
type GlossaryStickyShape = TLBaseShape<'glossary-sticky', StickyProps>
type CommandStickyShape = TLBaseShape<'command-sticky', StickyProps>
type PolicyStickyShape = TLBaseShape<'policy-sticky', StickyProps>
type AggregateStickyShape = TLBaseShape<'aggregate-sticky', StickyProps>
type ReadModelStickyShape = TLBaseShape<'readmodel-sticky', StickyProps>

// Union type for any sticky shape
type AnyStickyShape =
  | EventStickyShape
  | HotspotStickyShape
  | PersonStickyShape
  | SystemStickyShape
  | OpportunityStickyShape
  | GlossaryStickyShape
  | CommandStickyShape
  | PolicyStickyShape
  | AggregateStickyShape
  | ReadModelStickyShape

// Default shape dimensions
const DEFAULT_STICKY_HEIGHT = 100
const DEFAULT_STICKY_WIDTH = 120
const HALF_HEIGHT_STICKY = 50
const WIDE_STICKY_WIDTH = 240

// Pivotal event styling
const PIVOTAL_STICKY_WIDTH = 180
const PIVOTAL_FONT_WEIGHT = 700
const PIVOTAL_TRANSITION_MS = 200


const isShapePivotal = (shape: AnyStickyShape): boolean =>
  shape.type === 'event-sticky' && shape.props.isPivotal

const getEffectiveWidth = (shape: AnyStickyShape): number =>
  isShapePivotal(shape) ? PIVOTAL_STICKY_WIDTH : shape.props.w

const isPreviewingPivotal = (shape: AnyStickyShape, previewId: string | null): boolean =>
  shape.type === 'event-sticky' && previewId === shape.id

const shouldAppearPivotal = (shape: AnyStickyShape, previewId: string | null): boolean =>
  isShapePivotal(shape) || isPreviewingPivotal(shape, previewId)

function StickyTextDisplay({ text }: { text: string }) {
  if (text) {
    return <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</span>
  }
  return <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', opacity: 0.5 }}>Double-click to edit</span>
}

function EditableStickyComponent({
  shape,
  colors,
}: {
  shape: AnyStickyShape
  colors: { fill: string; border: string; text: string }
}) {
  const editor = useEditor()
  const previewId = usePivotalPreviewStore((state) => state.previewId)
  const appearsPivotal = shouldAppearPivotal(shape, previewId)

  const isEditing = useValue(
    'isEditing',
    () => editor.getEditingShapeId() === shape.id,
    [editor, shape.id]
  )

  const [text, setText] = useState(shape.props.text)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync text when shape prop changes externally
  useEffect(() => {
    if (!isEditing) {
      setText(shape.props.text)
    }
  }, [shape.props.text, isEditing])

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const handleBlur = useCallback(() => {
    if (text !== shape.props.text) {
      editor.updateShape({
        id: shape.id,
        type: shape.type,
        props: { text },
      })
    }
    editor.setEditingShape(null)
  }, [editor, shape.id, shape.type, shape.props.text, text])

  const handleEscapeKey = useCallback(() => {
    setText(shape.props.text)
    editor.setEditingShape(null)
  }, [shape.props.text, editor])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleEscapeKey()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    }
    e.stopPropagation()
  }, [handleEscapeKey, handleBlur])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isEditing) {
      e.stopPropagation()
    }
  }, [isEditing])

  const effectiveWidth = appearsPivotal ? PIVOTAL_STICKY_WIDTH : shape.props.w
  const effectiveFontWeight = appearsPivotal ? PIVOTAL_FONT_WEIGHT : 'normal'

  return (
    <HTMLContainer>
      <div
        onPointerDown={handlePointerDown}
        style={{
          width: effectiveWidth,
          height: shape.props.h,
          backgroundColor: colors.fill,
          border: `2px solid ${colors.border}`,
          borderRadius: 4,
          padding: 8,
          fontSize: 14,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: effectiveFontWeight,
          overflow: 'hidden',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'flex-start',
          color: colors.text,
          lineHeight: 1.25,
          wordWrap: 'break-word',
          cursor: isEditing ? 'text' : 'default',
          transition: `width ${PIVOTAL_TRANSITION_MS}ms ease, font-weight ${PIVOTAL_TRANSITION_MS}ms ease`,
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: 'transparent',
              resize: 'none',
              outline: 'none',
              fontSize: 14,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              color: colors.text,
              lineHeight: 1.25,
              padding: 0,
              margin: 0,
            }}
          />
        ) : (
          <StickyTextDisplay text={shape.props.text} />
        )}
      </div>
    </HTMLContainer>
  )
}

// Base class for sticky shape utils
function createStickyShapeUtil<T extends AnyStickyShape>(
  type: T['type'],
  colors: { fill: string; border: string; text: string },
  defaultHeight: number = DEFAULT_STICKY_HEIGHT,
  defaultWidth: number = DEFAULT_STICKY_WIDTH
) {
  return class extends ShapeUtil<T> {
    static override type = type as T['type']
    static override props = stickyShapeProps

    // Enable editing mode for this shape type
    override canEdit = () => true

    getDefaultProps(): T['props'] {
      return { text: '', w: defaultWidth, h: defaultHeight, isPivotal: false } as T['props']
    }

    getGeometry(shape: T) {
      return new Rectangle2d({
        width: shape.props.w,
        height: shape.props.h,
        isFilled: true,
      })
    }

    component(shape: T) {
      return <EditableStickyComponent shape={shape} colors={colors} />
    }

    indicator(shape: T) {
      return <rect width={shape.props.w} height={shape.props.h} rx={4} />
    }
  }
}

// EventStickyShapeUtil needs custom geometry/indicator for pivotal width
export class EventStickyShapeUtil extends ShapeUtil<EventStickyShape> {
  static override type = 'event-sticky' as const
  static override props = stickyShapeProps

  override canEdit = () => true

  getDefaultProps(): EventStickyShape['props'] {
    return { text: '', w: DEFAULT_STICKY_WIDTH, h: DEFAULT_STICKY_HEIGHT, isPivotal: false }
  }

  getGeometry(shape: EventStickyShape) {
    return new Rectangle2d({
      width: getEffectiveWidth(shape),
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: EventStickyShape) {
    return <EditableStickyComponent shape={shape} colors={SHAPE_COLORS.event} />
  }

  indicator(shape: EventStickyShape) {
    return <rect width={getEffectiveWidth(shape)} height={shape.props.h} rx={4} />
  }
}

export const HotspotStickyShapeUtil = createStickyShapeUtil<HotspotStickyShape>(
  'hotspot-sticky',
  SHAPE_COLORS.hotspot,
  DEFAULT_STICKY_HEIGHT
)

export const PersonStickyShapeUtil = createStickyShapeUtil<PersonStickyShape>(
  'person-sticky',
  SHAPE_COLORS.person,
  HALF_HEIGHT_STICKY
)

export const SystemStickyShapeUtil = createStickyShapeUtil<SystemStickyShape>(
  'system-sticky',
  SHAPE_COLORS.system,
  DEFAULT_STICKY_HEIGHT,
  WIDE_STICKY_WIDTH
)

export const OpportunityStickyShapeUtil = createStickyShapeUtil<OpportunityStickyShape>(
  'opportunity-sticky',
  SHAPE_COLORS.opportunity,
  DEFAULT_STICKY_HEIGHT
)

export const GlossaryStickyShapeUtil = createStickyShapeUtil<GlossaryStickyShape>(
  'glossary-sticky',
  SHAPE_COLORS.glossary,
  DEFAULT_STICKY_HEIGHT
)

export const CommandStickyShapeUtil = createStickyShapeUtil<CommandStickyShape>(
  'command-sticky',
  SHAPE_COLORS.command,
  DEFAULT_STICKY_HEIGHT
)

export const PolicyStickyShapeUtil = createStickyShapeUtil<PolicyStickyShape>(
  'policy-sticky',
  SHAPE_COLORS.policy,
  DEFAULT_STICKY_HEIGHT,
  WIDE_STICKY_WIDTH
)

export const AggregateStickyShapeUtil = createStickyShapeUtil<AggregateStickyShape>(
  'aggregate-sticky',
  SHAPE_COLORS.aggregate,
  DEFAULT_STICKY_HEIGHT,
  WIDE_STICKY_WIDTH
)

export const ReadModelStickyShapeUtil = createStickyShapeUtil<ReadModelStickyShape>(
  'readmodel-sticky',
  SHAPE_COLORS.readmodel,
  DEFAULT_STICKY_HEIGHT
)
