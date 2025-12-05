import { describe, it, expect, beforeEach } from 'vitest'
import * as Y from 'yjs'
import { TLRecord, TLStoreEventInfo, TLShapeId } from 'tldraw'
import {
  ensureEssentialRecordsExistInYjs,
  syncStoreChangesToYjs,
} from '../useYjsStore'

describe('ensureEssentialRecordsExistInYjs', () => {
  let yDoc: Y.Doc
  let yRecords: Y.Map<TLRecord>

  const expectedPageRecord = {
    id: 'page:page',
    typeName: 'page',
    name: 'Page 1',
    index: 'a1',
    meta: {},
  }

  const expectedDocumentRecord = {
    id: 'document:document',
    typeName: 'document',
    gridSize: 10,
    name: '',
    meta: {},
  }

  beforeEach(() => {
    yDoc = new Y.Doc()
    yRecords = yDoc.getMap<TLRecord>('tldraw-records')
  })

  it('adds page record when missing', () => {
    ensureEssentialRecordsExistInYjs(yDoc, yRecords)

    expect(yRecords.has('page:page')).toBe(true)
    expect(yRecords.get('page:page')).toEqual(expectedPageRecord)
  })

  it('adds document record when missing', () => {
    ensureEssentialRecordsExistInYjs(yDoc, yRecords)

    expect(yRecords.has('document:document')).toBe(true)
    expect(yRecords.get('document:document')).toEqual(expectedDocumentRecord)
  })

  it('does not overwrite existing page record', () => {
    const existingPage = { ...expectedPageRecord, name: 'Existing Page' } as TLRecord
    yRecords.set('page:page', existingPage)

    ensureEssentialRecordsExistInYjs(yDoc, yRecords)

    expect(yRecords.get('page:page')).toEqual(existingPage)
  })

  it('does not overwrite existing document record', () => {
    const existingDoc = { ...expectedDocumentRecord, gridSize: 20 } as TLRecord
    yRecords.set('document:document', existingDoc)

    ensureEssentialRecordsExistInYjs(yDoc, yRecords)

    expect(yRecords.get('document:document')).toEqual(existingDoc)
  })

  it('does nothing when both records already exist', () => {
    yRecords.set('page:page', expectedPageRecord as TLRecord)
    yRecords.set('document:document', expectedDocumentRecord as TLRecord)

    ensureEssentialRecordsExistInYjs(yDoc, yRecords)

    // Records remain unchanged
    expect(yRecords.get('page:page')).toEqual(expectedPageRecord)
    expect(yRecords.get('document:document')).toEqual(expectedDocumentRecord)
  })

  it('adds only missing record when one exists', () => {
    yRecords.set('page:page', expectedPageRecord as TLRecord)

    ensureEssentialRecordsExistInYjs(yDoc, yRecords)

    expect(yRecords.has('document:document')).toBe(true)
    expect(yRecords.get('document:document')).toEqual(expectedDocumentRecord)
  })
})

const mockShape = {
  id: 'shape:123', type: 'event-sticky', x: 100, y: 200, props: { text: 'Test event' },
} as unknown as TLRecord

function createEvent(source: 'user' | 'remote', changes: Partial<TLStoreEventInfo['changes']>): TLStoreEventInfo {
  return { source, changes: { added: {}, updated: {}, removed: {}, ...changes } }
}

describe('syncStoreChangesToYjs', () => {
  let yDoc: Y.Doc
  let yRecords: Y.Map<TLRecord>
  beforeEach(() => { yDoc = new Y.Doc(); yRecords = yDoc.getMap<TLRecord>('tldraw-records') })

  it('adds new records to Yjs', () => {
    const event = createEvent('user', { added: { ['shape:123' as TLShapeId]: mockShape } })
    syncStoreChangesToYjs(yDoc, yRecords, event)
    expect(yRecords.has('shape:123')).toBe(true)
    expect(yRecords.get('shape:123')).toEqual(mockShape)
  })

  it('updates existing records in Yjs', () => {
    yRecords.set('shape:123', mockShape)
    const updatedShape = { ...mockShape, x: 300 } as TLRecord
    const event = createEvent('user', { updated: { ['shape:123' as TLShapeId]: [mockShape, updatedShape] } })
    syncStoreChangesToYjs(yDoc, yRecords, event)
    expect(yRecords.get('shape:123')).toEqual(updatedShape)
  })

  it('removes records from Yjs', () => {
    yRecords.set('shape:123', mockShape)
    const event = createEvent('user', { removed: { ['shape:123' as TLShapeId]: mockShape } })
    syncStoreChangesToYjs(yDoc, yRecords, event)
    expect(yRecords.has('shape:123')).toBe(false)
  })

  it('ignores remote source events', () => {
    const event = createEvent('remote', { added: { ['shape:123' as TLShapeId]: mockShape } })
    syncStoreChangesToYjs(yDoc, yRecords, event)
    expect(yRecords.has('shape:123')).toBe(false)
  })

  it('handles multiple changes in single event', () => {
    const shape1 = { ...mockShape, id: 'shape:1' } as TLRecord
    const shape3 = { ...mockShape, id: 'shape:3' } as TLRecord
    yRecords.set('shape:3', shape3)
    const event = createEvent('user', {
      added: { ['shape:1' as TLShapeId]: shape1 },
      removed: { ['shape:3' as TLShapeId]: shape3 },
    })
    syncStoreChangesToYjs(yDoc, yRecords, event)
    expect(yRecords.has('shape:1')).toBe(true)
    expect(yRecords.has('shape:3')).toBe(false)
  })
})
