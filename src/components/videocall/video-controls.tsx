'use client'

import { useCallback, useEffect } from 'react'
import { Mic, MicOff, Camera, CameraOff, PhoneOff, MonitorUp, MonitorOff, Volume2, VolumeOff } from 'lucide-react'
import { useVideoStore } from '@/store/use-video-store'
import { toast } from 'sonner'

interface VideoControlsProps {
  onEndCall?: () => void
  preCall?: boolean
}

export function VideoControls({ onEndCall, preCall = false }: VideoControlsProps) {
  const {
    isMicMuted, isCameraOff, isScreenSharing, isSpeakerMuted,
    toggleMic, toggleCamera, toggleSpeaker,
    mediaConnections,
    screenStream, setScreenStream, setIsScreenSharing,
  } = useVideoStore()

  // Add a screen track to all active peer connections
  const addScreenTrackToAll = useCallback((track: MediaStreamTrack, stream: MediaStream) => {
    mediaConnections.forEach((conn) => {
      const pc = conn.peerConnection
      if (!pc) return
      const alreadySending = pc.getSenders().some(s => s.track?.id === track.id)
      if (!alreadySending) {
        pc.addTrack(track, stream)
      }
    })
  }, [mediaConnections])

  // Remove a screen track from all active peer connections
  const removeScreenTrackFromAll = useCallback((track: MediaStreamTrack) => {
    mediaConnections.forEach((conn) => {
      const pc = conn.peerConnection
      if (!pc) return
      const sender = pc.getSenders().find(s => s.track?.id === track.id)
      if (sender) {
        pc.removeTrack(sender)
      }
    })
  }, [mediaConnections])

  const handleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      const { screenStream: currentScreen } = useVideoStore.getState()
      if (currentScreen) {
        const screenTrack = currentScreen.getVideoTracks()[0]
        if (screenTrack) {
          removeScreenTrackFromAll(screenTrack)
          screenTrack.stop()
        }
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

        // When user stops sharing via browser UI
        screenTrack.onended = () => {
          removeScreenTrackFromAll(screenTrack)
          setScreenStream(null)
          setIsScreenSharing(false)
          toast.info('Screen sharing stopped')
        }
      }

      toast.success('Screen sharing started')
    } catch (err) {
      if ((err as Error).name !== 'NotAllowedError') {
        console.error('[ScreenShare] Error:', err)
        toast.error('Could not start screen sharing')
      }
    }
  }, [isScreenSharing, addScreenTrackToAll, removeScreenTrackFromAll, setScreenStream, setIsScreenSharing])

  // When a new connection is added mid-session and screen sharing is active, add the track
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
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const { callDuration } = useVideoStore()

  return (
    <div className="flex items-center justify-center gap-3 md:gap-4 flex-wrap">
      {/* Call Duration */}
      {callDuration > 0 && (
        <span className="text-sm text-muted font-mono mr-1 hidden sm:inline">
          {formatDuration(callDuration)}
        </span>
      )}

      {/* Mic Toggle */}
      <button
        onClick={toggleMic}
        className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
          isMicMuted
            ? 'bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30'
            : 'glass-card hover:bg-white/10 text-foreground'
        }`}
        title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {/* Camera Toggle */}
      <button
        onClick={toggleCamera}
        className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
          isCameraOff
            ? 'bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30'
            : 'glass-card hover:bg-white/10 text-foreground'
        }`}
        title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
      >
        {isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
      </button>

      {/* Speaker Toggle */}
      <button
        onClick={toggleSpeaker}
        className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
          isSpeakerMuted
            ? 'bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30'
            : 'glass-card hover:bg-white/10 text-foreground'
        }`}
        title={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
      >
        {isSpeakerMuted ? <VolumeOff className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Screen Share Toggle */}
      <button
        onClick={handleScreenShare}
        className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
          isScreenSharing
            ? 'bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30'
            : 'glass-card hover:bg-white/10 text-foreground'
        }`}
        title={isScreenSharing ? 'Stop screen sharing' : preCall ? 'Prepare screen sharing' : 'Share screen'}
      >
        {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
      </button>

      {/* End Call - only in call */}
      {!preCall && onEndCall && (
        <button
          onClick={onEndCall}
          className="w-13 h-11 md:w-14 md:h-12 rounded-full bg-danger hover:bg-danger/80 text-white flex items-center justify-center transition-all px-4"
          title="End call"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
