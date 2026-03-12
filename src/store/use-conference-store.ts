import { create } from 'zustand'

export type ConferenceStatus =
  | 'idle'
  | 'pre-join'
  | 'connecting'
  | 'waiting'
  | 'in-room'
  | 'ended'
  | 'denied'

export interface WaitingParticipant {
  identity: string
  username: string
  joinedAt: number
}

export interface ConferenceChatMessage {
  id: string
  from: 'local' | 'remote'
  fromLabel: string
  text: string
  timestamp: number
  fileUrl?: string
  fileName?: string
  fileMime?: string
}

interface ConferenceState {
  status: ConferenceStatus
  roomName: string | null
  token: string | null
  identity: string | null
  role: 'host' | 'participant' | null
  username: string | null

  // UI panels
  isMicMuted: boolean
  isCameraOff: boolean
  isScreenSharing: boolean
  isSpeakerMuted: boolean
  isChatOpen: boolean
  isParticipantsOpen: boolean
  isInviteOpen: boolean
  pinnedIdentity: string | null // pinned/spotlight participant

  // Call timer
  callStartTime: number | null
  callDuration: number

  // Waiting room (host sees these)
  waitingParticipants: WaitingParticipant[]

  // Chat
  chatMessages: ConferenceChatMessage[]
  unreadCount: number

  // Actions
  setStatus: (s: ConferenceStatus) => void
  setRoom: (roomName: string, token: string, identity: string, role: 'host' | 'participant', username: string) => void
  setMicMuted: (v: boolean) => void
  setCameraOff: (v: boolean) => void
  setScreenSharing: (v: boolean) => void
  setSpeakerMuted: (v: boolean) => void
  setChatOpen: (v: boolean) => void
  setParticipantsOpen: (v: boolean) => void
  setInviteOpen: (v: boolean) => void
  setCallStartTime: (t: number | null) => void
  setCallDuration: (d: number) => void
  setPinnedIdentity: (id: string | null) => void
  addWaitingParticipant: (p: WaitingParticipant) => void
  removeWaitingParticipant: (identity: string) => void
  addChatMessage: (m: ConferenceChatMessage) => void
  resetUnread: () => void
  reset: () => void
}

const initialState = {
  status: 'idle' as ConferenceStatus,
  roomName: null,
  token: null,
  identity: null,
  role: null,
  username: null,
  isMicMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  isSpeakerMuted: false,
  isChatOpen: false,
  isParticipantsOpen: false,
  isInviteOpen: false,
  pinnedIdentity: null,
  callStartTime: null,
  callDuration: 0,
  waitingParticipants: [] as WaitingParticipant[],
  chatMessages: [] as ConferenceChatMessage[],
  unreadCount: 0,
}

export const useConferenceStore = create<ConferenceState>((set, get) => ({
  ...initialState,

  setStatus: (status) => set({ status }),

  setRoom: (roomName, token, identity, role, username) =>
    set({ roomName, token, identity, role, username }),

  setMicMuted: (isMicMuted) => set({ isMicMuted }),
  setCameraOff: (isCameraOff) => set({ isCameraOff }),
  setScreenSharing: (isScreenSharing) => set({ isScreenSharing }),
  setSpeakerMuted: (isSpeakerMuted) => set({ isSpeakerMuted }),

  setChatOpen: (v) =>
    set({ isChatOpen: v, unreadCount: v ? 0 : get().unreadCount }),

  setParticipantsOpen: (v) => set({ isParticipantsOpen: v }),
  setInviteOpen: (v) => set({ isInviteOpen: v }),
  setCallStartTime: (t) => set({ callStartTime: t }),
  setCallDuration: (d) => set({ callDuration: d }),
  setPinnedIdentity: (id) => set({ pinnedIdentity: id }),

  addWaitingParticipant: (p) => {
    if (get().waitingParticipants.find((w) => w.identity === p.identity)) return
    set({ waitingParticipants: [...get().waitingParticipants, p] })
  },

  removeWaitingParticipant: (identity) =>
    set({
      waitingParticipants: get().waitingParticipants.filter(
        (w) => w.identity !== identity
      ),
    }),

  addChatMessage: (m) => {
    const { isChatOpen } = get()
    set((s) => ({
      chatMessages: [...s.chatMessages, m],
      unreadCount:
        m.from === 'remote' && !isChatOpen
          ? s.unreadCount + 1
          : s.unreadCount,
    }))
  },

  resetUnread: () => set({ unreadCount: 0 }),

  reset: () => set({ ...initialState }),
}))
