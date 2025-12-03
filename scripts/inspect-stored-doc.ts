/**
 * Script to inspect what's stored in a room's Yjs document
 */

import * as Y from 'yjs'
import YProvider from 'y-partyserver/provider'

const PROD_HOST = 'eventstormer-collab.paul-162.workers.dev'
const ROOM_ID = 'qzlllj2y'

async function inspectRoom(): Promise<void> {
  return new Promise((resolve) => {
    console.log(`Inspecting room: ${ROOM_ID}`)

    const yDoc = new Y.Doc()
    const yRecords = yDoc.getMap('tldraw-records')

    const provider = new YProvider(PROD_HOST, ROOM_ID, yDoc, {
      connect: true,
      party: 'yjs-room',
    })

    const timeout = setTimeout(() => {
      console.log('Timeout - no sync received')
      provider.disconnect()
      yDoc.destroy()
      resolve()
    }, 15000)

    provider.on('sync', (isSynced: boolean) => {
      if (isSynced) {
        clearTimeout(timeout)

        console.log('\n=== Document State ===')
        console.log('Y.Map size:', yRecords.size)

        if (yRecords.size > 0) {
          console.log('\nRecords by type:')
          const byType: Record<string, number> = {}
          const shapeTypes: Record<string, number> = {}

          yRecords.forEach((record: any, id) => {
            const typeName = record?.typeName || 'unknown'
            byType[typeName] = (byType[typeName] || 0) + 1

            if (typeName === 'shape' && record?.type) {
              shapeTypes[record.type] = (shapeTypes[record.type] || 0) + 1
            }
          })

          console.log('By typeName:', byType)
          console.log('Shape types:', shapeTypes)

          // Show first few records
          console.log('\nFirst 5 records:')
          let count = 0
          yRecords.forEach((record: any, id) => {
            if (count < 5) {
              console.log(`  ${id}:`, JSON.stringify(record).slice(0, 200))
              count++
            }
          })
        } else {
          console.log('No records in Y.Map')
        }

        // Check document state
        const stateVector = Y.encodeStateVector(yDoc)
        const fullState = Y.encodeStateAsUpdate(yDoc)
        console.log('\nDocument stats:')
        console.log('  State vector size:', stateVector.byteLength, 'bytes')
        console.log('  Full state size:', fullState.byteLength, 'bytes')

        provider.disconnect()
        yDoc.destroy()
        resolve()
      }
    })

    provider.on('status', ({ status }: { status: string }) => {
      console.log('Connection status:', status)
    })
  })
}

inspectRoom().then(() => {
  console.log('\nDone')
  process.exit(0)
}).catch(console.error)
