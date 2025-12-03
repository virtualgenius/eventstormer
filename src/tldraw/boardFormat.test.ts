import { describe, it, expect } from 'vitest'
import { convertBoardToShapes, isEventStormerBoardFormat, EventStormerBoard } from './boardFormat'

describe('isEventStormerBoardFormat', () => {
  it('returns true for board format with stickies array', () => {
    const boardData = {
      id: 'demo-board',
      name: 'Test Board',
      stickies: [],
    }
    expect(isEventStormerBoardFormat(boardData)).toBe(true)
  })

  it('returns false for tldraw snapshot format with store', () => {
    const tldrawData = {
      store: {
        'shape:abc': { id: 'shape:abc', type: 'event-sticky' }
      }
    }
    expect(isEventStormerBoardFormat(tldrawData)).toBe(false)
  })
})

describe('convertBoardToShapes', () => {
  it('converts event sticky to event-sticky shape', () => {
    const boardData: EventStormerBoard = {
      stickies: [
        {
          id: 'xdn9hvs0',
          kind: 'event',
          text: 'User clicked button',
          x: 100,
          y: 200,
        }
      ],
    }

    const shapes = convertBoardToShapes(boardData)

    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({
      type: 'event-sticky',
      x: 100,
      y: 200,
      props: {
        text: 'User clicked button',
        w: 120,
        h: 100,
      }
    })
  })

  it('converts hotspot sticky to hotspot-sticky shape', () => {
    const boardData: EventStormerBoard = {
      stickies: [
        {
          id: 'abc123',
          kind: 'hotspot',
          text: 'Problem here',
          x: 50,
          y: 75,
        }
      ],
    }

    const shapes = convertBoardToShapes(boardData)

    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({
      type: 'hotspot-sticky',
      x: 50,
      y: 75,
      props: {
        text: 'Problem here',
        w: 120,
        h: 100,
      }
    })
  })

  it('converts person sticky with half height', () => {
    const boardData: EventStormerBoard = {
      stickies: [
        {
          id: 'person1',
          kind: 'person',
          text: 'Alberto',
          x: 200,
          y: 100,
        }
      ],
    }

    const shapes = convertBoardToShapes(boardData)

    expect(shapes[0]).toMatchObject({
      type: 'person-sticky',
      props: {
        text: 'Alberto',
        w: 120,
        h: 50,
      }
    })
  })

  it('converts system sticky with wide width and full height', () => {
    const boardData: EventStormerBoard = {
      stickies: [
        {
          id: 'sys1',
          kind: 'system',
          text: 'EventPizza.com',
          x: 300,
          y: 150,
        }
      ],
    }

    const shapes = convertBoardToShapes(boardData)

    expect(shapes[0]).toMatchObject({
      type: 'system-sticky',
      props: {
        w: 240,
        h: 100,
      }
    })
  })

  it('converts command sticky to command-sticky shape', () => {
    const boardData: EventStormerBoard = {
      stickies: [
        {
          id: 'cmd1',
          kind: 'command',
          text: 'Place Order',
          x: 100,
          y: 200,
        }
      ],
    }

    const shapes = convertBoardToShapes(boardData)

    expect(shapes[0]).toMatchObject({
      type: 'command-sticky',
      props: {
        text: 'Place Order',
        w: 120,
        h: 100,
      }
    })
  })

  it('converts policy sticky with wide width', () => {
    const boardData: EventStormerBoard = {
      stickies: [
        {
          id: 'pol1',
          kind: 'policy',
          text: 'Confirmation policy: Whenever we receive an order we send a confirmation message',
          x: 400,
          y: 200,
        }
      ],
    }

    const shapes = convertBoardToShapes(boardData)

    expect(shapes[0]).toMatchObject({
      type: 'policy-sticky',
      props: {
        w: 240,
        h: 100,
      }
    })
  })

  it('converts readmodel sticky to readmodel-sticky shape', () => {
    const boardData: EventStormerBoard = {
      stickies: [
        {
          id: 'rm1',
          kind: 'readmodel',
          text: 'Online Menu: prices, pizzas, ingredients',
          x: 50,
          y: 400,
        }
      ],
    }

    const shapes = convertBoardToShapes(boardData)

    expect(shapes[0]).toMatchObject({
      type: 'readmodel-sticky',
      props: {
        text: 'Online Menu: prices, pizzas, ingredients',
        w: 120,
        h: 100,
      }
    })
  })

  it('converts opportunity sticky', () => {
    const boardData: EventStormerBoard = {
      stickies: [
        {
          id: 'opp1',
          kind: 'opportunity',
          text: 'Good opportunity',
          x: 400,
          y: 200,
        }
      ],
    }

    const shapes = convertBoardToShapes(boardData)

    expect(shapes[0].type).toBe('opportunity-sticky')
  })

  it('converts glossary sticky', () => {
    const boardData: EventStormerBoard = {
      stickies: [
        {
          id: 'gloss1',
          kind: 'glossary',
          text: 'Definition here',
          x: 500,
          y: 250,
        }
      ],
    }

    const shapes = convertBoardToShapes(boardData)

    expect(shapes[0].type).toBe('glossary-sticky')
  })

  it('converts vertical lines', () => {
    const boardData: EventStormerBoard = {
      stickies: [],
      verticals: [
        {
          id: 'vert1',
          x: 500,
          y1: 100,
          y2: 400,
        }
      ],
    }

    const shapes = convertBoardToShapes(boardData)

    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({
      type: 'vertical-line',
      x: 500,
      y: 100,
      props: {
        w: 8,
        h: 300,
      }
    })
  })

  it('converts horizontal lanes', () => {
    const boardData: EventStormerBoard = {
      stickies: [],
      lanes: [
        {
          id: 'lane1',
          y: 300,
          x1: 100,
          x2: 900,
        }
      ],
    }

    const shapes = convertBoardToShapes(boardData)

    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({
      type: 'horizontal-lane',
      x: 100,
      y: 300,
      props: {
        w: 800,
        h: 8,
      }
    })
  })

  it('converts labels', () => {
    const boardData: EventStormerBoard = {
      stickies: [],
      labels: [
        {
          id: 'label1',
          text: 'Phase 1',
          x: 150,
          y: 50,
        }
      ],
    }

    const shapes = convertBoardToShapes(boardData)

    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({
      type: 'label',
      x: 150,
      y: 50,
      props: {
        text: 'Phase 1',
      }
    })
  })

  it('converts theme areas', () => {
    const boardData: EventStormerBoard = {
      stickies: [],
      themes: [
        {
          id: 'theme1',
          name: 'User Onboarding',
          x: 100,
          y: 200,
          width: 600,
          height: 400,
        }
      ],
    }

    const shapes = convertBoardToShapes(boardData)

    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({
      type: 'theme-area',
      x: 100,
      y: 200,
      props: {
        name: 'User Onboarding',
        w: 600,
        h: 400,
      }
    })
  })

  it('converts a full board with all element types', () => {
    const boardData: EventStormerBoard = {
      stickies: [
        { id: 's1', kind: 'event', text: 'Event 1', x: 100, y: 100 },
        { id: 's2', kind: 'hotspot', text: 'Hotspot 1', x: 200, y: 100 },
        { id: 's3', kind: 'command', text: 'Command 1', x: 300, y: 100 },
        { id: 's4', kind: 'policy', text: 'Policy 1', x: 400, y: 100 },
        { id: 's5', kind: 'readmodel', text: 'ReadModel 1', x: 500, y: 100 },
      ],
      verticals: [
        { id: 'v1', x: 300, y1: 50, y2: 350 }
      ],
      lanes: [
        { id: 'l1', y: 250, x1: 50, x2: 550 }
      ],
      labels: [
        { id: 'lb1', text: 'Label', x: 50, y: 20 }
      ],
      themes: [
        { id: 't1', name: 'Theme', x: 0, y: 0, width: 800, height: 600 }
      ],
    }

    const shapes = convertBoardToShapes(boardData)

    expect(shapes).toHaveLength(9)

    const types = shapes.map(s => s.type)
    expect(types).toContain('event-sticky')
    expect(types).toContain('hotspot-sticky')
    expect(types).toContain('command-sticky')
    expect(types).toContain('policy-sticky')
    expect(types).toContain('readmodel-sticky')
    expect(types).toContain('vertical-line')
    expect(types).toContain('horizontal-lane')
    expect(types).toContain('label')
    expect(types).toContain('theme-area')
  })
})
