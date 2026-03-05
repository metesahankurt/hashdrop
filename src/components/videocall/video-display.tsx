'use client'

import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { CameraOff, User, MonitorUp } from 'lucide-react'
import { useVideoStore } from '@/store/use-video-store'
import { isPortraitTrack } from '@/lib/media-utils'

// ---------- Individual video tile ----------

interface VideoTileProps {
  stream: MediaStream | null
  label: string
  muted?: boolean
  mirror?: boolean
  isScreen?: boolean
  className?: string
}

function VideoTile({ stream, label, muted = false, mirror = false, isScreen = false, className = '' }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (stream) {
      el.srcObject = stream
      // Detect portrait orientation from track settings
      const videoTrack = stream.getVideoTracks()[0] || null
      setIsPortrait(isPortraitTrack(videoTrack))
    } else {
      el.srcObject = null
      setIsPortrait(false)
    }
  }, [stream])

  const videoStyle: React.CSSProperties = {
    transform: mirror ? 'scaleX(-1)' : undefined,
    objectFit: isScreen ? 'contain' : (isPortrait ? 'contain' : 'cover'),
  }

  return (
    <div className={`relative rounded-xl overflow-hidden bg-black/60 flex items-center justify-center ${className}`}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full"
          style={videoStyle}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <User className="w-6 h-6 text-white/50" />
          </div>
          <span className="text-xs text-white/40">{label}</span>
        </div>
      )}

      {/* Camera off overlay */}
      {stream && stream.getVideoTracks().length > 0 && !stream.getVideoTracks()[0].enabled && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <CameraOff className="w-6 h-6 text-white/40" />
        </div>
      )}

      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
        <span className="text-xs text-white/80 font-medium truncate block">{label}</span>
      </div>
    </div>
  )
}

// ---------- Main VideoDisplay ----------

export function VideoDisplay() {
  const {
    localStream,
    remoteStreams,
    screenStream,
    isCameraOff,
    isScreenSharing,
    isSpeakerMuted,
    callStatus,
  } = useVideoStore()

  // Find any active screen share stream (local or remote)
  const localScreenStream = isScreenSharing ? screenStream : null
  const remoteScreenEntry = useMemo(() => {
    for (const [peerId, streams] of remoteStreams) {
      if (streams.screen) return { peerId, stream: streams.screen }
    }
    return null
  }, [remoteStreams])

  const activeScreenStream = localScreenStream || remoteScreenEntry?.stream || null
  const screenOwnerLabel = localScreenStream
    ? 'You (screen)'
    : remoteScreenEntry
      ? `Peer (screen)`
      : ''

  // Build list of camera participant entries
  const remotePeerIds = useMemo(() => Array.from(remoteStreams.keys()), [remoteStreams])

  // Pre-call: simple local preview (aspect-video like before)
  const isPreCall = callStatus !== 'connected'

  // Local video callback ref
  const localVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && localStream) {
      node.srcObject = localStream
    }
  }, [localStream])

  // Speaker mute for all remote videos handled per-tile via muted prop
  // We pass isSpeakerMuted down to remote tiles

  // ----- PRE-CALL VIEW -----
  if (isPreCall) {
    return (
      <div className="relative w-full aspect-video max-h-[70vh] rounded-2xl overflow-hidden glass-card">
        {/* Local preview */}
        {isScreenSharing && screenStream ? (
          <ScreenPreview stream={screenStream} />
        ) : localStream && !isCameraOff ? (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full"
            style={{ objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-border flex items-center justify-center">
              <User className="w-10 h-10 text-muted" />
            </div>
            <p className="text-sm text-muted">
              {callStatus === 'calling' ? 'Calling...' : 'No one here yet'}
            </p>
          </div>
        )}

        {/* Screen sharing indicator for pre-call */}
        {isScreenSharing && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-primary/20 border border-primary/40 rounded-lg px-3 py-1.5">
            <MonitorUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary font-medium">Sharing screen</span>
          </div>
        )}

        {/* PiP local when screen sharing */}
        {isScreenSharing && localStream && !isCameraOff && (
          <div className="absolute bottom-4 right-4 w-32 md:w-44 rounded-xl overflow-hidden border border-border shadow-lg bg-black">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
        )}
      </div>
    )
  }

  // ----- IN-CALL VIEW -----

  // Case 1: Screen share active → Meet-style layout
  if (activeScreenStream) {
    return (
      <div className="w-full flex flex-col md:flex-row gap-2" style={{ minHeight: '60vh' }}>
        {/* Main area: screen share */}
        <div className="flex-1 rounded-2xl overflow-hidden glass-card bg-black relative" style={{ minHeight: '55vw', maxHeight: '75vh' }}>
          <video
            autoPlay
            playsInline
            muted={!!localScreenStream}
            ref={(el) => { if (el && activeScreenStream) el.srcObject = activeScreenStream }}
            className="w-full h-full"
            style={{ objectFit: 'contain' }}
          />
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-primary/20 border border-primary/40 rounded-lg px-2.5 py-1">
            <MonitorUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-medium">{screenOwnerLabel}</span>
          </div>
        </div>

        {/* Side / bottom strip: participant cameras */}
        <div className="flex md:flex-col flex-row gap-2 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden md:w-44"
          style={{ maxHeight: '75vh' }}>
          {/* Local */}
          <div className="flex-shrink-0 md:w-full w-28 aspect-video rounded-xl overflow-hidden glass-card bg-black">
            {localStream && !isCameraOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full"
                style={{
                  objectFit: isPortraitTrack(localStream?.getVideoTracks()[0] || null) ? 'contain' : 'cover',
                  transform: 'scaleX(-1)'
                }}
              />
            ) : (
              <CamOffPlaceholder label="You" />
            )}
          </div>

          {/* Remote cameras */}
          {remotePeerIds.map((pid, i) => {
            const streams = remoteStreams.get(pid)
            const camStream = streams?.camera || null
            const track = camStream?.getVideoTracks()[0] || null
            return (
              <div key={pid} className="flex-shrink-0 md:w-full w-28 aspect-video rounded-xl overflow-hidden glass-card bg-black">
                {camStream ? (
                  <video
                    autoPlay
                    playsInline
                    muted={isSpeakerMuted}
                    ref={(el) => { if (el && camStream) el.srcObject = camStream }}
                    className="w-full h-full"
                    style={{ objectFit: isPortraitTrack(track) ? 'contain' : 'cover' }}
                  />
                ) : (
                  <CamOffPlaceholder label={`Peer ${i + 1}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Case 2: No screen share → responsive grid
  const totalParticipants = 1 + remotePeerIds.length // local + remotes
  const gridClass = getGridClass(totalParticipants)

  return (
    <div className={`w-full grid gap-2 ${gridClass}`} style={{ minHeight: '55vh', maxHeight: '80vh' }}>
      {/* Local tile */}
      <div className={`rounded-2xl overflow-hidden glass-card bg-black relative ${totalParticipants === 1 ? 'aspect-video' : 'aspect-video'}`}>
        {localStream && !isCameraOff ? (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full"
            style={{
              objectFit: isPortraitTrack(localStream?.getVideoTracks()[0] || null) ? 'contain' : 'cover',
              transform: 'scaleX(-1)'
            }}
          />
        ) : (
          <CamOffPlaceholder label="You" />
        )}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
          <span className="text-xs text-white/80 font-medium">You</span>
        </div>
      </div>

      {/* Remote tiles */}
      {remotePeerIds.map((pid, i) => {
        const streams = remoteStreams.get(pid)
        const camStream = streams?.camera || null
        const track = camStream?.getVideoTracks()[0] || null
        return (
          <div key={pid} className="rounded-2xl overflow-hidden glass-card bg-black relative aspect-video">
            {camStream ? (
              <video
                autoPlay
                playsInline
                muted={isSpeakerMuted}
                ref={(el) => { if (el && camStream) el.srcObject = camStream }}
                className="w-full h-full"
                style={{ objectFit: isPortraitTrack(track) ? 'contain' : 'cover' }}
              />
            ) : (
              <CamOffPlaceholder label={`Peer ${i + 1}`} />
            )}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
              <span className="text-xs text-white/80 font-medium">Peer {i + 1}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Helper: camera-off placeholder
function CamOffPlaceholder({ label }: { label: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/20 flex items-center justify-center">
        <CameraOff className="w-6 h-6 text-white/30" />
      </div>
      <span className="text-xs text-white/40">{label}</span>
    </div>
  )
}

// Helper: screen preview in pre-call
function ScreenPreview({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className="w-full h-full"
      style={{ objectFit: 'contain' }}
    />
  )
}

// Grid class for N participants
function getGridClass(n: number): string {
  if (n === 1) return 'grid-cols-1'
  if (n === 2) return 'grid-cols-2'
  if (n === 3) return 'grid-cols-2' // 1+2 layout
  if (n === 4) return 'grid-cols-2' // 2x2
  return 'grid-cols-2' // 5: 2+2+1 (last centered via CSS)
}
