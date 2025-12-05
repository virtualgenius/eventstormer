import {
  ShapeUtil,
  TLBaseShape,
  HTMLContainer,
  Rectangle2d,
  T,
  RecordPropsType,
  TLResizeInfo,
} from 'tldraw'

// Horizontal lane props
const horizontalLaneProps = {
  w: T.number,
  h: T.number,
  label: T.string,
}

type HorizontalLaneProps = RecordPropsType<typeof horizontalLaneProps>
type HorizontalLaneShape = TLBaseShape<'horizontal-lane', HorizontalLaneProps>

const MIN_LANE_WIDTH = 100

// Horizontal Lane (Swimlane)
export class HorizontalLaneShapeUtil extends ShapeUtil<HorizontalLaneShape> {
  static override type = 'horizontal-lane' as const
  static override props = horizontalLaneProps

  getDefaultProps(): HorizontalLaneShape['props'] {
    return { w: 800, h: 8, label: '' }
  }

  getGeometry(shape: HorizontalLaneShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: HorizontalLaneShape) {
    return (
      <HTMLContainer>
        <div
          style={{
            width: shape.props.w,
            height: shape.props.h,
            backgroundColor: '#e2e8f0', // Slate-200
            borderRadius: 4,
            position: 'relative',
          }}
        >
          {shape.props.label && (
            <div
              style={{
                position: 'absolute',
                top: -20,
                left: 10,
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

  indicator(shape: HorizontalLaneShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={4} />
  }

  // Only allow horizontal resizing (width), keep height fixed
  override onResize(shape: HorizontalLaneShape, info: TLResizeInfo<HorizontalLaneShape>) {
    const { scaleX } = info
    return {
      props: {
        w: Math.max(MIN_LANE_WIDTH, shape.props.w * scaleX),
        h: shape.props.h, // Keep height fixed
      },
    }
  }
}
