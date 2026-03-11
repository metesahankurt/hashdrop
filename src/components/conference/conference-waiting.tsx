'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocalParticipant } from '@livekit/components-react'
import { Clock, Mic, MicOff, Video, VideoOff } from 'lucide-react'
import { useConferenceStore } from '@/store/use-conference-store'

export function ConferenceWaiting() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const { username, roomName, isMicMuted, isCameraOff, setMicMuted, setCameraOff } = useConferenceStore()
  const { localParticipant } = useLocalParticipant()

  // Get local camera preview (just for preview, not published yet)
  useEffect(() => {
    let stream: MediaStream | null = null
    if (!isCameraOff) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((s) => {
          stream = s
          setLocalStream(s)
          if (videoRef.current) {
            videoRef.current.srcObject = s
          }
        })
        .catch(() => { /* no camera */ })
    }
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
      setLocalStream(null)
    }
  }, [isCameraOff])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Camera preview */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10">
          {!isCameraOff && localStream ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="text-2xl font-semibold text-foreground">
                  {username?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            </div>
          )}

          {/* Quick controls overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            <button
              onClick={() => setMicMuted(!isMicMuted)}
              className={`p-2 rounded-xl border transition-colors ${
                isMicMuted
                  ? 'bg-red-500/30 border-red-500/40 text-red-400'
                  : 'bg-black/50 border-white/20 text-white'
              }`}
            >
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setCameraOff(!isCameraOff)}
              className={`p-2 rounded-xl border transition-colors ${
                isCameraOff
                  ? 'bg-red-500/30 border-red-500/40 text-red-400'
                  : 'bg-black/50 border-white/20 text-white'
              }`}
            >
              {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Waiting message */}
        <div className="glass-card rounded-2xl p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7 text-yellow-400 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Waiting Room</h2>
            <p className="text-sm text-muted">
              Waiting for the host to let you in
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-muted">
            Waiting as <span className="text-foreground font-medium">{username}</span> in room{' '}
            <span className="text-primary font-mono">{roomName}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  )
}
