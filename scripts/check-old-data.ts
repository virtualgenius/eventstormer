/**
 * Script to check if old board data exists in Cloudflare Durable Objects
 *
 * This connects to the production collaboration server and checks both:
 * 1. The old room ID (without tldraw- prefix) with old schema (Y.Map("board"))
 * 2. The tldraw room ID (with tldraw- prefix) with new schema (Y.Map("tldraw-records"))
 */

import * as Y from 'yjs'
import YProvider from 'y-partyserver/provider'

const PROD_HOST = 'eventstormer-collab.paul-162.workers.dev'
const ROOM_IDS = [
  'qzlllj2y',   // The Dishwasher board
  '917rhhh5',   // Another board mentioned by user
]

async function checkRoom(roomId: string, mapKey: string, description: string): Promise<void> {
  return new Promise((resolve) => {
    console.log(`\n=== Checking ${description} ===`)
    console.log(`Room ID: ${roomId}`)
    console.log(`Map Key: ${mapKey}`)

    const yDoc = new Y.Doc()
    const yMap = yDoc.getMap(mapKey)

    const provider = new YProvider(PROD_HOST, roomId, yDoc, {
      connect: true,
      party: 'yjs-room',
    })

    let resolved = false

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        console.log('Timeout - no sync received')
        provider.disconnect()
        yDoc.destroy()
        resolve()
      }
    }, 10000)

    provider.on('sync', (isSynced: boolean) => {
      if (isSynced && !resolved) {
        resolved = true
        clearTimeout(timeout)

        console.log(`Synced! Map size: ${yMap.size}`)

        if (yMap.size > 0) {
          console.log('\n*** DATA FOUND! ***')
          console.log('Keys:', Array.from(yMap.keys()).slice(0, 20))

          // For old schema, check for board properties
          if (mapKey === 'board') {
            const name = yMap.get('name')
            const stickies = yMap.get('stickies')
            console.log('Board name:', name)
            console.log('Stickies type:', stickies?.constructor?.name)
            if (stickies && typeof stickies.toArray === 'function') {
              console.log('Stickies count:', stickies.toArray().length)
            }
          }

          // For new schema, show some record types
          if (mapKey === 'tldraw-records') {
            const keys = Array.from(yMap.keys()) as string[]
            const shapes = keys.filter(k => k.startsWith('shape:'))
            console.log('Shape records:', shapes.length)
          }
        } else {
          console.log('Map is empty - no data found')
        }

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

async function main() {
  console.log('Checking for old board data in production Durable Objects...\n')

  for (const roomId of ROOM_IDS) {
    console.log(`\n========== ROOM: ${roomId} ==========`)

    // Check old room ID with old schema
    await checkRoom(roomId, 'board', 'Old schema (react-konva)')

    // Check old room ID with new schema (what we're doing now after removing prefix)
    await checkRoom(roomId, 'tldraw-records', 'New schema at old room ID')

    // Check tldraw-prefixed room ID with new schema
    await checkRoom(`tldraw-${roomId}`, 'tldraw-records', 'New schema at tldraw-prefixed room ID')
  }

  console.log('\n=== Done ===')
  process.exit(0)
}

main().catch(console.error)
