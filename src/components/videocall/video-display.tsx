'use client'

import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { CameraOff, User, MonitorUp } from 'lucide-react'
import { useVideoStore } from '@/store/use-video-store'
import { isPortraitTrack } from '@/lib/media-utils'
import { VideoLightbox, ExpandHint } from './video-lightbox'

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

  // Lightbox state
  const [lightboxStream, setLightboxStream] = useState<MediaStream | null>(null)
  const [lightboxLabel, setLightboxLabel] = useState('')
  const [lightboxMuted, setLightboxMuted] = useState(false)

  const openLightbox = useCallback((stream: MediaStream | null, label: string, muted = false) => {
    if (!stream) return
    setLightboxStream(stream)
    setLightboxLabel(label)
    setLightboxMuted(muted)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxStream(null)
  }, [])

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
      ? 'Peer (screen)'
      : ''

  // Build list of camera participant entries
  const remotePeerIds = useMemo(() => Array.from(remoteStreams.keys()), [remoteStreams])

  // Local video callback ref
  const localVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && localStream) {
      node.srcObject = localStream
    }
  }, [localStream])

  // ----- PRE-CALL VIEW -----
  const isPreCall = callStatus !== 'connected'

  if (isPreCall) {
    return (
      <div className="relative w-full aspect-video max-h-[70vh] rounded-2xl overflow-hidden glass-card">
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

        {isScreenSharing && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-primary/20 border border-primary/40 rounded-lg px-3 py-1.5">
            <MonitorUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary font-medium">Sharing screen</span>
          </div>
        )}

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
      <>
        <div className="w-full flex flex-col md:flex-row gap-2" style={{ minHeight: '60vh' }}>
          {/* Main area: screen share — clickable to expand */}
          <div
            className="flex-1 rounded-2xl overflow-hidden glass-card bg-black relative group cursor-pointer"
            style={{ minHeight: '55vw', maxHeight: '75vh' }}
            onClick={() => openLightbox(activeScreenStream, screenOwnerLabel)}
          >
            <ScreenVideo stream={activeScreenStream} muted={!!localScreenStream} />
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-primary/20 border border-primary/40 rounded-lg px-2.5 py-1">
              <MonitorUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary font-medium">{screenOwnerLabel}</span>
            </div>
            <ExpandHint />
          </div>

          {/* Side / bottom strip: participant cameras */}
          <div
            className="flex md:flex-col flex-row gap-2 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden md:w-44"
            style={{ maxHeight: '75vh' }}
          >
            {/* Local */}
            <div
              className="flex-shrink-0 md:w-full w-28 aspect-video rounded-xl overflow-hidden glass-card bg-black relative group cursor-pointer"
              onClick={() => localStream ? openLightbox(localStream, 'You', true) : null}
            >
              {localStream && !isCameraOff ? (
                <LocalVideoEl
                  stream={localStream}
                  videoRef={localVideoRef}
                />
              ) : (
                <CamOffPlaceholder label="You" />
              )}
              <TileLabel label="You" />
              <ExpandHint />
            </div>

            {/* Remote cameras */}
            {remotePeerIds.map((pid, i) => {
              const streams = remoteStreams.get(pid)
              const camStream = streams?.camera || null
              const track = camStream?.getVideoTracks()[0] || null
              return (
                <div
                  key={pid}
                  className="flex-shrink-0 md:w-full w-28 aspect-video rounded-xl overflow-hidden glass-card bg-black relative group cursor-pointer"
                  onClick={() => camStream ? openLightbox(camStream, `Peer ${i + 1}`) : null}
                >
                  {camStream ? (
                    <RemoteVideoEl stream={camStream} muted={isSpeakerMuted} track={track} />
                  ) : (
                    <CamOffPlaceholder label={`Peer ${i + 1}`} />
                  )}
                  <TileLabel label={`Peer ${i + 1}`} />
                  <ExpandHint />
                </div>
              )
            })}
          </div>
        </div>

        <VideoLightbox
          stream={lightboxStream}
          label={lightboxLabel}
          muted={lightboxMuted}
          onClose={closeLightbox}
        />
      </>
    )
  }

  // Case 2: No screen share → responsive grid
  const totalParticipants = 1 + remotePeerIds.length
  const gridClass = getGridClass(totalParticipants)

  return (
    <>
      <div className={`w-full grid gap-2 ${gridClass}`} style={{ minHeight: '55vh', maxHeight: '80vh' }}>
        {/* Local tile */}
        <div
          className="rounded-2xl overflow-hidden glass-card bg-black relative aspect-video group cursor-pointer"
          onClick={() => localStream ? openLightbox(localStream, 'You', true) : null}
        >
          {localStream && !isCameraOff ? (
            <LocalVideoEl stream={localStream} videoRef={localVideoRef} />
          ) : (
            <CamOffPlaceholder label="You" />
          )}
          <TileLabel label="You" />
          <ExpandHint />
        </div>

        {/* Remote tiles */}
        {remotePeerIds.map((pid, i) => {
          const streams = remoteStreams.get(pid)
          const camStream = streams?.camera || null
          const track = camStream?.getVideoTracks()[0] || null
          return (
            <div
              key={pid}
              className="rounded-2xl overflow-hidden glass-card bg-black relative aspect-video group cursor-pointer"
              onClick={() => camStream ? openLightbox(camStream, `Peer ${i + 1}`) : null}
            >
              {camStream ? (
                <RemoteVideoEl stream={camStream} muted={isSpeakerMuted} track={track} />
              ) : (
                <CamOffPlaceholder label={`Peer ${i + 1}`} />
              )}
              <TileLabel label={`Peer ${i + 1}`} />
              <ExpandHint />
            </div>
          )
        })}
      </div>

      <VideoLightbox
        stream={lightboxStream}
        label={lightboxLabel}
        muted={lightboxMuted}
        onClose={closeLightbox}
      />
    </>
  )
}

// ---------- Sub-components ----------

function LocalVideoEl({ stream, videoRef }: { stream: MediaStream; videoRef: (node: HTMLVideoElement | null) => void }) {
  const track = stream.getVideoTracks()[0] || null
  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="w-full h-full"
      style={{
        objectFit: isPortraitTrack(track) ? 'contain' : 'cover',
        transform: 'scaleX(-1)',
      }}
    />
  )
}

function RemoteVideoEl({ stream, muted, track }: { stream: MediaStream; muted: boolean; track: MediaStreamTrack | null }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className="w-full h-full"
      style={{ objectFit: isPortraitTrack(track) ? 'contain' : 'cover' }}
    />
  )
}

function ScreenVideo({ stream, muted }: { stream: MediaStream; muted: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className="w-full h-full"
      style={{ objectFit: 'contain' }}
    />
  )
}

function ScreenPreview({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])
  return (
    <video ref={ref} autoPlay playsInline muted className="w-full h-full" style={{ objectFit: 'contain' }} />
  )
}

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

function TileLabel({ label }: { label: string }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
      <span className="text-xs text-white/80 font-medium truncate block">{label}</span>
    </div>
  )
}

function getGridClass(n: number): string {
  if (n === 1) return 'grid-cols-1'
  if (n === 2) return 'grid-cols-2'
  return 'grid-cols-2'
}
