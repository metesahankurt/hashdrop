'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Video, Mic, MicOff, VideoOff, Check, X, User } from 'lucide-react'
import { useVideoStore } from '@/store/use-video-store'
import { useUsernameStore } from '@/store/use-username-store'
import { getLocalMediaStreamWithFallback, isPortraitTrack } from '@/lib/media-utils'

interface VideoLobbyProps {
  /** Called when user confirms joining */
  onJoin: () => void
  /** Called when user declines */
  onDecline: () => void
}

export function VideoLobby({ onJoin, onDecline }: VideoLobbyProps) {
  const { localStream, setLocalStream, isCameraOff, isMicMuted, toggleCamera, toggleMic } = useVideoStore()
  const { username } = useUsernameStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPortrait, setIsPortrait] = useState(false)

  // Ensure we have a local stream for preview
  useEffect(() => {
    if (!localStream) {
      getLocalMediaStreamWithFallback()
        .then(({ stream, hasVideo }) => {
          setLocalStream(stream)
          if (!hasVideo) useVideoStore.getState().toggleCamera()
        })
        .catch(() => {})
    }
  }, [localStream, setLocalStream])

  // Mirror preview
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (!localStream || isCameraOff) {
      setIsPortrait(false)
      return
    }
    const track = localStream.getVideoTracks()[0]
    if (!track) {
      setIsPortrait(false)
      return
    }
    setIsPortrait(isPortraitTrack(track))
    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      setIsPortrait(isPortraitTrack(track))
      const settings = track.getSettings()
      if ((settings.width && settings.height) || attempts > 20) clearInterval(interval)
    }, 200)
    return () => clearInterval(interval)
  }, [localStream, isCameraOff])

  const handleJoin = useCallback(() => {
    onJoin()
  }, [onJoin])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm mx-auto flex flex-col items-center gap-6 text-center"
    >
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-foreground">
          Someone wants to{' '}
          <span className="text-primary font-bold">Video Call</span>
        </h2>
        <p className="text-sm text-muted">Preview your camera before joining</p>
      </div>

      {/* Camera preview */}
      <div className={`relative w-full rounded-2xl overflow-hidden bg-white/5 border border-border ${isPortrait ? 'aspect-[3/4] max-w-sm mx-auto' : 'aspect-video'}`}>
        {localStream && !isCameraOff ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full scale-x-[-1] ${isPortrait ? 'object-contain' : 'object-cover'}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/10 border border-border flex items-center justify-center">
              <User className="w-8 h-8 text-muted" />
            </div>
          </div>
        )}

        {/* Username badge */}
        {username && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-medium">
            {username}
          </div>
        )}
      </div>

      {/* Quick controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMic}
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
            isMicMuted
              ? 'bg-danger/20 border-danger/30 text-danger'
              : 'bg-white/10 border-border text-foreground hover:bg-white/15'
          }`}
          title={isMicMuted ? 'Unmute mic' : 'Mute mic'}
        >
          {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button
          onClick={toggleCamera}
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
            isCameraOff
              ? 'bg-danger/20 border-danger/30 text-danger'
              : 'bg-white/10 border-border text-foreground hover:bg-white/15'
          }`}
          title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 w-full">
        <button
          onClick={onDecline}
          className="flex-1 py-3 rounded-xl glass-card text-sm font-medium text-muted hover:text-foreground hover:bg-white/10 transition-all flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Decline
        </button>
        <button
          onClick={handleJoin}
          className="flex-1 py-3 rounded-xl glass-btn-primary text-sm font-medium flex items-center justify-center gap-2 group"
        >
          <Check className="w-4 h-4" />
          Join Call
        </button>
      </div>

      <p className="text-xs text-muted/60">Encrypted peer-to-peer connection</p>
    </motion.div>
  )
}
