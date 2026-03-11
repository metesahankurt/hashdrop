import { create } from 'zustand'
import type { Peer, MediaConnection, DataConnection } from 'peerjs'

export type VideoCallStatus = 'idle' | 'generating' | 'ready' | 'waiting' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed'

export interface RemotePeerStreams {
  camera: MediaStream | null
  screen: MediaStream | null
}

export interface ChatMessage {
  id: string
  from: 'local' | 'remote'
  fromLabel: string
  text: string
  timestamp: number
}

interface VideoState {
  peer: Peer | null
  mediaConnections: Map<string, MediaConnection>
  dataConnections: Map<string, DataConnection>
  remoteStreams: Map<string, RemotePeerStreams>
  callStatus: VideoCallStatus
  callCode: string | null
  localStream: MediaStream | null
  screenStream: MediaStream | null
  isMicMuted: boolean
  isCameraOff: boolean
  isScreenSharing: boolean
  isSpeakerMuted: boolean
  callStartTime: number | null
  callDuration: number

  // Chat
  chatMessages: ChatMessage[]
  unreadCount: number
  isChatOpen: boolean

  // Password
  callPasswordHash: string | null

  // Invite panel
  isInviteOpen: boolean
  callInviteUrl: string | null

  // Peer usernames (for tile labels)
  peerUsernames: Map<string, string>

  // Pending incoming call (held until user confirms in lobby)
  pendingCall: MediaConnection | null

  setPeer: (peer: Peer | null) => void
  addMediaConnection: (peerId: string, conn: MediaConnection) => void
  removeMediaConnection: (peerId: string) => void
  addDataConnection: (peerId: string, conn: DataConnection) => void
  removeDataConnection: (peerId: string) => void
  setRemoteStreams: (peerId: string, streams: RemotePeerStreams) => void
  removeRemoteStreams: (peerId: string) => void
  setCallStatus: (status: VideoCallStatus) => void
  setCallCode: (code: string | null) => void
  setLocalStream: (stream: MediaStream | null) => void
  setScreenStream: (stream: MediaStream | null) => void
  toggleMic: () => void
  toggleCamera: () => void
  toggleSpeaker: () => void
  setIsScreenSharing: (sharing: boolean) => void
  setCallStartTime: (time: number | null) => void
  setCallDuration: (duration: number) => void

  // Chat actions
  addChatMessage: (msg: ChatMessage) => void
  resetUnread: () => void
  setChatOpen: (open: boolean) => void

  // Password actions
  setCallPasswordHash: (hash: string | null) => void

  // Invite panel actions
  setInviteOpen: (open: boolean) => void
  setCallInviteUrl: (url: string | null) => void

  // Peer username actions
  addPeerUsername: (peerId: string, username: string) => void
  removePeerUsername: (peerId: string) => void

  // Pending call
  setPendingCall: (call: MediaConnection | null) => void

  resetCall: () => void
}

export const useVideoStore = create<VideoState>((set, get) => ({
  peer: null,
  mediaConnections: new Map(),
  dataConnections: new Map(),
  remoteStreams: new Map(),
  callStatus: 'idle',
  callCode: null,
  localStream: null,
  screenStream: null,
  isMicMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  isSpeakerMuted: false,
  callStartTime: null,
  callDuration: 0,

  chatMessages: [],
  unreadCount: 0,
  isChatOpen: false,

  callPasswordHash: null,
  isInviteOpen: false,
  callInviteUrl: null,
  peerUsernames: new Map(),
  pendingCall: null,

  setPeer: (peer) => set({ peer }),

  addMediaConnection: (peerId, conn) => {
    const newMap = new Map(get().mediaConnections)
    newMap.set(peerId, conn)
    set({ mediaConnections: newMap })
  },

  removeMediaConnection: (peerId) => {
    const newMap = new Map(get().mediaConnections)
    newMap.delete(peerId)
    set({ mediaConnections: newMap })
  },

  addDataConnection: (peerId, conn) => {
    const newMap = new Map(get().dataConnections)
    newMap.set(peerId, conn)
    set({ dataConnections: newMap })
  },

  removeDataConnection: (peerId) => {
    const newMap = new Map(get().dataConnections)
    newMap.delete(peerId)
    set({ dataConnections: newMap })
  },

  setRemoteStreams: (peerId, streams) => {
    const newMap = new Map(get().remoteStreams)
    newMap.set(peerId, streams)
    set({ remoteStreams: newMap })
  },

  removeRemoteStreams: (peerId) => {
    const newMap = new Map(get().remoteStreams)
    newMap.delete(peerId)
    set({ remoteStreams: newMap })
  },

  setCallStatus: (status) => set({ callStatus: status }),
  setCallCode: (code) => set({ callCode: code }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setScreenStream: (stream) => set({ screenStream: stream }),

  toggleMic: () => {
    const { localStream, isMicMuted } = get()
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) audioTrack.enabled = isMicMuted
    }
    set({ isMicMuted: !isMicMuted })
  },

  toggleCamera: () => {
    const { localStream, isCameraOff } = get()
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) videoTrack.enabled = isCameraOff
    }
    set({ isCameraOff: !isCameraOff })
  },

  toggleSpeaker: () => {
    set((state) => ({ isSpeakerMuted: !state.isSpeakerMuted }))
  },

  setIsScreenSharing: (sharing) => set({ isScreenSharing: sharing }),
  setCallStartTime: (time) => set({ callStartTime: time }),
  setCallDuration: (duration) => set({ callDuration: duration }),

  addChatMessage: (msg) => {
    const { isChatOpen } = get()
    set((state) => ({
      chatMessages: [...state.chatMessages, msg],
      unreadCount: msg.from === 'remote' && !isChatOpen
        ? state.unreadCount + 1
        : state.unreadCount,
    }))
  },

  resetUnread: () => set({ unreadCount: 0 }),

  setChatOpen: (open) => {
    set({ isChatOpen: open, unreadCount: open ? 0 : get().unreadCount })
  },

  setCallPasswordHash: (hash) => set({ callPasswordHash: hash }),
  setInviteOpen: (open) => set({ isInviteOpen: open }),
  setCallInviteUrl: (url) => set({ callInviteUrl: url }),

  addPeerUsername: (peerId, username) => {
    const m = new Map(get().peerUsernames)
    m.set(peerId, username)
    set({ peerUsernames: m })
  },

  removePeerUsername: (peerId) => {
    const m = new Map(get().peerUsernames)
    m.delete(peerId)
    set({ peerUsernames: m })
  },

  setPendingCall: (call) => set({ pendingCall: call }),

  resetCall: () => {
    const { localStream, screenStream, peer, mediaConnections, dataConnections } = get()
    if (localStream) localStream.getTracks().forEach(t => t.stop())
    if (screenStream) screenStream.getTracks().forEach(t => t.stop())
    mediaConnections.forEach(conn => { try { conn.close() } catch { /* ignore */ } })
    dataConnections.forEach(conn => { try { conn.close() } catch { /* ignore */ } })
    if (peer) peer.destroy()
    set({
      peer: null,
      mediaConnections: new Map(),
      dataConnections: new Map(),
      remoteStreams: new Map(),
      callStatus: 'idle',
      callCode: null,
      localStream: null,
      screenStream: null,
      isMicMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      isSpeakerMuted: false,
      callStartTime: null,
      callDuration: 0,
      chatMessages: [],
      unreadCount: 0,
      isChatOpen: false,
      callPasswordHash: null,
      isInviteOpen: false,
      callInviteUrl: null,
      peerUsernames: new Map(),
    })
  },
}))
