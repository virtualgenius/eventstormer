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

// Shared props schema - define validators first, then derive types
const stickyShapeProps = {
  text: T.string,
  w: T.number,
  h: T.number,
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


// Editable sticky component using tldraw's editing state
function EditableStickyComponent({
  shape,
  colors,
}: {
  shape: AnyStickyShape
  colors: { fill: string; border: string; text: string }
}) {
  const editor = useEditor()

  // Check if this shape is being edited using tldraw's editing state
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setText(shape.props.text)
      editor.setEditingShape(null)
      e.stopPropagation()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    }
    e.stopPropagation()
  }, [shape.props.text, handleBlur, editor])

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
          width: shape.props.w,
          height: shape.props.h,
          backgroundColor: colors.fill,
          border: `2px solid ${colors.border}`,
          borderRadius: 4,
          padding: 8,
          fontSize: 14,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'flex-start',
          color: colors.text,
          lineHeight: 1.25,
          wordWrap: 'break-word',
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
              fontSize: 14,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              color: colors.text,
              lineHeight: 1.25,
              padding: 0,
              margin: 0,
            }}
          />
        ) : (
          <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {shape.props.text || <span style={{ opacity: 0.5 }}>Double-click to edit</span>}
          </span>
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
      return { text: '', w: defaultWidth, h: defaultHeight } as T['props']
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

// Create all sticky shape utils
export const EventStickyShapeUtil = createStickyShapeUtil<EventStickyShape>(
  'event-sticky',
  SHAPE_COLORS.event,
  DEFAULT_STICKY_HEIGHT
)

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
