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

// Color configurations matching EventStormer
const COLORS = {
  event: { fill: '#fed7aa', border: '#fdba74', text: '#1e293b' },
  hotspot: { fill: '#fecaca', border: '#fca5a5', text: '#1e293b' },
  person: { fill: '#ffef00', border: '#fde047', text: '#1e293b' },
  system: { fill: '#fce7f3', border: '#fbcfe8', text: '#1e293b' },
  opportunity: { fill: '#bbf7d0', border: '#86efac', text: '#1e293b' },
  glossary: { fill: '#1e293b', border: '#334155', text: '#ffffff' },
  command: { fill: '#bfdbfe', border: '#93c5fd', text: '#1e293b' },
  policy: { fill: '#c4b5fd', border: '#a78bfa', text: '#1e293b' },
  aggregate: { fill: '#fef9c3', border: '#fef08a', text: '#1e293b' },
  readmodel: { fill: '#bbf7d0', border: '#86efac', text: '#1e293b' },
}

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
  defaultHeight: number = 100,
  defaultWidth: number = 120
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
  COLORS.event,
  100
)

export const HotspotStickyShapeUtil = createStickyShapeUtil<HotspotStickyShape>(
  'hotspot-sticky',
  COLORS.hotspot,
  100
)

export const PersonStickyShapeUtil = createStickyShapeUtil<PersonStickyShape>(
  'person-sticky',
  COLORS.person,
  50
)

export const SystemStickyShapeUtil = createStickyShapeUtil<SystemStickyShape>(
  'system-sticky',
  COLORS.system,
  100,
  240
)

export const OpportunityStickyShapeUtil = createStickyShapeUtil<OpportunityStickyShape>(
  'opportunity-sticky',
  COLORS.opportunity,
  100
)

export const GlossaryStickyShapeUtil = createStickyShapeUtil<GlossaryStickyShape>(
  'glossary-sticky',
  COLORS.glossary,
  100
)

export const CommandStickyShapeUtil = createStickyShapeUtil<CommandStickyShape>(
  'command-sticky',
  COLORS.command,
  100
)

export const PolicyStickyShapeUtil = createStickyShapeUtil<PolicyStickyShape>(
  'policy-sticky',
  COLORS.policy,
  100,
  240
)

export const AggregateStickyShapeUtil = createStickyShapeUtil<AggregateStickyShape>(
  'aggregate-sticky',
  COLORS.aggregate,
  100,
  240
)

export const ReadModelStickyShapeUtil = createStickyShapeUtil<ReadModelStickyShape>(
  'readmodel-sticky',
  COLORS.readmodel,
  100
)
