import { useEffect, useRef } from 'react'
import { Editor, TLInstancePresence } from 'tldraw'
import {
  createPresenceStateDerivation,
  InstancePresenceRecordType,
} from '@tldraw/tlschema'
import { atom, react } from '@tldraw/state'
import YProvider from 'y-partyserver/provider'

interface AwarenessUserInfo {
  id?: string
  name?: string
  color?: string
}

interface AwarenessState {
  user?: AwarenessUserInfo
  presence?: TLInstancePresence
}

// Generate a random color for the user
function getRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

const BASE_36_RADIX = 36
const USER_ID_START_INDEX = 2
const USER_ID_END_INDEX = 10

// Generate a random user ID (unique per tab for testing)
function getUserId(): string {
  // Use sessionStorage for unique ID per tab (for multi-tab testing)
  let id = sessionStorage.getItem('tldraw-user-id')
  if (!id) {
    id = Math.random().toString(BASE_36_RADIX).substring(USER_ID_START_INDEX, USER_ID_END_INDEX)
    sessionStorage.setItem('tldraw-user-id', id)
  }
  return id
}

export interface UseYjsPresenceOptions {
  editor: Editor | null
  room: YProvider | null
  userName: string
}

interface PresenceChanges {
  toRemove: TLInstancePresence['id'][]
  toPut: TLInstancePresence[]
}

function isOtherUserPresence(state: AwarenessState, userId: string): boolean {
  return state.user?.id !== userId && state.presence !== undefined
}

function collectPresenceChanges(
  states: Map<number, AwarenessState>,
  existingPresences: TLInstancePresence[],
  userId: string
): PresenceChanges {
  const toPut: TLInstancePresence[] = []
  const activePresenceIds = new Set<string>()

  states.forEach((state: AwarenessState) => {
    if (!isOtherUserPresence(state, userId)) return
    const presence = state.presence as TLInstancePresence
    activePresenceIds.add(presence.id)
    toPut.push(presence)
  })

  const toRemove = existingPresences
    .filter(p => p.userId !== userId && !activePresenceIds.has(p.id))
    .map(p => p.id)

  return { toRemove, toPut }
}

function useLocalPresenceSync(
  editor: Editor | null,
  room: YProvider | null,
  userId: string,
  userName: string,
  userColor: string
) {
  useEffect(() => {
    if (!editor || !room) return

    const $user = atom('user', { id: userId, name: userName, color: userColor })
    const presenceId = InstancePresenceRecordType.createId(userId)
    const $presence = createPresenceStateDerivation($user, presenceId)(editor.store)

    const stopReacting = react('sync presence to awareness', () => {
      const presence = $presence.get()
      if (presence) room.awareness.setLocalStateField('presence', presence)
    })

    room.awareness.setLocalStateField('user', { id: userId, name: userName, color: userColor })

    return stopReacting
  }, [editor, room, userId, userName, userColor])
}

function useRemotePresenceSync(editor: Editor | null, room: YProvider | null, userId: string) {
  useEffect(() => {
    if (!editor || !room) return

    const handleAwarenessChange = () => {
      const states = room.awareness.getStates() as Map<number, AwarenessState>
      const existingPresences = editor.store.allRecords().filter(
        (r): r is TLInstancePresence => r.typeName === 'instance_presence'
      )

      const { toRemove, toPut } = collectPresenceChanges(states, existingPresences, userId)

      editor.store.mergeRemoteChanges(() => {
        if (toRemove.length > 0) editor.store.remove(toRemove)
        if (toPut.length > 0) editor.store.put(toPut)
      })
    }

    room.awareness.on('change', handleAwarenessChange)
    handleAwarenessChange()

    return () => {
      room.awareness.off('change', handleAwarenessChange)
      const existingPresences = editor.store.allRecords().filter(
        (r): r is TLInstancePresence => r.typeName === 'instance_presence' && r.userId !== userId
      )
      if (existingPresences.length > 0) {
        editor.store.remove(existingPresences.map((p) => p.id))
      }
    }
  }, [editor, room, userId])
}

export function useYjsPresence({ editor, room, userName }: UseYjsPresenceOptions) {
  const userIdRef = useRef(getUserId())
  const userColorRef = useRef(getRandomColor())

  useLocalPresenceSync(editor, room, userIdRef.current, userName, userColorRef.current)
  useRemotePresenceSync(editor, room, userIdRef.current)

  return {
    userId: userIdRef.current,
    userName,
    userColor: userColorRef.current,
  }
}
