'use client'

import { useParticipants, useTracks } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'
import { ConferenceTile } from './conference-tile'
import { useConferenceStore } from '@/store/use-conference-store'
import { clsx } from 'clsx'
import { useEffect, useRef } from 'react'

// Calculate optimal grid columns for N participants
function getGridCols(n: number) {
  if (n <= 1) return 1
  if (n <= 2) return 2
  if (n <= 4) return 2
  if (n <= 6) return 3
  if (n <= 9) return 3
  if (n <= 12) return 4
  if (n <= 16) return 4
  if (n <= 20) return 5
  if (n <= 25) return 5
  return 6
}

export function ConferenceGrid() {
  const room = useRoomContext()
  const participants = useParticipants()
  const { pinnedIdentity, identity: localIdentity } = useConferenceStore()
  const screenRef = useRef<HTMLVideoElement>(null)

  // Active speakers from room
  const activeSpeakerIds = room.activeSpeakers.map((s) => s.identity)

  // Screen share tracks
  const screenTracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }])
  const activeScreen = screenTracks.find((t) => t.publication?.track)

  // Attach screen share to full video
  useEffect(() => {
    const track = activeScreen?.publication?.track
    if (!track || !screenRef.current) return
    track.attach(screenRef.current)
    return () => { track.detach(screenRef.current!) }
  }, [activeScreen?.publication?.track])

  const pinnedParticipant = pinnedIdentity
    ? participants.find((p) => p.identity === pinnedIdentity)
    : null

  // Presentation mode: active screen share
  if (activeScreen && activeScreen.publication?.track) {
    const presenter = activeScreen.participant
    const otherParticipants = participants.filter((p) => p.identity !== presenter.identity)

    return (
      <div className="flex gap-3 h-full">
        {/* Main screen share */}
        <div className="flex-1 min-w-0 relative rounded-xl overflow-hidden bg-black border border-white/10">
          <video
            ref={screenRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
            {getParticipantUsername(presenter.metadata, presenter.identity)} is sharing their screen
          </div>
        </div>

        {/* Sidebar: presenter + others */}
        <div className="w-44 flex flex-col gap-2 overflow-y-auto">
          {participants.map((p) => (
            <div key={p.identity} className="aspect-video w-full shrink-0">
              <ConferenceTile
                participant={p}
                isLocal={p.identity === localIdentity}
                size="small"
                isActiveSpeaker={activeSpeakerIds.includes(p.identity)}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Spotlight/pinned mode
  if (pinnedParticipant) {
    const others = participants.filter((p) => p.identity !== pinnedParticipant.identity)
    return (
      <div className="flex gap-3 h-full">
        <div className="flex-1 min-w-0">
          <ConferenceTile
            participant={pinnedParticipant}
            isLocal={pinnedParticipant.identity === localIdentity}
            size="large"
            isActiveSpeaker={activeSpeakerIds.includes(pinnedParticipant.identity)}
          />
        </div>
        {others.length > 0 && (
          <div className="w-44 flex flex-col gap-2 overflow-y-auto">
            {others.map((p) => (
              <div key={p.identity} className="aspect-video w-full shrink-0">
                <ConferenceTile
                  participant={p}
                  isLocal={p.identity === localIdentity}
                  size="small"
                  isActiveSpeaker={activeSpeakerIds.includes(p.identity)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Normal grid
  const cols = getGridCols(participants.length)
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }[cols] || 'grid-cols-6'

  return (
    <div className={clsx('grid gap-2 h-full auto-rows-fr', gridClass)}>
      {participants.map((p) => (
        <ConferenceTile
          key={p.identity}
          participant={p}
          isLocal={p.identity === localIdentity}
          isActiveSpeaker={activeSpeakerIds.includes(p.identity)}
        />
      ))}
    </div>
  )
}

function getParticipantUsername(metadata?: string, identity?: string) {
  try {
    return JSON.parse(metadata || '{}').username || identity || 'Participant'
  } catch {
    return identity || 'Participant'
  }
}
