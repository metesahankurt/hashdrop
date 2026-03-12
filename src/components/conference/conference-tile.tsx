'use client'

import { useEffect, useRef } from 'react'
import { Participant, Track, RoomEvent } from 'livekit-client'
import { useTracks } from '@livekit/components-react'
import { MicOff, Pin, UserRound } from 'lucide-react'
import { useConferenceStore } from '@/store/use-conference-store'
import { clsx } from 'clsx'

function getParticipantInfo(participant: Participant) {
  try {
    const m = JSON.parse(participant.metadata || '{}')
    return { username: m.username || participant.identity, role: m.role || 'participant' }
  } catch {
    return { username: participant.identity, role: 'participant' }
  }
}

interface VideoTileProps {
  participant: Participant
  isLocal?: boolean
  size?: 'normal' | 'large' | 'small'
  isActiveSpeaker?: boolean
}

export function ConferenceTile({ participant, isLocal, size = 'normal', isActiveSpeaker }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const screenRef = useRef<HTMLVideoElement>(null)
  const { pinnedIdentity, setPinnedIdentity } = useConferenceStore()
  const isPinned = pinnedIdentity === participant.identity
  const { username, role } = getParticipantInfo(participant)

  // Listen to mute/unmute and publish/unpublish events so camera toggles update immediately
  const allTracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    {
      updateOnlyOn: [
        RoomEvent.TrackMuted,
        RoomEvent.TrackUnmuted,
        RoomEvent.TrackPublished,
        RoomEvent.TrackUnpublished,
        RoomEvent.LocalTrackPublished,
        RoomEvent.LocalTrackUnpublished,
        RoomEvent.ParticipantConnected,
        RoomEvent.ParticipantDisconnected,
      ],
    }
  )

  const participantCamTrack = allTracks.find(
    (t) => t.participant.identity === participant.identity && t.source === Track.Source.Camera
  )
  const participantScreenTrack = allTracks.find(
    (t) => t.participant.identity === participant.identity && t.source === Track.Source.ScreenShare
  )

  const cameraEnabled = !!(
    participantCamTrack?.publication?.isMuted === false &&
    participantCamTrack?.publication?.track
  )
  const micMuted = participant.isMicrophoneEnabled === false

  // Attach/detach camera track — re-runs when track reference, trackSid, or enabled state changes
  useEffect(() => {
    const track = participantCamTrack?.publication?.track
    const el = videoRef.current
    if (!el) return

    if (!track || !cameraEnabled) {
      // Clear srcObject to avoid gray/frozen frame
      el.srcObject = null
      return
    }

    track.attach(el)
    el.play().catch(() => {})

    return () => {
      try { track.detach(el) } catch { /* ignore */ }
      el.srcObject = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    participantCamTrack?.publication?.track,
    participantCamTrack?.publication?.trackSid,
    cameraEnabled,
  ])

  // Attach screen track
  useEffect(() => {
    const track = participantScreenTrack?.publication?.track
    if (!track || !screenRef.current) return
    track.attach(screenRef.current)
    return () => { try { track.detach(screenRef.current!) } catch { /* ignore */ } }
  }, [participantScreenTrack?.publication?.track])

  return (
    <div
      className={clsx(
        'relative rounded-xl overflow-hidden bg-white/5 border flex items-center justify-center group cursor-pointer transition-all duration-200 min-h-0',
        isActiveSpeaker ? 'border-primary ring-2 ring-primary/40' : 'border-white/10',
        isPinned && 'border-yellow-400/60 ring-2 ring-yellow-400/30',
        size === 'small' ? 'aspect-video' : 'w-full h-full'
      )}
      onClick={() => setPinnedIdentity(isPinned ? null : participant.identity)}
    >
      {/* Video (always rendered; hidden when camera off to preserve ref) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={clsx(
          'w-full h-full object-cover',
          isLocal && 'scale-x-[-1]',
          !cameraEnabled && 'hidden'
        )}
      />

      {/* Avatar when camera is off */}
      {!cameraEnabled && (
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <UserRound className="w-6 h-6 text-muted" />
          </div>
          <span className="text-xs text-muted">{username}</span>
        </div>
      )}

      {/* Screen share indicator */}
      {participantScreenTrack?.publication?.track && (
        <div className="absolute top-2 right-2 bg-blue-500/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
          Screen
        </div>
      )}

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          {role === 'host' && (
            <span className="text-[9px] bg-primary/80 text-white px-1 py-0.5 rounded font-medium shrink-0">
              Host
            </span>
          )}
          <span className="text-[11px] text-white/90 truncate">{isLocal ? `${username} (You)` : username}</span>
        </div>
        {micMuted && <MicOff className="w-3 h-3 text-red-400 shrink-0" />}
      </div>

      {/* Pin button */}
      <button
        onClick={(e) => { e.stopPropagation(); setPinnedIdentity(isPinned ? null : participant.identity) }}
        className={clsx(
          'absolute top-2 left-2 p-1 rounded-lg transition-opacity',
          isPinned
            ? 'opacity-100 bg-yellow-400/80 text-black'
            : 'opacity-0 group-hover:opacity-100 bg-black/50 text-white'
        )}
      >
        <Pin className="w-3 h-3" />
      </button>
    </div>
  )
}
