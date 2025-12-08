import type { Editor, TLShape } from 'tldraw'

interface ShapeWithPosition {
  x: number
  props: { w: number }
}

export const doesLineOverlapEvent = (
  line: ShapeWithPosition,
  event: ShapeWithPosition
): boolean => {
  const lineRight = line.x + line.props.w
  const eventRight = event.x + event.props.w
  return line.x <= eventRight && lineRight >= event.x
}

export const findEventsUnderLine = (
  editor: Editor,
  lineShape: TLShape
): TLShape[] => {
  const events = editor.getCurrentPageShapes().filter((s) => s.type === 'event-sticky')
  return events.filter((event) => doesLineOverlapEvent(lineShape as ShapeWithPosition, event as ShapeWithPosition))
}

export const findLinesOverEvent = (
  editor: Editor,
  eventShape: TLShape
): TLShape[] => {
  const lines = editor.getCurrentPageShapes().filter((s) => s.type === 'vertical-line')
  return lines.filter((line) => doesLineOverlapEvent(line as ShapeWithPosition, eventShape as ShapeWithPosition))
}

export const isEventPivotal = (editor: Editor, eventShape: TLShape): boolean =>
  findLinesOverEvent(editor, eventShape).length > 0

const updateAllEventsPivotalState = (editor: Editor) => {
  const allEvents = editor.getCurrentPageShapes().filter((s) => s.type === 'event-sticky')

  for (const event of allEvents) {
    const shouldBePivotal = isEventPivotal(editor, event)
    const currentlyPivotal = (event.props as { isPivotal?: boolean }).isPivotal ?? false

    if (shouldBePivotal !== currentlyPivotal) {
      editor.updateShape({
        id: event.id,
        type: event.type,
        props: { isPivotal: shouldBePivotal },
      })
    }
  }
}

const updateSingleEventPivotalState = (editor: Editor, eventShape: TLShape) => {
  const shouldBePivotal = isEventPivotal(editor, eventShape)
  const currentlyPivotal = (eventShape.props as { isPivotal?: boolean }).isPivotal ?? false

  if (shouldBePivotal !== currentlyPivotal) {
    editor.updateShape({
      id: eventShape.id,
      type: eventShape.type,
      props: { isPivotal: shouldBePivotal },
    })
  }
}

const createShapeCreatedHandler = (editor: Editor) => (shape: TLShape) => {
  if (shape.type === 'vertical-line') {
    updateAllEventsPivotalState(editor)
  }
  if (shape.type === 'event-sticky') {
    updateSingleEventPivotalState(editor, shape)
  }
}

const createShapeChangedHandler = (editor: Editor) => (_prev: TLShape, next: TLShape) => {
  if (next.type === 'vertical-line') {
    updateAllEventsPivotalState(editor)
  }
  if (next.type === 'event-sticky') {
    updateSingleEventPivotalState(editor, next)
  }
}

const createShapeDeletedHandler = (editor: Editor) => (shape: TLShape) => {
  if (shape.type === 'vertical-line') {
    updateAllEventsPivotalState(editor)
  }
}

export const registerPivotalSideEffects = (editor: Editor): void => {
  editor.sideEffects.registerAfterCreateHandler('shape', createShapeCreatedHandler(editor))
  editor.sideEffects.registerAfterChangeHandler('shape', createShapeChangedHandler(editor))
  editor.sideEffects.registerAfterDeleteHandler('shape', createShapeDeletedHandler(editor))
}
