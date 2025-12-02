import { useState, useCallback, useEffect, useRef } from 'react'
import {
  ShapeUtil,
  TLBaseShape,
  HTMLContainer,
  Rectangle2d,
  T,
  RecordPropsType,
  resizeBox,
  TLResizeInfo,
  useEditor,
  useValue,
  TLShape,
} from 'tldraw'

// Theme area props
const themeAreaProps = {
  w: T.number,
  h: T.number,
  name: T.string,
}

type ThemeAreaProps = RecordPropsType<typeof themeAreaProps>
type ThemeAreaShape = TLBaseShape<'theme-area', ThemeAreaProps>

// Theme area background - renders BELOW child shapes
function ThemeAreaBackground({ shape }: { shape: ThemeAreaShape }) {
  return (
    <HTMLContainer>
      <div
        style={{
          width: shape.props.w,
          height: shape.props.h,
          backgroundColor: 'rgba(226, 232, 240, 0.3)',
          borderRadius: 8,
        }}
      />
    </HTMLContainer>
  )
}

// Theme area foreground - renders ABOVE child shapes (just border and label)
function EditableThemeAreaComponent({ shape }: { shape: ThemeAreaShape }) {
  const editor = useEditor()

  const isEditing = useValue(
    'isEditing',
    () => editor.getEditingShapeId() === shape.id,
    [editor, shape.id]
  )

  const [name, setName] = useState(shape.props.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing) {
      setName(shape.props.name)
    }
  }, [shape.props.name, isEditing])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleBlur = useCallback(() => {
    if (name !== shape.props.name) {
      editor.updateShape({
        id: shape.id,
        type: shape.type,
        props: { name },
      })
    }
    editor.setEditingShape(null)
  }, [editor, shape.id, shape.type, shape.props.name, name])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setName(shape.props.name)
      editor.setEditingShape(null)
      e.stopPropagation()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleBlur()
    }
    e.stopPropagation()
  }, [shape.props.name, handleBlur, editor])

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
          border: '2px dashed #94a3b8',
          borderRadius: 8,
          position: 'relative',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 12,
            fontSize: 14,
            fontWeight: 600,
            color: '#475569',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            pointerEvents: 'auto',
          }}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                border: '1px solid #94a3b8',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 14,
                fontWeight: 600,
                color: '#475569',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                background: 'white',
                outline: 'none',
                minWidth: 100,
              }}
            />
          ) : (
            shape.props.name || <span style={{ color: '#94a3b8' }}>Theme name</span>
          )}
        </div>
      </div>
    </HTMLContainer>
  )
}

// Theme Area (Rectangular grouping zone)
export class ThemeAreaShapeUtil extends ShapeUtil<ThemeAreaShape> {
  static override type = 'theme-area' as const
  static override props = themeAreaProps

  override canEdit = () => true
  override canResize = () => true

  getDefaultProps(): ThemeAreaShape['props'] {
    return { w: 400, h: 300, name: 'New Theme' }
  }

  getGeometry(shape: ThemeAreaShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: ThemeAreaShape) {
    return <EditableThemeAreaComponent shape={shape} />
  }

  backgroundComponent(shape: ThemeAreaShape) {
    return <ThemeAreaBackground shape={shape} />
  }

  indicator(shape: ThemeAreaShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={8} />
  }

  override onResize(shape: ThemeAreaShape, info: TLResizeInfo<ThemeAreaShape>) {
    return resizeBox(shape, info)
  }

  // When shapes are first dragged into this theme, reparent them
  // Using onDragShapesIn (fires once on entry) instead of onDragShapesOver (fires repeatedly)
  override onDragShapesIn = (
    shape: ThemeAreaShape,
    shapes: TLShape[]
  ) => {
    // Filter to shapes that need reparenting
    const shapesToReparent = shapes.filter(
      (s) => s.parentId !== shape.id && s.type !== 'theme-area'
    )

    // Don't allow theme areas to be nested
    if (shapes.some((s) => this.editor.hasAncestor(shape, s.id))) return

    if (shapesToReparent.length > 0) {
      this.editor.reparentShapes(shapesToReparent, shape.id)
    }
  }

  // When shapes are dragged out, reparent them back to the page
  override onDragShapesOut = (
    shape: ThemeAreaShape,
    shapes: TLShape[],
    info: { nextDraggingOverShapeId?: string | null }
  ) => {
    // Only reparent back to page if not being dragged to another container
    if (info.nextDraggingOverShapeId) return

    const shapesToReparent = shapes.filter(
      (s) => s.parentId === shape.id && s.type !== 'theme-area'
    )

    if (shapesToReparent.length > 0) {
      this.editor.reparentShapes(shapesToReparent, this.editor.getCurrentPageId())
    }
  }

  // Provide background for children so they render on top
  providesBackgroundForChildren = () => true
}
