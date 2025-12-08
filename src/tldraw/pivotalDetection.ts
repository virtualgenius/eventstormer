import type { Editor, TLShape, Box } from 'tldraw'

export const doesBoundsOverlap = (
  lineBounds: Box,
  eventBounds: Box
): boolean => {
  return lineBounds.x <= eventBounds.maxX && lineBounds.maxX >= eventBounds.x
}

export const findEventsUnderLine = (
  editor: Editor,
  lineShape: TLShape
): TLShape[] => {
  const lineBounds = editor.getShapePageBounds(lineShape)
  if (!lineBounds) return []

  const events = editor.getCurrentPageShapes().filter((s) => s.type === 'event-sticky')
  return events.filter((event) => {
    const eventBounds = editor.getShapePageBounds(event)
    return eventBounds && doesBoundsOverlap(lineBounds, eventBounds)
  })
}

export const findLinesOverEvent = (
  editor: Editor,
  eventShape: TLShape
): TLShape[] => {
  const eventBounds = editor.getShapePageBounds(eventShape)
  if (!eventBounds) return []

  const lines = editor.getCurrentPageShapes().filter((s) => s.type === 'vertical-line')
  return lines.filter((line) => {
    const lineBounds = editor.getShapePageBounds(line)
    return lineBounds && doesBoundsOverlap(lineBounds, eventBounds)
  })
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
