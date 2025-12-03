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

  console.log('[ensureEssentialRecords] Adding missing records - hasPage:', hasPage, 'hasDocument:', hasDocument)

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

export function syncYjsChangesToStore(
  yRecords: Y.Map<TLRecord>,
  store: TLStore,
  transaction: Y.Transaction,
  events: Y.YEvent<any>[]
): void {
  if (transaction.local) return

  const toRemove: TLRecord['id'][] = []
  const toPut: TLRecord[] = []

  for (const event of events) {
    if (event instanceof Y.YMapEvent) {
      event.changes.keys.forEach((change, id) => {
        switch (change.action) {
          case 'add':
          case 'update': {
            const record = yRecords.get(id)
            if (record) toPut.push(record)
            break
          }
          case 'delete': {
            toRemove.push(id as TLRecord['id'])
            break
          }
        }
      })
    }
  }

  if (toRemove.length > 0 || toPut.length > 0) {
    console.log('[syncYjsChangesToStore] toRemove:', toRemove.length, 'toPut:', toPut.length, 'origin:', transaction.origin)
    if (toRemove.length > 0) {
      console.log('[syncYjsChangesToStore] REMOVING:', toRemove.slice(0, 5))
    }
  }

  store.mergeRemoteChanges(() => {
    if (toRemove.length > 0) store.remove(toRemove)
    if (toPut.length > 0) store.put(toPut)
  })
}

export function syncStoreChangesToYjs(
  yDoc: Y.Doc,
  yRecords: Y.Map<TLRecord>,
  event: TLStoreEventInfo
): void {
  if (event.source === 'remote') return

  const addedCount = Object.keys(event.changes.added).length
  const updatedCount = Object.keys(event.changes.updated).length
  const removedCount = Object.keys(event.changes.removed).length

  if (addedCount > 0 || updatedCount > 0 || removedCount > 0) {
    console.log('[syncStoreChangesToYjs] added:', addedCount, 'updated:', updatedCount, 'removed:', removedCount, 'source:', event.source)
    if (removedCount > 0) {
      console.log('[syncStoreChangesToYjs] REMOVING:', Object.keys(event.changes.removed).slice(0, 5))
    }
  }

  yDoc.transact(() => {
    Object.entries(event.changes.added).forEach(([id, record]) => {
      yRecords.set(id, record)
    })
    Object.entries(event.changes.updated).forEach(([id, [_prev, next]]) => {
      yRecords.set(id, next)
    })
    Object.entries(event.changes.removed).forEach(([id]) => {
      yRecords.delete(id)
    })
  })
}

export interface YjsStoreOptions {
  roomId: string
  hostUrl?: string
}

export interface YjsStoreResult {
  storeWithStatus: TLStoreWithStatus
  room: YProvider | null
}

export function useYjsStore({ roomId, hostUrl }: YjsStoreOptions): YjsStoreResult {
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: 'loading',
  })
  const [room, setRoom] = useState<YProvider | null>(null)

  const storeRef = useRef<TLStore | null>(null)
  const roomRef = useRef<YProvider | null>(null)
  const yDocRef = useRef<Y.Doc | null>(null)

  useEffect(() => {
    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils, ...customShapeUtils],
      bindingUtils: defaultBindingUtils,
    })
    storeRef.current = store

    const yDoc = new Y.Doc()
    yDocRef.current = yDoc
    const yRecords = yDoc.getMap<TLRecord>('tldraw-records')

    const host = hostUrl || (import.meta as any).env?.VITE_COLLAB_HOST || 'localhost:8800'
    console.log('[useYjsStore] Creating YProvider with host:', host, 'roomId:', roomId)

    const room = new YProvider(host, roomId, yDoc, {
      connect: true,
      party: 'yjs-room',
    })
    roomRef.current = room
    setRoom(room)

    const unsubs: (() => void)[] = []
    let didConnect = false

    const handleSync = (isSynced: boolean) => {
      console.log('[useYjsStore] handleSync called:', isSynced, 'didConnect:', didConnect)

      if (!isSynced) {
        setStoreWithStatus({ status: 'not-synced', store })
        return
      }

      if (didConnect) return
      didConnect = true

      console.log('[useYjsStore] yRecords.size:', yRecords.size, 'hasPage:', yRecords.has('page:page'), 'hasDocument:', yRecords.has('document:document'))

      if (yRecords.size > 0) {
        ensureEssentialRecordsExistInYjs(yDoc, yRecords)
        console.log('[useYjsStore] After ensureEssential - hasPage:', yRecords.has('page:page'), 'hasDocument:', yRecords.has('document:document'))
      }
      loadYjsRecordsIntoStore(yRecords, store)
      console.log('[useYjsStore] After loadYjsRecords - store has page:', !!store.get('page:page' as any))

      const handleYjsChange = (events: Y.YEvent<any>[], transaction: Y.Transaction) => {
        syncYjsChangesToStore(yRecords, store, transaction, events)
      }
      yRecords.observeDeep(handleYjsChange)
      unsubs.push(() => yRecords.unobserveDeep(handleYjsChange))

      const handleStoreChange = (event: TLStoreEventInfo) => {
        syncStoreChangesToYjs(yDoc, yRecords, event)
      }
      unsubs.push(
        store.listen(handleStoreChange, { scope: 'document' })
      )

      console.log('[useYjsStore] Setting status to synced-remote')
      setStoreWithStatus({
        status: 'synced-remote',
        store,
        connectionStatus: 'online',
      })
    }

    const handleStatus = ({ status }: { status: string }) => {
      if (status === 'connected' && room.synced) {
        handleSync(true)
      } else if (status !== 'connected') {
        setStoreWithStatus(prev => {
          if (prev.status === 'synced-remote') {
            return { ...prev, connectionStatus: 'offline' as const }
          }
          return prev
        })
      }
    }

    room.on('status', handleStatus)
    room.on('sync', handleSync)

    if (room.synced) {
      handleSync(true)
    }

    return () => {
      console.log('[useYjsStore] Cleanup')
      unsubs.forEach(fn => fn())
      room.off('status', handleStatus)
      room.off('sync', handleSync)
      room.disconnect()
      yDoc.destroy()
      setRoom(null)
    }
  }, [roomId, hostUrl])

  return { storeWithStatus, room }
}
