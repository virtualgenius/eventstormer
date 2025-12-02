import { describe, it, expect } from 'vitest'
import { convertLegacyBoardToShapes, isLegacyBoardFormat, LegacyBoard } from './importLegacyBoard'

describe('isLegacyBoardFormat', () => {
  it('returns true for legacy format with stickies array', () => {
    const legacyData = {
      id: 'demo-board',
      name: 'Test Board',
      stickies: [],
    }
    expect(isLegacyBoardFormat(legacyData)).toBe(true)
  })

  it('returns false for tldraw snapshot format with store', () => {
    const tldrawData = {
      store: {
        'shape:abc': { id: 'shape:abc', type: 'event-sticky' }
      }
    }
    expect(isLegacyBoardFormat(tldrawData)).toBe(false)
  })
})

describe('convertLegacyBoardToShapes', () => {
  it('converts event sticky to event-sticky shape', () => {
    const legacyData: LegacyBoard = {
      stickies: [
        {
          id: 'xdn9hvs0',
          kind: 'event',
          text: 'User clicked button',
          x: 100,
          y: 200,
        }
      ],
      verticals: [],
      lanes: [],
      labels: [],
      themes: [],
    }

    const shapes = convertLegacyBoardToShapes(legacyData)

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
    const legacyData: LegacyBoard = {
      stickies: [
        {
          id: 'abc123',
          kind: 'hotspot',
          text: 'Problem here',
          x: 50,
          y: 75,
        }
      ],
      verticals: [],
      lanes: [],
      labels: [],
      themes: [],
    }

    const shapes = convertLegacyBoardToShapes(legacyData)

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
    const legacyData: LegacyBoard = {
      stickies: [
        {
          id: 'person1',
          kind: 'person',
          text: 'Alberto',
          x: 200,
          y: 100,
        }
      ],
      verticals: [],
      lanes: [],
      labels: [],
      themes: [],
    }

    const shapes = convertLegacyBoardToShapes(legacyData)

    expect(shapes[0]).toMatchObject({
      type: 'person-sticky',
      props: {
        text: 'Alberto',
        w: 120,
        h: 50, // Half height for person
      }
    })
  })

  it('converts system sticky with half height', () => {
    const legacyData: LegacyBoard = {
      stickies: [
        {
          id: 'sys1',
          kind: 'system',
          text: 'EventStormer',
          x: 300,
          y: 150,
        }
      ],
      verticals: [],
      lanes: [],
      labels: [],
      themes: [],
    }

    const shapes = convertLegacyBoardToShapes(legacyData)

    expect(shapes[0]).toMatchObject({
      type: 'system-sticky',
      props: {
        h: 50, // Half height for system
      }
    })
  })

  it('converts opportunity sticky', () => {
    const legacyData: LegacyBoard = {
      stickies: [
        {
          id: 'opp1',
          kind: 'opportunity',
          text: 'Good opportunity',
          x: 400,
          y: 200,
        }
      ],
      verticals: [],
      lanes: [],
      labels: [],
      themes: [],
    }

    const shapes = convertLegacyBoardToShapes(legacyData)

    expect(shapes[0].type).toBe('opportunity-sticky')
  })

  it('converts glossary sticky', () => {
    const legacyData: LegacyBoard = {
      stickies: [
        {
          id: 'gloss1',
          kind: 'glossary',
          text: 'Definition here',
          x: 500,
          y: 250,
        }
      ],
      verticals: [],
      lanes: [],
      labels: [],
      themes: [],
    }

    const shapes = convertLegacyBoardToShapes(legacyData)

    expect(shapes[0].type).toBe('glossary-sticky')
  })

  it('converts vertical lines', () => {
    const legacyData: LegacyBoard = {
      stickies: [],
      verticals: [
        {
          id: 'vert1',
          x: 500,
          y1: 100,
          y2: 400,
        }
      ],
      lanes: [],
      labels: [],
      themes: [],
    }

    const shapes = convertLegacyBoardToShapes(legacyData)

    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({
      type: 'vertical-line',
      x: 500,
      y: 100,
      props: {
        w: 8,
        h: 300, // y2 - y1 = 400 - 100
      }
    })
  })

  it('converts horizontal lanes', () => {
    const legacyData: LegacyBoard = {
      stickies: [],
      verticals: [],
      lanes: [
        {
          id: 'lane1',
          y: 300,
          x1: 100,
          x2: 900,
        }
      ],
      labels: [],
      themes: [],
    }

    const shapes = convertLegacyBoardToShapes(legacyData)

    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({
      type: 'horizontal-lane',
      x: 100,
      y: 300,
      props: {
        w: 800, // x2 - x1 = 900 - 100
        h: 8,
      }
    })
  })

  it('converts labels', () => {
    const legacyData: LegacyBoard = {
      stickies: [],
      verticals: [],
      lanes: [],
      labels: [
        {
          id: 'label1',
          text: 'Phase 1',
          x: 150,
          y: 50,
        }
      ],
      themes: [],
    }

    const shapes = convertLegacyBoardToShapes(legacyData)

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
    const legacyData: LegacyBoard = {
      stickies: [],
      verticals: [],
      lanes: [],
      labels: [],
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

    const shapes = convertLegacyBoardToShapes(legacyData)

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
    const legacyData: LegacyBoard = {
      stickies: [
        { id: 's1', kind: 'event', text: 'Event 1', x: 100, y: 100 },
        { id: 's2', kind: 'hotspot', text: 'Hotspot 1', x: 200, y: 100 },
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

    const shapes = convertLegacyBoardToShapes(legacyData)

    expect(shapes).toHaveLength(6)

    const types = shapes.map(s => s.type)
    expect(types).toContain('event-sticky')
    expect(types).toContain('hotspot-sticky')
    expect(types).toContain('vertical-line')
    expect(types).toContain('horizontal-lane')
    expect(types).toContain('label')
    expect(types).toContain('theme-area')
  })
})
