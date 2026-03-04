import { create } from 'zustand'
import type { Peer, MediaConnection } from 'peerjs'

export type VideoCallStatus = 'idle' | 'generating' | 'ready' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed'

interface VideoState {
  peer: Peer | null
  mediaConnection: MediaConnection | null
  callStatus: VideoCallStatus
  callCode: string | null
  localStream: MediaStream | null
  remoteCameraStream: MediaStream | null
  remoteScreenStream: MediaStream | null
  screenStream: MediaStream | null
  isMicMuted: boolean
  isCameraOff: boolean
  isScreenSharing: boolean
  isSpeakerMuted: boolean
  callStartTime: number | null
  callDuration: number
  remoteDisplay: 'camera' | 'screen'

  setPeer: (peer: Peer | null) => void
  setMediaConnection: (conn: MediaConnection | null) => void
  setCallStatus: (status: VideoCallStatus) => void
  setCallCode: (code: string | null) => void
  setLocalStream: (stream: MediaStream | null) => void
  setRemoteCameraStream: (stream: MediaStream | null) => void
  setRemoteScreenStream: (stream: MediaStream | null) => void
  setScreenStream: (stream: MediaStream | null) => void
  toggleMic: () => void
  toggleCamera: () => void
  toggleSpeaker: () => void
  setIsScreenSharing: (sharing: boolean) => void
  setCallStartTime: (time: number | null) => void
  setCallDuration: (duration: number) => void
  setRemoteDisplay: (mode: 'camera' | 'screen') => void
  resetCall: () => void
}

export const useVideoStore = create<VideoState>((set, get) => ({
  peer: null,
  mediaConnection: null,
  callStatus: 'idle',
  callCode: null,
  localStream: null,
  remoteCameraStream: null,
  remoteScreenStream: null,
  screenStream: null,
  isMicMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  isSpeakerMuted: false,
  callStartTime: null,
  callDuration: 0,
  remoteDisplay: 'camera',

  setPeer: (peer) => set({ peer }),
  setMediaConnection: (conn) => set({ mediaConnection: conn }),
  setCallStatus: (status) => set({ callStatus: status }),
  setCallCode: (code) => set({ callCode: code }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteCameraStream: (stream) => set({ remoteCameraStream: stream }),
  setRemoteScreenStream: (stream) => set({ remoteScreenStream: stream }),
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
  setRemoteDisplay: (mode) => set({ remoteDisplay: mode }),
  resetCall: () => {
    const { localStream, screenStream, peer, mediaConnection } = get()
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
    }
    if (mediaConnection) {
      mediaConnection.close()
    }
    if (peer) {
      peer.destroy()
    }
    set({
      peer: null,
      mediaConnection: null,
      callStatus: 'idle',
      callCode: null,
      localStream: null,
      remoteCameraStream: null,
      remoteScreenStream: null,
      screenStream: null,
      isMicMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      isSpeakerMuted: false,
      callStartTime: null,
      callDuration: 0,
      remoteDisplay: 'camera',
    })
  },
}))
