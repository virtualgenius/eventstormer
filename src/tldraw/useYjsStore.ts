import { useEffect, useState, useRef } from 'react'
import {
  createTLStore,
  TLRecord,
  TLStoreEventInfo,
  TLStoreWithStatus,
  defaultShapeUtils,
  defaultBindingUtils,
  TLStore,
} from 'tldraw'
import * as Y from 'yjs'
import YProvider from 'y-partyserver/provider'
import {
  EventStickyShapeUtil,
  HotspotStickyShapeUtil,
  PersonStickyShapeUtil,
  SystemStickyShapeUtil,
  OpportunityStickyShapeUtil,
  GlossaryStickyShapeUtil,
  CommandStickyShapeUtil,
  PolicyStickyShapeUtil,
  AggregateStickyShapeUtil,
  ReadModelStickyShapeUtil,
} from './shapes/StickyShapes'
import { VerticalLineShapeUtil } from './shapes/VerticalLineShape'
import { HorizontalLaneShapeUtil } from './shapes/HorizontalLaneShape'
import { ThemeAreaShapeUtil } from './shapes/ThemeAreaShape'
import { LabelShapeUtil } from './shapes/LabelShape'

const customShapeUtils = [
  EventStickyShapeUtil,
  HotspotStickyShapeUtil,
  PersonStickyShapeUtil,
  SystemStickyShapeUtil,
  OpportunityStickyShapeUtil,
  GlossaryStickyShapeUtil,
  CommandStickyShapeUtil,
  PolicyStickyShapeUtil,
  AggregateStickyShapeUtil,
  ReadModelStickyShapeUtil,
  VerticalLineShapeUtil,
  HorizontalLaneShapeUtil,
  ThemeAreaShapeUtil,
  LabelShapeUtil,
]

const DEFAULT_PAGE_RECORD: TLRecord = {
  id: 'page:page' as TLRecord['id'],
  typeName: 'page',
  name: 'Page 1',
  index: 'a1',
  meta: {},
} as unknown as TLRecord

const DEFAULT_DOCUMENT_RECORD: TLRecord = {
  id: 'document:document' as TLRecord['id'],
  typeName: 'document',
  gridSize: 10,
  name: '',
  meta: {},
} as unknown as TLRecord

export function ensureEssentialRecordsExistInYjs(
  yDoc: Y.Doc,
  yRecords: Y.Map<TLRecord>
): void {
  const hasPage = yRecords.has('page:page')
  const hasDocument = yRecords.has('document:document')

  if (hasPage && hasDocument) return

  yDoc.transact(() => {
    if (!hasPage) {
      yRecords.set('page:page', DEFAULT_PAGE_RECORD)
    }
    if (!hasDocument) {
      yRecords.set('document:document', DEFAULT_DOCUMENT_RECORD)
    }
  })
}

export function loadYjsRecordsIntoStore(
  yRecords: Y.Map<TLRecord>,
  store: TLStore
): void {
  store.mergeRemoteChanges(() => {
    const allRecords = Array.from(yRecords.values()) as TLRecord[]
    if (allRecords.length > 0) {
      store.put(allRecords)
    }
  })
}

interface YjsSyncChanges {
  toRemove: TLRecord['id'][]
  toPut: TLRecord[]
}

function collectYjsChanges(
  yRecords: Y.Map<TLRecord>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: Y.YEvent<any>[]
): YjsSyncChanges {
  const toRemove: TLRecord['id'][] = []
  const toPut: TLRecord[] = []

  for (const event of events) {
    if (event instanceof Y.YMapEvent) {
      event.changes.keys.forEach((change, id) => {
        if (change.action === 'add' || change.action === 'update') {
          const record = yRecords.get(id)
          if (record) toPut.push(record)
        } else if (change.action === 'delete') {
          toRemove.push(id as TLRecord['id'])
        }
      })
    }
  }

  return { toRemove, toPut }
}

export function syncYjsChangesToStore(
  yRecords: Y.Map<TLRecord>,
  store: TLStore,
  transaction: Y.Transaction,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: Y.YEvent<any>[]
): void {
  if (transaction.local) return

  const { toRemove, toPut } = collectYjsChanges(yRecords, events)

  store.mergeRemoteChanges(() => {
    if (toRemove.length > 0) store.remove(toRemove)
    if (toPut.length > 0) store.put(toPut)
  })
}

function hasChanges(event: TLStoreEventInfo): boolean {
  return (
    Object.keys(event.changes.added).length > 0 ||
    Object.keys(event.changes.updated).length > 0 ||
    Object.keys(event.changes.removed).length > 0
  )
}

function applyStoreChangesToYjs(yRecords: Y.Map<TLRecord>, event: TLStoreEventInfo): void {
  Object.entries(event.changes.added).forEach(([id, record]) => {
    yRecords.set(id, record)
  })
  Object.entries(event.changes.updated).forEach(([id, [_prev, next]]) => {
    yRecords.set(id, next)
  })
  Object.entries(event.changes.removed).forEach(([id]) => {
    yRecords.delete(id)
  })
}

export function syncStoreChangesToYjs(
  yDoc: Y.Doc,
  yRecords: Y.Map<TLRecord>,
  event: TLStoreEventInfo
): void {
  if (event.source === 'remote' || !hasChanges(event)) return

  yDoc.transact(() => applyStoreChangesToYjs(yRecords, event))
}

export interface YjsStoreOptions {
  roomId: string
  hostUrl?: string
}

export interface YjsStoreResult {
  storeWithStatus: TLStoreWithStatus
  room: YProvider | null
}

function createYjsStore(): TLStore {
  return createTLStore({
    shapeUtils: [...defaultShapeUtils, ...customShapeUtils],
    bindingUtils: defaultBindingUtils,
  })
}

function getCollabHost(hostUrl?: string): string {
  return hostUrl || (import.meta as unknown as { env?: { VITE_COLLAB_HOST?: string } }).env?.VITE_COLLAB_HOST || 'localhost:8800'
}

function setupYjsSync(
  yDoc: Y.Doc,
  yRecords: Y.Map<TLRecord>,
  store: TLStore,
  unsubs: (() => void)[]
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleYjsChange = (events: Y.YEvent<any>[], transaction: Y.Transaction) => {
    syncYjsChangesToStore(yRecords, store, transaction, events)
  }
  yRecords.observeDeep(handleYjsChange)
  unsubs.push(() => yRecords.unobserveDeep(handleYjsChange))

  const handleStoreChange = (event: TLStoreEventInfo) => {
    syncStoreChangesToYjs(yDoc, yRecords, event)
  }
  unsubs.push(store.listen(handleStoreChange, { scope: 'document' }))
}

export function useYjsStore({ roomId, hostUrl }: YjsStoreOptions): YjsStoreResult {
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({ status: 'loading' })
  const [room, setRoom] = useState<YProvider | null>(null)

  const storeRef = useRef<TLStore | null>(null)
  const roomRef = useRef<YProvider | null>(null)
  const yDocRef = useRef<Y.Doc | null>(null)

  useEffect(() => {
    const store = createYjsStore()
    storeRef.current = store

    const yDoc = new Y.Doc()
    yDocRef.current = yDoc
    const yRecords = yDoc.getMap<TLRecord>('tldraw-records')

    const host = getCollabHost(hostUrl)
    const roomProvider = new YProvider(host, roomId, yDoc, { connect: true, party: 'yjs-room' })
    roomRef.current = roomProvider
    setRoom(roomProvider)

    const unsubs: (() => void)[] = []
    let didConnect = false

    const handleSync = (isSynced: boolean) => {
      if (!isSynced) {
        setStoreWithStatus({ status: 'not-synced', store })
        return
      }
      if (didConnect) return
      didConnect = true

      if (yRecords.size > 0) ensureEssentialRecordsExistInYjs(yDoc, yRecords)
      loadYjsRecordsIntoStore(yRecords, store)
      setupYjsSync(yDoc, yRecords, store, unsubs)
      setStoreWithStatus({ status: 'synced-remote', store, connectionStatus: 'online' })
    }

    const handleStatus = ({ status }: { status: string }) => {
      if (status === 'connected' && roomProvider.synced) {
        handleSync(true)
      } else if (status !== 'connected') {
        setStoreWithStatus(prev => prev.status === 'synced-remote' ? { ...prev, connectionStatus: 'offline' as const } : prev)
      }
    }

    roomProvider.on('status', handleStatus)
    roomProvider.on('sync', handleSync)

    if (roomProvider.synced) handleSync(true)

    return () => {
      unsubs.forEach(fn => fn())
      roomProvider.off('status', handleStatus)
      roomProvider.off('sync', handleSync)
      roomProvider.disconnect()
      yDoc.destroy()
      setRoom(null)
    }
  }, [roomId, hostUrl])

  return { storeWithStatus, room }
}
