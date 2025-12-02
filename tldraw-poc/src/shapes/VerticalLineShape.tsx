import {
  ShapeUtil,
  TLBaseShape,
  HTMLContainer,
  Rectangle2d,
  T,
  RecordProps,
  TLOnResizeHandler,
  resizeBox,
} from 'tldraw'

// Vertical line props
type VerticalLineProps = {
  w: number
  h: number
  label: string
}

type VerticalLineShape = TLBaseShape<'vertical-line', VerticalLineProps>

const verticalLineProps: RecordProps<VerticalLineProps> = {
  w: T.number,
  h: T.number,
  label: T.string,
}

// Vertical Line (Blue pivotal boundary)
export class VerticalLineShapeUtil extends ShapeUtil<VerticalLineShape> {
  static override type = 'vertical-line' as const
  static override props = verticalLineProps

  getDefaultProps(): VerticalLineShape['props'] {
    return { w: 8, h: 400, label: '' }
  }

  getGeometry(shape: VerticalLineShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: VerticalLineShape) {
    return (
      <HTMLContainer>
        <div
          style={{
            width: shape.props.w,
            height: shape.props.h,
            backgroundColor: '#cbd5e1', // Slate-300
            borderRadius: 4,
            position: 'relative',
          }}
        >
          {shape.props.label && (
            <div
              style={{
                position: 'absolute',
                top: -24,
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                fontSize: 12,
                color: '#475569',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {shape.props.label}
            </div>
          )}
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: VerticalLineShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={4} />
  }

  // Only allow vertical resizing (height), keep width fixed
  override onResize: TLOnResizeHandler<VerticalLineShape> = (shape, info) => {
    const { scaleY } = info
    return {
      props: {
        w: shape.props.w, // Keep width fixed
        h: Math.max(50, shape.props.h * scaleY),
      },
    }
  }
}
