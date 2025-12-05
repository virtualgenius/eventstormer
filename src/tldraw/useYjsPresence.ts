import { useEffect, useRef } from 'react'
import { Editor, TLInstancePresence } from 'tldraw'
import {
  createPresenceStateDerivation,
  InstancePresenceRecordType,
} from '@tldraw/tlschema'
import { atom, react } from '@tldraw/state'
import YProvider from 'y-partyserver/provider'

// Generate a random color for the user
function getRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Generate a random user ID (unique per tab for testing)
function getUserId(): string {
  // Use sessionStorage for unique ID per tab (for multi-tab testing)
  let id = sessionStorage.getItem('tldraw-user-id')
  if (!id) {
    id = Math.random().toString(36).substring(2, 10)
    sessionStorage.setItem('tldraw-user-id', id)
  }
  return id
}

export interface UseYjsPresenceOptions {
  editor: Editor | null
  room: YProvider | null
  userName: string
}

export function useYjsPresence({ editor, room, userName }: UseYjsPresenceOptions) {
  const userIdRef = useRef(getUserId())
  const userNameRef = useRef(userName)
  const userColorRef = useRef(getRandomColor())

  // Sync local presence to Yjs awareness
  useEffect(() => {
    if (!editor || !room) return

    const userId = userIdRef.current
    const userColor = userColorRef.current

    console.log('[useYjsPresence] Setting up presence for user:', userId, userName)

    // Create a reactive user signal
    const $user = atom('user', {
      id: userId,
      name: userName,
      color: userColor,
    })

    // Create presence derivation
    const presenceId = InstancePresenceRecordType.createId(userId)
    const presenceDerivation = createPresenceStateDerivation($user, presenceId)
    const $presence = presenceDerivation(editor.store)

    // React to local presence changes and sync to awareness
    const stopReacting = react('sync presence to awareness', () => {
      const presence = $presence.get()
      if (!presence) return

      // Send presence to Yjs awareness
      room.awareness.setLocalStateField('presence', presence)
    })

    // Set initial user info in awareness
    room.awareness.setLocalStateField('user', {
      id: userId,
      name: userName,
      color: userColor,
    })

    return () => {
      stopReacting()
    }
  }, [editor, room, userName])

  // Sync remote presence from Yjs awareness to tldraw store
  useEffect(() => {
    if (!editor || !room) return

    const userId = userIdRef.current

    const handleAwarenessChange = () => {
      const states = room.awareness.getStates()
      const toRemove: TLInstancePresence['id'][] = []
      const toPut: TLInstancePresence[] = []

      console.log('[useYjsPresence] Awareness change, states:', states.size, 'myId:', userId)

      // Get all existing presence records in the store
      const existingPresences = editor.store.allRecords().filter(
        (r): r is TLInstancePresence => r.typeName === 'instance_presence'
      )

      // Track which presence IDs are still active
      const activePresenceIds = new Set<string>()

      states.forEach((state, clientId) => {
        console.log('[useYjsPresence] State from client', clientId, ':', state.user?.id, state.user?.name)

        // Skip our own presence
        if (state.user?.id === userId) {
          console.log('[useYjsPresence] Skipping own presence')
          return
        }

        const presence = state.presence as TLInstancePresence | undefined
        if (presence) {
          console.log('[useYjsPresence] Adding remote presence:', presence.id, presence.userName)
          activePresenceIds.add(presence.id)
          toPut.push(presence)
        }
      })

      // Remove presence records for users who are no longer present
      for (const existingPresence of existingPresences) {
        // Skip our own presence record
        if (existingPresence.userId === userId) continue

        if (!activePresenceIds.has(existingPresence.id)) {
          toRemove.push(existingPresence.id)
        }
      }

      // Apply changes
      editor.store.mergeRemoteChanges(() => {
        if (toRemove.length > 0) {
          editor.store.remove(toRemove)
        }
        if (toPut.length > 0) {
          editor.store.put(toPut)
        }
      })
    }

    room.awareness.on('change', handleAwarenessChange)

    // Initial sync
    handleAwarenessChange()

    return () => {
      room.awareness.off('change', handleAwarenessChange)

      // Clean up all remote presence records on disconnect
      const existingPresences = editor.store.allRecords().filter(
        (r): r is TLInstancePresence =>
          r.typeName === 'instance_presence' && r.userId !== userId
      )
      if (existingPresences.length > 0) {
        editor.store.remove(existingPresences.map((p) => p.id))
      }
    }
  }, [editor, room])

  return {
    userId: userIdRef.current,
    userName: userNameRef.current,
    userColor: userColorRef.current,
  }
}
