import { create } from 'zustand'
import type { Peer, DataConnection } from 'peerjs'

export type ChatRoomStatus = 'idle' | 'setup' | 'generating' | 'ready' | 'joining' | 'connected' | 'ended' | 'failed'

export interface RoomMessage {
  id: string
  from: string      // username
  text: string
  timestamp: number
  isLocal: boolean
  isSystem?: boolean
  fileUrl?: string
  fileName?: string
  fileMime?: string
  previewUrl?: string
  status?: 'sending' | 'sent' | 'failed'
  progress?: number
}

interface ChatRoomState {
  peer: Peer | null
  dataConnections: Map<string, DataConnection>
  status: ChatRoomStatus

  username: string
  roomCode: string
  roomPasswordHash: string | null

  messages: RoomMessage[]
  participants: Map<string, string>  // peerId → username
  unreadCount: number

  // Actions
  setPeer: (p: Peer | null) => void
  addDataConnection: (peerId: string, conn: DataConnection) => void
  removeDataConnection: (peerId: string) => void
  setStatus: (s: ChatRoomStatus) => void
  setUsername: (name: string) => void
  setRoomCode: (code: string) => void
  setRoomPasswordHash: (hash: string | null) => void
  addMessage: (msg: RoomMessage) => void
  addParticipant: (peerId: string, username: string) => void
  removeParticipant: (peerId: string) => void
  resetRoom: () => void
}

export const useChatRoomStore = create<ChatRoomState>((set, get) => ({
  peer: null,
  dataConnections: new Map(),
  status: 'idle',
  username: '',
  roomCode: '',
  roomPasswordHash: null,
  messages: [],
  participants: new Map(),
  unreadCount: 0,

  setPeer: (p) => set({ peer: p }),

  addDataConnection: (peerId, conn) => {
    const m = new Map(get().dataConnections)
    m.set(peerId, conn)
    set({ dataConnections: m })
  },

  removeDataConnection: (peerId) => {
    const m = new Map(get().dataConnections)
    m.delete(peerId)
    set({ dataConnections: m })
  },

  setStatus: (s) => set({ status: s }),
  setUsername: (name) => set({ username: name }),
  setRoomCode: (code) => set({ roomCode: code }),
  setRoomPasswordHash: (hash) => set({ roomPasswordHash: hash }),

  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),

  addParticipant: (peerId, username) => {
    const m = new Map(get().participants)
    m.set(peerId, username)
    set({ participants: m })
  },

  removeParticipant: (peerId) => {
    const m = new Map(get().participants)
    m.delete(peerId)
    set({ participants: m })
  },

  resetRoom: () => {
    const { peer, dataConnections } = get()
    dataConnections.forEach(c => { try { c.close() } catch { /* ignore */ } })
    if (peer) { try { peer.destroy() } catch { /* ignore */ } }
    set({
      peer: null,
      dataConnections: new Map(),
      status: 'idle',
      roomCode: '',
      roomPasswordHash: null,
      messages: [],
      participants: new Map(),
      unreadCount: 0,
    })
  },
}))
