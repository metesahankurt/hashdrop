'use client'

import { useCallback, useEffect } from 'react'
import { Mic, MicOff, Camera, CameraOff, PhoneOff, MonitorUp, MonitorOff, Volume2, VolumeOff, MessageSquare } from 'lucide-react'
import { useVideoStore } from '@/store/use-video-store'
import { toast } from 'sonner'

interface VideoControlsProps {
  onEndCall?: () => void
  onToggleChat?: () => void
  preCall?: boolean
}

export function VideoControls({ onEndCall, onToggleChat, preCall = false }: VideoControlsProps) {
  const {
    isMicMuted, isCameraOff, isScreenSharing, isSpeakerMuted,
    toggleMic, toggleCamera, toggleSpeaker,
    mediaConnections,
    screenStream, setScreenStream, setIsScreenSharing,
    unreadCount, isChatOpen,
  } = useVideoStore()

  const addScreenTrackToAll = useCallback((track: MediaStreamTrack, stream: MediaStream) => {
    mediaConnections.forEach((conn) => {
      const pc = conn.peerConnection
      if (!pc) return
      const alreadySending = pc.getSenders().some(s => s.track?.id === track.id)
      if (!alreadySending) pc.addTrack(track, stream)
    })
  }, [mediaConnections])

  const removeScreenTrackFromAll = useCallback((track: MediaStreamTrack) => {
    mediaConnections.forEach((conn) => {
      const pc = conn.peerConnection
      if (!pc) return
      const sender = pc.getSenders().find(s => s.track?.id === track.id)
      if (sender) pc.removeTrack(sender)
    })
  }, [mediaConnections])

  const handleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      const { screenStream: currentScreen } = useVideoStore.getState()
      if (currentScreen) {
        const screenTrack = currentScreen.getVideoTracks()[0]
        if (screenTrack) { removeScreenTrackFromAll(screenTrack); screenTrack.stop() }
      }
      setScreenStream(null)
      setIsScreenSharing(false)
      toast.info('Screen sharing stopped')
      return
    }
    try {
      const capturedStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as MediaTrackConstraints,
        audio: false,
      })
      setScreenStream(capturedStream)
      setIsScreenSharing(true)
      const screenTrack = capturedStream.getVideoTracks()[0]
      if (screenTrack) {
        addScreenTrackToAll(screenTrack, capturedStream)
        screenTrack.onended = () => {
          removeScreenTrackFromAll(screenTrack)
          setScreenStream(null)
          setIsScreenSharing(false)
          toast.info('Screen sharing stopped')
        }
      }
      toast.success('Screen sharing started')
    } catch (err) {
      if ((err as Error).name !== 'NotAllowedError') { console.error('[ScreenShare]', err); toast.error('Could not start screen sharing') }
    }
  }, [isScreenSharing, addScreenTrackToAll, removeScreenTrackFromAll, setScreenStream, setIsScreenSharing])

  useEffect(() => {
    if (!isScreenSharing || !screenStream) return
    const screenTrack = screenStream.getVideoTracks()[0]
    if (!screenTrack) return
    addScreenTrackToAll(screenTrack, screenStream)
  }, [mediaConnections, isScreenSharing, screenStream, addScreenTrackToAll])

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const { callDuration } = useVideoStore()

  return (
    <div className="flex items-center justify-center gap-3 md:gap-4 flex-wrap">
      {callDuration > 0 && (
        <span className="text-sm text-muted font-mono mr-1 hidden sm:inline">{formatDuration(callDuration)}</span>
      )}

      {/* Mic */}
      <button onClick={toggleMic} className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isMicMuted ? 'bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30' : 'glass-card hover:bg-white/10 text-foreground'}`} title={isMicMuted ? 'Unmute' : 'Mute'}>
        {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {/* Camera */}
      <button onClick={toggleCamera} className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isCameraOff ? 'bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30' : 'glass-card hover:bg-white/10 text-foreground'}`} title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}>
        {isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
      </button>

      {/* Speaker */}
      <button onClick={toggleSpeaker} className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isSpeakerMuted ? 'bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30' : 'glass-card hover:bg-white/10 text-foreground'}`} title={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}>
        {isSpeakerMuted ? <VolumeOff className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Screen Share */}
      <button onClick={handleScreenShare} className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? 'bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30' : 'glass-card hover:bg-white/10 text-foreground'}`} title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
        {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
      </button>

      {/* Chat toggle — only in-call */}
      {!preCall && onToggleChat && (
        <button
          onClick={onToggleChat}
          className={`relative w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isChatOpen ? 'bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30' : 'glass-card hover:bg-white/10 text-foreground'}`}
          title="Chat"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* End Call */}
      {!preCall && onEndCall && (
        <button onClick={onEndCall} className="w-13 h-11 md:w-14 md:h-12 rounded-full bg-danger hover:bg-danger/80 text-white flex items-center justify-center transition-all px-4" title="End call">
          <PhoneOff className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
