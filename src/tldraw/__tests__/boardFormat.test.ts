import { describe, it, expect } from 'vitest'
import {
  extractStoreFromSnapshot,
  filterShapeRecords,
  parseTldrawSnapshot,
  TldrawShapeRecord,
} from '../boardFormat'

describe('extractStoreFromSnapshot', () => {
  it('returns null for null input', () => {
    expect(extractStoreFromSnapshot(null)).toBeNull()
  })

  it('returns null for non-object input', () => {
    expect(extractStoreFromSnapshot('string')).toBeNull()
    expect(extractStoreFromSnapshot(123)).toBeNull()
  })

  it('extracts store from data.store', () => {
    const data = {
      store: { 'shape:123': { id: 'shape:123', typeName: 'shape' } }
    }
    const result = extractStoreFromSnapshot(data)
    expect(result).toEqual(data.store)
  })

  it('extracts store from data.document.store', () => {
    const data = {
      document: {
        store: { 'shape:123': { id: 'shape:123', typeName: 'shape' } }
      }
    }
    const result = extractStoreFromSnapshot(data)
    expect(result).toEqual(data.document.store)
  })

  it('recognizes direct store format with shape: prefix', () => {
    const data = {
      'shape:123': { id: 'shape:123', typeName: 'shape' }
    }
    const result = extractStoreFromSnapshot(data)
    expect(result).toEqual(data)
  })

  it('recognizes direct store format with page: prefix', () => {
    const data = {
      'page:page': { id: 'page:page', typeName: 'page' }
    }
    const result = extractStoreFromSnapshot(data)
    expect(result).toEqual(data)
  })

  it('recognizes direct store format with document: prefix', () => {
    const data = {
      'document:document': { id: 'document:document', typeName: 'document' }
    }
    const result = extractStoreFromSnapshot(data)
    expect(result).toEqual(data)
  })

  it('returns null for unrecognized format', () => {
    const data = { foo: 'bar', baz: 123 }
    expect(extractStoreFromSnapshot(data)).toBeNull()
  })
})

describe('filterShapeRecords', () => {
  it('filters out document records', () => {
    const store = {
      'document:doc': { id: 'document:doc', typeName: 'document' },
      'shape:123': { id: 'shape:123', typeName: 'shape', type: 'event-sticky', x: 0, y: 0, props: {} },
    }
    const result = filterShapeRecords(store)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('shape:123')
  })

  it('filters out page records', () => {
    const store = {
      'page:page': { id: 'page:page', typeName: 'page' },
      'shape:123': { id: 'shape:123', typeName: 'shape', type: 'event-sticky', x: 0, y: 0, props: {} },
    }
    const result = filterShapeRecords(store)
    expect(result).toHaveLength(1)
  })

  it('filters out camera records', () => {
    const store = {
      'camera:camera': { id: 'camera:camera', typeName: 'camera' },
      'shape:123': { id: 'shape:123', typeName: 'shape', type: 'event-sticky', x: 0, y: 0, props: {} },
    }
    const result = filterShapeRecords(store)
    expect(result).toHaveLength(1)
  })

  it('filters out instance records', () => {
    const store = {
      'instance:inst': { id: 'instance:inst', typeName: 'instance' },
      'shape:123': { id: 'shape:123', typeName: 'shape', type: 'event-sticky', x: 0, y: 0, props: {} },
    }
    const result = filterShapeRecords(store)
    expect(result).toHaveLength(1)
  })

  it('filters out instance_page_state records', () => {
    const store = {
      'instance_page_state:state': { id: 'instance_page_state:state', typeName: 'instance_page_state' },
      'shape:123': { id: 'shape:123', typeName: 'shape', type: 'event-sticky', x: 0, y: 0, props: {} },
    }
    const result = filterShapeRecords(store)
    expect(result).toHaveLength(1)
  })

  it('filters out pointer records', () => {
    const store = {
      'pointer:pointer': { id: 'pointer:pointer', typeName: 'pointer' },
      'shape:123': { id: 'shape:123', typeName: 'shape', type: 'event-sticky', x: 0, y: 0, props: {} },
    }
    const result = filterShapeRecords(store)
    expect(result).toHaveLength(1)
  })

  it('keeps multiple shape records', () => {
    const store = {
      'shape:1': { id: 'shape:1', typeName: 'shape', type: 'event-sticky', x: 0, y: 0, props: {} },
      'shape:2': { id: 'shape:2', typeName: 'shape', type: 'hotspot-sticky', x: 100, y: 100, props: {} },
      'shape:3': { id: 'shape:3', typeName: 'shape', type: 'person-sticky', x: 200, y: 200, props: {} },
    }
    const result = filterShapeRecords(store)
    expect(result).toHaveLength(3)
  })

  it('preserves shape properties', () => {
    const shape: TldrawShapeRecord = {
      id: 'shape:123',
      typeName: 'shape',
      type: 'event-sticky',
      x: 100,
      y: 200,
      rotation: 0.5,
      props: { text: 'Hello', w: 120, h: 100 },
      parentId: 'page:page',
      index: 'a1',
    }
    const store = { 'shape:123': shape }
    const result = filterShapeRecords(store)
    expect(result[0]).toEqual(shape)
  })

  it('handles non-object values gracefully', () => {
    const store = {
      'shape:123': { id: 'shape:123', typeName: 'shape', type: 'event-sticky', x: 0, y: 0, props: {} },
      'invalid': null,
      'also-invalid': 'string',
    }
    const result = filterShapeRecords(store as Record<string, unknown>)
    expect(result).toHaveLength(1)
  })
})

describe('parseTldrawSnapshot', () => {
  it('returns error for invalid format', () => {
    const result = parseTldrawSnapshot({ foo: 'bar' })
    expect(result.error).toBe('Invalid snapshot format: missing store data')
    expect(result.shapes).toHaveLength(0)
  })

  it('parses valid snapshot with store', () => {
    const data = {
      store: {
        'shape:1': { id: 'shape:1', typeName: 'shape', type: 'event-sticky', x: 0, y: 0, props: {} },
        'page:page': { id: 'page:page', typeName: 'page' },
      }
    }
    const result = parseTldrawSnapshot(data)
    expect(result.error).toBeUndefined()
    expect(result.shapes).toHaveLength(1)
    expect(result.shapes[0].id).toBe('shape:1')
  })

  it('parses valid snapshot with document.store', () => {
    const data = {
      document: {
        store: {
          'shape:1': { id: 'shape:1', typeName: 'shape', type: 'event-sticky', x: 0, y: 0, props: {} },
        }
      }
    }
    const result = parseTldrawSnapshot(data)
    expect(result.error).toBeUndefined()
    expect(result.shapes).toHaveLength(1)
  })

  it('parses direct store format', () => {
    const data = {
      'shape:1': { id: 'shape:1', typeName: 'shape', type: 'event-sticky', x: 0, y: 0, props: {} },
      'shape:2': { id: 'shape:2', typeName: 'shape', type: 'hotspot-sticky', x: 100, y: 100, props: {} },
    }
    const result = parseTldrawSnapshot(data)
    expect(result.error).toBeUndefined()
    expect(result.shapes).toHaveLength(2)
  })

  it('returns empty shapes for empty store', () => {
    const data = { store: {} }
    const result = parseTldrawSnapshot(data)
    expect(result.error).toBeUndefined()
    expect(result.shapes).toHaveLength(0)
  })
})
