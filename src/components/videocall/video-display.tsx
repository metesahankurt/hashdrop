'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { MicOff, MonitorUp, Users, UserRound } from 'lucide-react'
import { useVideoStore } from '@/store/use-video-store'
import { useUsernameStore } from '@/store/use-username-store'
import { isPortraitTrack } from '@/lib/media-utils'
import { VideoLightbox, ExpandHint } from './video-lightbox'
import { clsx } from 'clsx'

// ---------- Audio level hook (active speaker detection) ----------

function useAudioLevel(stream: MediaStream | null, active = true): boolean {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const rafRef = useRef<number>(undefined)
  const ctxRef = useRef<AudioContext>(undefined)

  useEffect(() => {
    if (!stream || !active) { setIsSpeaking(false); return }
    const audioTrack = stream.getAudioTracks()[0]
    if (!audioTrack) { setIsSpeaking(false); return }

    let analyser: AnalyserNode
    let data: Uint8Array<ArrayBuffer>
    try {
      const ctx = new AudioContext()
      ctxRef.current = ctx
      analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      data = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
    } catch { return }

    let lastCheck = 0
    const check = (ts: number) => {
      rafRef.current = requestAnimationFrame(check)
      if (ts - lastCheck < 100) return // ~10fps check
      lastCheck = ts
      analyser.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length
      setIsSpeaking(avg > 12)
    }
    rafRef.current = requestAnimationFrame(check)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      ctxRef.current?.close().catch(() => {})
    }
  }, [stream, active])

  return isSpeaking
}

// ---------- Main VideoDisplay ----------

export function VideoDisplay() {
  const {
    localStream,
    remoteStreams,
    screenStream,
    isCameraOff,
    isMicMuted,
    isScreenSharing,
    isSpeakerMuted,
    callStatus,
    peerUsernames,
  } = useVideoStore()

  const localUsername = useUsernameStore((s) => s.username)

  // Track portrait detection
  const [isPortrait, setIsPortrait] = useState(false)
  useEffect(() => {
    if (!localStream) { setIsPortrait(false); return }
    const track = localStream.getVideoTracks()[0]
    if (!track) { setIsPortrait(false); return }
    setIsPortrait(isPortraitTrack(track))
    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      setIsPortrait(isPortraitTrack(track))
      const s = track.getSettings()
      if ((s.width && s.height) || attempts > 20) clearInterval(interval)
    }, 200)
    return () => clearInterval(interval)
  }, [localStream])

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

  const closeLightbox = useCallback(() => setLightboxStream(null), [])

  const localScreenStream = isScreenSharing ? screenStream : null
  const remoteScreenEntry = (() => {
    for (const [peerId, streams] of remoteStreams) {
      if (streams.screen) return { peerId, stream: streams.screen }
    }
    return null
  })()

  const activeScreenStream = localScreenStream || remoteScreenEntry?.stream || null
  const localLabel = localUsername || 'You'

  const screenOwnerLabel = localScreenStream
    ? `${localLabel} (screen)`
    : remoteScreenEntry
      ? `${peerUsernames.get(remoteScreenEntry.peerId) || 'Peer'} (screen)`
      : ''

  const remotePeerIds = Array.from(remoteStreams.keys())

  const localVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && localStream) node.srcObject = localStream
  }, [localStream])

  // ----- PRE-CALL VIEW -----
  const isPreCall = callStatus !== 'connected' && callStatus !== 'waiting'

  if (isPreCall) {
    return (
      <div className={`relative w-full max-h-[70vh] rounded-2xl overflow-hidden glass-card ${isPortrait && !isScreenSharing ? 'aspect-[3/4] max-w-sm mx-auto' : 'aspect-video'}`}>
        {isScreenSharing && screenStream ? (
          <ScreenPreview stream={screenStream} />
        ) : localStream && !isCameraOff ? (
          <video
            ref={localVideoRef}
            autoPlay muted playsInline
            className="w-full h-full"
            style={{ objectFit: isPortrait ? 'contain' : 'cover', transform: 'scaleX(-1)' }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-border flex items-center justify-center">
              <UserRound className="w-10 h-10 text-muted" />
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
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          </div>
        )}
      </div>
    )
  }

  // ----- IN-CALL VIEW -----
  const isWaiting = callStatus === 'waiting' && remotePeerIds.length === 0

  // Case 1: Screen share → Meet-style layout
  if (activeScreenStream) {
    return (
      <>
        <div className="w-full h-full min-h-0 flex flex-col md:flex-row gap-2">
          <div
            className="flex-1 min-h-0 rounded-2xl overflow-hidden bg-black border border-white/10 relative group cursor-pointer"
            onClick={() => openLightbox(activeScreenStream, screenOwnerLabel)}
          >
            <ScreenVideo stream={activeScreenStream} muted={!!localScreenStream} />
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-primary/20 border border-primary/40 rounded-lg px-2.5 py-1">
              <MonitorUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary font-medium">{screenOwnerLabel}</span>
            </div>
            <ExpandHint />
          </div>

          <div className="flex md:flex-col flex-row gap-2 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden md:w-44 md:h-full md:min-h-0">
            <div
              className="flex-shrink-0 md:w-full w-28 aspect-video rounded-xl overflow-hidden relative group cursor-pointer"
              onClick={() => localStream ? openLightbox(localStream, localLabel, true) : null}
            >
              <VideoTile
                stream={localStream}
                isCameraOff={isCameraOff}
                isMicMuted={isMicMuted}
                label={localLabel}
                isLocal
                muted
              />
              <ExpandHint />
            </div>

            {remotePeerIds.map((pid, i) => {
              const streams = remoteStreams.get(pid)
              const camStream = streams?.camera || null
              const peerLabel = peerUsernames.get(pid) || `Peer ${i + 1}`
              return (
                <div
                  key={pid}
                  className="flex-shrink-0 md:w-full w-28 aspect-video rounded-xl overflow-hidden relative group cursor-pointer"
                  onClick={() => camStream ? openLightbox(camStream, peerLabel) : null}
                >
                  <VideoTile
                    stream={camStream}
                    isCameraOff={!camStream}
                    label={peerLabel}
                    muted={isSpeakerMuted}
                  />
                  <ExpandHint />
                </div>
              )
            })}
          </div>
        </div>

        <VideoLightbox stream={lightboxStream} label={lightboxLabel} muted={lightboxMuted} onClose={closeLightbox} />
      </>
    )
  }

  // Case 2: Normal grid
  const totalParticipants = 1 + remotePeerIds.length
  const gridClass = getGridClass(totalParticipants)

  return (
    <>
      <div className={`w-full h-full min-h-0 grid gap-2 auto-rows-fr ${gridClass}`}>
        {/* Local tile */}
        <div
          className="rounded-2xl overflow-hidden relative min-h-0 group cursor-pointer"
          onClick={() => localStream ? openLightbox(localStream, localLabel, true) : null}
        >
          <VideoTile
            stream={localStream}
            isCameraOff={isCameraOff}
            isMicMuted={isMicMuted}
            label={localLabel}
            isLocal
            muted
            fillHeight
          />
          <ExpandHint />
          {isWaiting && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 pointer-events-none">
              <Users className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span className="text-xs text-white/80 whitespace-nowrap">Waiting for others to join...</span>
            </div>
          )}
        </div>

        {/* Remote tiles */}
        {remotePeerIds.map((pid, i) => {
          const streams = remoteStreams.get(pid)
          const camStream = streams?.camera || null
          const peerLabel = peerUsernames.get(pid) || `Peer ${i + 1}`
          return (
            <div
              key={pid}
              className="rounded-2xl overflow-hidden relative min-h-0 group cursor-pointer"
              onClick={() => camStream ? openLightbox(camStream, peerLabel) : null}
            >
              <VideoTile
                stream={camStream}
                isCameraOff={!camStream}
                label={peerLabel}
                muted={isSpeakerMuted}
                fillHeight
              />
              <ExpandHint />
            </div>
          )
        })}
      </div>

      <VideoLightbox stream={lightboxStream} label={lightboxLabel} muted={lightboxMuted} onClose={closeLightbox} />
    </>
  )
}

// ---------- VideoTile — unified tile component with active speaker detection ----------

interface VideoTileProps {
  stream: MediaStream | null
  isCameraOff: boolean
  isMicMuted?: boolean
  label: string
  isLocal?: boolean
  muted?: boolean
  fillHeight?: boolean
}

function VideoTile({ stream, isCameraOff, isMicMuted, label, isLocal, muted, fillHeight }: VideoTileProps) {
  const isSpeaking = useAudioLevel(stream, !isMicMuted)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [portrait, setPortrait] = useState(false)

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream
  }, [stream])

  useEffect(() => {
    if (!stream) { setPortrait(false); return }
    const track = stream.getVideoTracks()[0] || null
    if (!track) { setPortrait(false); return }
    setPortrait(isPortraitTrack(track))
    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      setPortrait(isPortraitTrack(track))
      const s = track.getSettings()
      if ((s.width && s.height) || attempts > 20) clearInterval(interval)
    }, 200)
    return () => clearInterval(interval)
  }, [stream])

  const hasVideo = !!stream && !isCameraOff

  return (
    <div
      className={clsx(
        'relative bg-[#1a1a1a] border flex items-center justify-center transition-all duration-200',
        fillHeight ? 'w-full h-full' : 'w-full h-full',
        isSpeaking
          ? 'border-primary ring-2 ring-primary/50'
          : 'border-white/10'
      )}
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full"
          style={{
            objectFit: portrait ? 'contain' : 'cover',
            transform: isLocal ? 'scaleX(-1)' : undefined,
          }}
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-white/8 border border-white/20 flex items-center justify-center">
            <UserRound className="w-7 h-7 text-white/40" />
          </div>
          <span className="text-xs text-white/40">{label}</span>
        </div>
      )}

      {/* Bottom overlay: name + mic status */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          {isLocal && (
            <span className="text-[9px] bg-primary/40 border border-primary/50 text-primary px-1.5 py-0.5 rounded-full font-semibold tracking-wide uppercase leading-none shrink-0">
              You
            </span>
          )}
          <span className="text-xs text-white/90 font-medium truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isSpeaking && !isMicMuted && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          )}
          {isMicMuted && <MicOff className="w-3 h-3 text-danger" />}
        </div>
      </div>
    </div>
  )
}

// ---------- Sub-components ----------

function ScreenVideo({ stream, muted }: { stream: MediaStream; muted: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => { if (ref.current) ref.current.srcObject = stream }, [stream])
  return <video ref={ref} autoPlay playsInline muted={muted} className="w-full h-full" style={{ objectFit: 'contain' }} />
}

function ScreenPreview({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => { if (ref.current) ref.current.srcObject = stream }, [stream])
  return <video ref={ref} autoPlay playsInline muted className="w-full h-full" style={{ objectFit: 'contain' }} />
}


function getGridClass(n: number): string {
  if (n === 1) return 'grid-cols-1'
  if (n === 2) return 'grid-cols-2'
  return 'grid-cols-2'
}
