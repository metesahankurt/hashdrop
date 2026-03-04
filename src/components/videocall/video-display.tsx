'use client'

import { useEffect, useRef, useCallback, useMemo } from 'react'
import { CameraOff, User, MonitorUp } from 'lucide-react'
import { useVideoStore } from '@/store/use-video-store'

export function VideoDisplay() {
  const {
    localStream,
    remoteCameraStream,
    remoteScreenStream,
    remoteDisplay,
    setRemoteDisplay,
    screenStream,
    isCameraOff,
    isScreenSharing,
    isSpeakerMuted,
    callStatus,
  } = useVideoStore()
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)

  const displayRemoteStream = useMemo(() => {
    if (remoteDisplay === 'screen' && remoteScreenStream) return remoteScreenStream
    if (remoteCameraStream) return remoteCameraStream
    if (remoteScreenStream) return remoteScreenStream
    return null
  }, [remoteDisplay, remoteCameraStream, remoteScreenStream])

  // Use callback ref for local video so srcObject is set whenever the element mounts
  const localVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && localStream) {
      node.srcObject = localStream
    }
  }, [localStream])

  // Set remote video srcObject
  useEffect(() => {
    if (remoteVideoRef.current && displayRemoteStream) {
      remoteVideoRef.current.srcObject = displayRemoteStream
    }
  }, [displayRemoteStream])

  // Set screen preview srcObject (pre-call)
  useEffect(() => {
    if (screenVideoRef.current && screenStream && isScreenSharing) {
      screenVideoRef.current.srcObject = screenStream
    }
  }, [screenStream, isScreenSharing])

  // Handle speaker mute
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isSpeakerMuted
    }
  }, [isSpeakerMuted])

  // Show local video in PiP?
  const showLocalVideo = localStream && !isCameraOff

  return (
    <div className="relative w-full aspect-video max-h-[70vh] rounded-2xl overflow-hidden glass-card">
      {/* Remote Video (full area) */}
      {displayRemoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : isScreenSharing && screenStream ? (
        <video
          ref={screenVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-border flex items-center justify-center">
            <User className="w-10 h-10 text-muted" />
          </div>
          {callStatus === 'connected' ? (
            <p className="text-sm text-muted">Waiting for peer video...</p>
          ) : callStatus === 'calling' ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-sm text-muted">Calling...</p>
            </div>
          ) : (
            <p className="text-sm text-muted">No one here yet</p>
          )}
        </div>
      )}

      {/* Remote screen toggle */}
      {remoteScreenStream && remoteCameraStream && (
        <button
          onClick={() => setRemoteDisplay(remoteDisplay === 'screen' ? 'camera' : 'screen')}
          className="absolute top-4 right-4 glass-card px-3 py-1.5 text-xs text-foreground hover:bg-white/10 transition-all"
        >
          {remoteDisplay === 'screen' ? 'Kamerayı İzle' : 'Yayını İzle'}
        </button>
      )}

      {/* Screen sharing indicator */}
      {isScreenSharing && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-primary/20 border border-primary/40 rounded-lg px-3 py-1.5">
          <MonitorUp className="w-4 h-4 text-primary" />
          <span className="text-xs text-primary font-medium">Sharing screen</span>
        </div>
      )}

      {/* Local Video (PiP overlay) */}
      {localStream && (
        <div className="absolute bottom-4 right-4 w-36 md:w-48 aspect-video rounded-xl overflow-hidden border border-border shadow-lg">
          {showLocalVideo ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: isScreenSharing ? 'none' : 'scaleX(-1)' }}
            />
          ) : (
            <div className="w-full h-full bg-background/90 flex items-center justify-center">
              <CameraOff className="w-6 h-6 text-muted" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
