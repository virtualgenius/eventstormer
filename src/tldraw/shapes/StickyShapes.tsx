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
import {
  STANDARD_STICKY_SIZE,
  HALF_HEIGHT_STICKY,
  WIDE_STICKY_WIDTH,
  HOTSPOT_WIDTH,
  HOTSPOT_HEIGHT,
} from '@/lib/workshopConfig'
import { usePivotalPreviewStore } from '../pivotalPreviewStore'

const stickyShapeProps = {
  text: T.string,
  w: T.number,
  h: T.number,
  isPivotal: T.boolean,
}

type StickyProps = RecordPropsType<typeof stickyShapeProps>

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

const HOTSPOT_ROTATION_DEG = -10
const HOTSPOT_STROKE_WIDTH = 6
const HOTSPOT_CORNER_RADIUS = 12
const HOTSPOT_SVG_PADDING = 4
const HOTSPOT_TAIL_HEIGHT = 15

const PIVOTAL_STICKY_SIZE = 130
const PIVOTAL_FONT_WEIGHT = 700
const PIVOTAL_TRANSITION_MS = 200


const isShapePivotal = (shape: AnyStickyShape): boolean =>
  shape.type === 'event-sticky' && shape.props.isPivotal

const getEffectiveWidth = (shape: AnyStickyShape): number =>
  isShapePivotal(shape) ? PIVOTAL_STICKY_SIZE : shape.props.w

const isPreviewingPivotal = (shape: AnyStickyShape, previewId: string | null): boolean =>
  shape.type === 'event-sticky' && previewId === shape.id

const shouldAppearPivotal = (shape: AnyStickyShape, previewId: string | null): boolean =>
  isShapePivotal(shape) || isPreviewingPivotal(shape, previewId)

interface EffectiveDimensions {
  width: number
  height: number
  fontWeight: number | 'normal'
}

const getEffectiveDimensions = (shape: AnyStickyShape, appearsPivotal: boolean): EffectiveDimensions => ({
  width: appearsPivotal ? PIVOTAL_STICKY_SIZE : shape.props.w,
  height: appearsPivotal ? PIVOTAL_STICKY_SIZE : shape.props.h,
  fontWeight: appearsPivotal ? PIVOTAL_FONT_WEIGHT : 'normal',
})

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

  const { width: effectiveWidth, height: effectiveHeight, fontWeight: effectiveFontWeight } = getEffectiveDimensions(shape, appearsPivotal)

  return (
    <HTMLContainer>
      <div
        onPointerDown={handlePointerDown}
        style={{
          width: effectiveWidth,
          height: effectiveHeight,
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
          transition: `width ${PIVOTAL_TRANSITION_MS}ms ease, height ${PIVOTAL_TRANSITION_MS}ms ease, font-weight ${PIVOTAL_TRANSITION_MS}ms ease`,
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

// Speech bubble SVG path for hotspot shape
const HOTSPOT_BUBBLE_PATH = 'M 12,0 H 128 Q 140,0 140,12 V 88 Q 140,100 128,100 H 55 L 35,115 L 40,100 H 12 Q 0,100 0,88 V 12 Q 0,0 12,0 Z'

function HotspotBubbleComponent({ shape }: { shape: HotspotStickyShape }) {
  const editor = useEditor()
  const colors = SHAPE_COLORS.hotspot

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

  return (
    <HTMLContainer>
      <div
        onPointerDown={handlePointerDown}
        style={{
          width: HOTSPOT_WIDTH,
          height: HOTSPOT_HEIGHT,
          position: 'relative',
          transform: `rotate(${HOTSPOT_ROTATION_DEG}deg)`,
          transformOrigin: 'center center',
        }}
      >
        {/* Speech bubble SVG background */}
        <svg
          width={HOTSPOT_WIDTH + HOTSPOT_SVG_PADDING * 2}
          height={HOTSPOT_HEIGHT + HOTSPOT_SVG_PADDING * 2 - 1}
          viewBox="-4 -4 148 122"
          style={{
            position: 'absolute',
            top: -HOTSPOT_SVG_PADDING,
            left: -HOTSPOT_SVG_PADDING,
          }}
        >
          <path
            d={HOTSPOT_BUBBLE_PATH}
            fill={colors.fill}
            stroke={colors.border}
            strokeWidth={HOTSPOT_STROKE_WIDTH}
          />
        </svg>

        {/* Text content overlay */}
        <div
          style={{
            position: 'absolute',
            top: HOTSPOT_CORNER_RADIUS,
            left: HOTSPOT_CORNER_RADIUS,
            right: HOTSPOT_CORNER_RADIUS,
            bottom: HOTSPOT_CORNER_RADIUS + HOTSPOT_TAIL_HEIGHT,
            overflow: 'hidden',
            fontSize: 16,
            fontFamily: "'Bangers', cursive",
            color: colors.text,
            lineHeight: 1.2,
            cursor: isEditing ? 'text' : 'default',
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
                fontSize: 16,
                fontFamily: "'Bangers', cursive",
                color: colors.text,
                lineHeight: 1.2,
                padding: 0,
                margin: 0,
              }}
            />
          ) : (
            <StickyTextDisplay text={shape.props.text} />
          )}
        </div>
      </div>
    </HTMLContainer>
  )
}

// Base class for sticky shape utils
function createStickyShapeUtil<T extends AnyStickyShape>(
  type: T['type'],
  colors: { fill: string; border: string; text: string },
  defaultHeight: number = STANDARD_STICKY_SIZE,
  defaultWidth: number = STANDARD_STICKY_SIZE
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
    return { text: '', w: STANDARD_STICKY_SIZE, h: STANDARD_STICKY_SIZE, isPivotal: false }
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

export class HotspotStickyShapeUtil extends ShapeUtil<HotspotStickyShape> {
  static override type = 'hotspot-sticky' as const
  static override props = stickyShapeProps

  override canEdit = () => true

  getDefaultProps(): HotspotStickyShape['props'] {
    return { text: '', w: HOTSPOT_WIDTH, h: HOTSPOT_HEIGHT, isPivotal: false }
  }

  getGeometry(shape: HotspotStickyShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: HotspotStickyShape) {
    return <HotspotBubbleComponent shape={shape} />
  }

  indicator(shape: HotspotStickyShape) {
    return (
      <g transform={`rotate(${HOTSPOT_ROTATION_DEG}, ${shape.props.w / 2}, ${shape.props.h / 2})`}>
        <path d={HOTSPOT_BUBBLE_PATH} />
      </g>
    )
  }
}

export const PersonStickyShapeUtil = createStickyShapeUtil<PersonStickyShape>(
  'person-sticky',
  SHAPE_COLORS.person,
  HALF_HEIGHT_STICKY
)

export const SystemStickyShapeUtil = createStickyShapeUtil<SystemStickyShape>(
  'system-sticky',
  SHAPE_COLORS.system,
  STANDARD_STICKY_SIZE,
  WIDE_STICKY_WIDTH
)

export const OpportunityStickyShapeUtil = createStickyShapeUtil<OpportunityStickyShape>(
  'opportunity-sticky',
  SHAPE_COLORS.opportunity,
  STANDARD_STICKY_SIZE
)

export const GlossaryStickyShapeUtil = createStickyShapeUtil<GlossaryStickyShape>(
  'glossary-sticky',
  SHAPE_COLORS.glossary,
  STANDARD_STICKY_SIZE
)

export const CommandStickyShapeUtil = createStickyShapeUtil<CommandStickyShape>(
  'command-sticky',
  SHAPE_COLORS.command,
  STANDARD_STICKY_SIZE
)

export const PolicyStickyShapeUtil = createStickyShapeUtil<PolicyStickyShape>(
  'policy-sticky',
  SHAPE_COLORS.policy,
  STANDARD_STICKY_SIZE,
  WIDE_STICKY_WIDTH
)

export const AggregateStickyShapeUtil = createStickyShapeUtil<AggregateStickyShape>(
  'aggregate-sticky',
  SHAPE_COLORS.aggregate,
  STANDARD_STICKY_SIZE,
  WIDE_STICKY_WIDTH
)

export const ReadModelStickyShapeUtil = createStickyShapeUtil<ReadModelStickyShape>(
  'readmodel-sticky',
  SHAPE_COLORS.readmodel,
  STANDARD_STICKY_SIZE
)
