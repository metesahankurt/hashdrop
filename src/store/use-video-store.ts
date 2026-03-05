import { create } from 'zustand'
import type { Peer, MediaConnection } from 'peerjs'

export type VideoCallStatus = 'idle' | 'generating' | 'ready' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed'

export interface RemotePeerStreams {
  camera: MediaStream | null
  screen: MediaStream | null
}

interface VideoState {
  peer: Peer | null
  // Map of peerId → MediaConnection (supports up to 4 remote peers)
  mediaConnections: Map<string, MediaConnection>
  // Map of peerId → { camera, screen } streams
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

  setPeer: (peer: Peer | null) => void
  addMediaConnection: (peerId: string, conn: MediaConnection) => void
  removeMediaConnection: (peerId: string) => void
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
  resetCall: () => void
}

export const useVideoStore = create<VideoState>((set, get) => ({
  peer: null,
  mediaConnections: new Map(),
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
      if (audioTrack) {
        audioTrack.enabled = isMicMuted
      }
    }
    set({ isMicMuted: !isMicMuted })
  },

  toggleCamera: () => {
    const { localStream, isCameraOff } = get()
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = isCameraOff
      }
    }
    set({ isCameraOff: !isCameraOff })
  },

  toggleSpeaker: () => {
    set((state) => ({ isSpeakerMuted: !state.isSpeakerMuted }))
  },

  setIsScreenSharing: (sharing) => set({ isScreenSharing: sharing }),
  setCallStartTime: (time) => set({ callStartTime: time }),
  setCallDuration: (duration) => set({ callDuration: duration }),

  resetCall: () => {
    const { localStream, screenStream, peer, mediaConnections } = get()
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
    }
    mediaConnections.forEach(conn => {
      try { conn.close() } catch { /* ignore */ }
    })
    if (peer) {
      peer.destroy()
    }
    set({
      peer: null,
      mediaConnections: new Map(),
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
    })
  },
}))
