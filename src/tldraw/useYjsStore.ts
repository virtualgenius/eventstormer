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
    // Create the store
    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils, ...customShapeUtils],
      bindingUtils: defaultBindingUtils,
    })
    storeRef.current = store

    // Create Yjs doc
    const yDoc = new Y.Doc()
    yDocRef.current = yDoc
    const yRecords = yDoc.getMap<TLRecord>('tldraw-records')

    // Create YProvider
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

      // Initialize store from Yjs if there are existing records
      store.mergeRemoteChanges(() => {
        const existingRecords = Array.from(yRecords.values())
        console.log('[useYjsStore] Loading', existingRecords.length, 'existing records from Yjs')
        if (existingRecords.length > 0) {
          store.put(existingRecords as TLRecord[])
        }
      })

      // Sync Yjs changes to tldraw store
      const handleYjsChange = (
        events: Y.YEvent<any>[],
        transaction: Y.Transaction
      ) => {
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

        console.log('[useYjsStore] handleYjsChange - toRemove:', toRemove.length, 'toPut:', toPut.length, 'origin:', transaction.origin)
        if (toRemove.length > 0) {
          console.log('[useYjsStore] REMOVING records:', toRemove.slice(0, 5))
        }

        store.mergeRemoteChanges(() => {
          if (toRemove.length > 0) store.remove(toRemove)
          if (toPut.length > 0) store.put(toPut)
        })
      }

      yRecords.observeDeep(handleYjsChange)
      unsubs.push(() => yRecords.unobserveDeep(handleYjsChange))

      // Sync tldraw store changes to Yjs
      const handleStoreChange = (event: TLStoreEventInfo) => {
        if (event.source === 'remote') return

        const addedCount = Object.keys(event.changes.added).length
        const updatedCount = Object.keys(event.changes.updated).length
        const removedCount = Object.keys(event.changes.removed).length

        console.log('[useYjsStore] handleStoreChange - added:', addedCount, 'updated:', updatedCount, 'removed:', removedCount, 'source:', event.source)
        if (removedCount > 0) {
          console.log('[useYjsStore] Store REMOVING:', Object.keys(event.changes.removed).slice(0, 5))
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

      // Listen to all non-remote document changes (user actions + tldraw internal initialization)
      // The handleStoreChange function already filters out remote changes
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
      console.log('[useYjsStore] status event:', status, 'room.synced:', room.synced)
      if (status === 'connected') {
        // When connected, if already synced, handle it immediately
        if (room.synced) {
          handleSync(true)
        }
      } else {
        setStoreWithStatus(prev => {
          if (prev.status === 'synced-remote') {
            return { ...prev, connectionStatus: 'offline' as const }
          }
          return prev
        })
      }
    }

    // Set up event listeners BEFORE checking initial state
    room.on('status', handleStatus)
    room.on('sync', handleSync)

    console.log('[useYjsStore] Listeners attached, checking initial state - synced:', room.synced)

    // Check if already synced (connection established before listeners)
    if (room.synced) {
      console.log('[useYjsStore] Already synced!')
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
