import { useEffect, useState, useMemo } from 'react'
import {
  createTLStore,
  TLRecord,
  TLStoreEventInfo,
  TLStoreWithStatus,
  defaultShapeUtils,
  defaultBindingUtils,
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
  VerticalLineShapeUtil,
  HorizontalLaneShapeUtil,
  ThemeAreaShapeUtil,
  LabelShapeUtil,
]

export interface YjsStoreOptions {
  roomId: string
  hostUrl?: string
}

export function useYjsStore({ roomId, hostUrl }: YjsStoreOptions): TLStoreWithStatus {
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: 'loading',
  })

  const { yDoc, yRecords, room } = useMemo(() => {
    const yDoc = new Y.Doc()
    const yRecords = yDoc.getMap<TLRecord>('tldraw-records')

    const host = hostUrl || (import.meta as any).env?.VITE_COLLAB_HOST || 'localhost:8800'
    const room = new YProvider(host, `tldraw-${roomId}`, yDoc, {
      connect: true,
      party: 'yjs-room',
    })

    return { yDoc, yRecords, room }
  }, [roomId, hostUrl])

  useEffect(() => {
    setStoreWithStatus({ status: 'loading' })

    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils, ...customShapeUtils],
      bindingUtils: defaultBindingUtils,
    })

    const unsubs: (() => void)[] = []
    let didConnect = false

    const handleSync = (isSynced: boolean) => {
      if (!isSynced) {
        setStoreWithStatus({ status: 'not-synced', store })
        return
      }

      if (didConnect) return
      didConnect = true

      // Initialize store from Yjs if there are existing records
      store.mergeRemoteChanges(() => {
        const existingRecords = Array.from(yRecords.values())
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

      unsubs.push(
        store.listen(handleStoreChange, { source: 'user', scope: 'document' })
      )

      setStoreWithStatus({
        status: 'synced-remote',
        store,
        connectionStatus: 'online',
      })
    }

    const handleStatus = ({ status }: { status: string }) => {
      if (status === 'connected') {
        handleSync(room.synced)
      } else {
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

    // If already connected and synced
    if (room.synced) {
      handleSync(true)
    }

    return () => {
      unsubs.forEach(fn => fn())
      room.off('status', handleStatus)
      room.off('sync', handleSync)
      room.disconnect()
    }
  }, [yDoc, yRecords, room])

  return storeWithStatus
}
