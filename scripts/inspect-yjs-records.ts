/**
 * Connect to production and inspect what records are in the Yjs doc
 */
import * as Y from 'yjs'
import YProvider from 'y-partyserver/provider'

const PROD_HOST = 'eventstormer-collab.paul-162.workers.dev'
const ROOM_ID = 'qzlllj2y'

async function main() {
  console.log(`Connecting to room: ${ROOM_ID}`)

  const yDoc = new Y.Doc()
  const yRecords = yDoc.getMap('tldraw-records')

  const room = new YProvider(PROD_HOST, ROOM_ID, yDoc, {
    connect: true,
    party: 'yjs-room',
  })

  room.on('sync', (synced: boolean) => {
    if (!synced) return

    console.log('\n=== Yjs Records ===')
    console.log('Total records:', yRecords.size)

    // Check for essential records
    console.log('\nEssential records check:')
    console.log('  page:page exists:', yRecords.has('page:page'))
    console.log('  document:document exists:', yRecords.has('document:document'))

    // Look for any page or document records
    yRecords.forEach((record: any, id: string) => {
      if (id.startsWith('page:') || id.startsWith('document:') || id.startsWith('camera:')) {
        console.log(`  Found: ${id}`)
      }
    })

    // Group by type
    const byType: Record<string, number> = {}
    const shapeTypes: Record<string, number> = {}

    yRecords.forEach((record: any, id: string) => {
      const typeName = record.typeName || 'unknown'
      byType[typeName] = (byType[typeName] || 0) + 1

      // For shapes, also count by shape type
      if (typeName === 'shape' && record.type) {
        shapeTypes[record.type] = (shapeTypes[record.type] || 0) + 1
      }
    })

    console.log('\nBy typeName:')
    Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })

    if (Object.keys(shapeTypes).length > 0) {
      console.log('\nShape types:')
      Object.entries(shapeTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`)
      })
    }

    // Show first few shape records
    console.log('\nFirst 3 shape records:')
    let count = 0
    yRecords.forEach((record: any, id: string) => {
      if (record.typeName === 'shape' && count < 3) {
        console.log(`\n${id}:`)
        console.log(JSON.stringify(record, null, 2))
        count++
      }
    })

    setTimeout(() => {
      room.disconnect()
      process.exit(0)
    }, 1000)
  })

  room.on('status', ({ status }: { status: string }) => {
    console.log('Connection status:', status)
  })
}

main().catch(console.error)
