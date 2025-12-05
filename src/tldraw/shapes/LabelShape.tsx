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

// Label props (w/h kept for schema compatibility but not used)
const labelProps = {
  text: T.string,
  w: T.number,
  h: T.number,
}

type LabelProps = RecordPropsType<typeof labelProps>
type LabelShape = TLBaseShape<'label', LabelProps>

const MIN_LABEL_WIDTH = 60
const MIN_LABEL_DISPLAY_WIDTH = 40
const LABEL_FONT_SIZE = 16
const LABEL_FONT_WEIGHT = 500
const LABEL_HEIGHT = 24
const LABEL_WIDTH_PADDING = 8

// Editable label component
function EditableLabelComponent({ shape }: { shape: LabelShape }) {
  const editor = useEditor()

  const isEditing = useValue(
    'isEditing',
    () => editor.getEditingShapeId() === shape.id,
    [editor, shape.id]
  )

  const [text, setText] = useState(shape.props.text)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing) {
      setText(shape.props.text)
    }
  }, [shape.props.text, isEditing])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
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
    } else if (e.key === 'Enter') {
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
          fontSize: 16,
          fontWeight: 500,
          color: '#1e293b',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              border: 'none',
              borderBottom: '2px solid #94a3b8',
              padding: '2px 0',
              fontSize: 16,
              fontWeight: 500,
              color: '#1e293b',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              background: 'transparent',
              outline: 'none',
              minWidth: MIN_LABEL_WIDTH,
            }}
          />
        ) : (
          shape.props.text || <span style={{ color: '#94a3b8' }}>Label</span>
        )}
      </div>
    </HTMLContainer>
  )
}

// Measure text width helper
function measureText(text: string, fontSize: number, fontWeight: number): number {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return MIN_LABEL_WIDTH
  ctx.font = `${fontWeight} ${fontSize}px system-ui, -apple-system, sans-serif`
  return ctx.measureText(text || 'Label').width
}

// Label (Free-form text annotation)
export class LabelShapeUtil extends ShapeUtil<LabelShape> {
  static override type = 'label' as const
  static override props = labelProps

  override canEdit = () => true

  getDefaultProps(): LabelShape['props'] {
    return { text: 'Label', w: 100, h: 24 }
  }

  getGeometry(shape: LabelShape) {
    const width = Math.max(MIN_LABEL_DISPLAY_WIDTH, measureText(shape.props.text, LABEL_FONT_SIZE, LABEL_FONT_WEIGHT) + LABEL_WIDTH_PADDING)
    return new Rectangle2d({
      width,
      height: LABEL_HEIGHT,
      isFilled: false,
    })
  }

  component(shape: LabelShape) {
    return <EditableLabelComponent shape={shape} />
  }

  indicator(shape: LabelShape) {
    const width = Math.max(MIN_LABEL_DISPLAY_WIDTH, measureText(shape.props.text, LABEL_FONT_SIZE, LABEL_FONT_WEIGHT) + LABEL_WIDTH_PADDING)
    return <rect width={width} height={LABEL_HEIGHT} />
  }
}
