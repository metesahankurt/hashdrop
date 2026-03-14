'use client'

import { useState } from 'react'
import { useLocalParticipant, useParticipants, useTracks } from '@livekit/components-react'
import { Track, LocalVideoTrack, RemoteVideoTrack } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'
import { ConferenceTile } from './conference-tile'
import { ScreenShareViewer } from './screen-share-viewer'
import { useConferenceStore } from '@/store/use-conference-store'
import { clsx } from 'clsx'

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

export function ConferenceGrid({ isMobileEmbed }: { isMobileEmbed?: boolean }) {
  const room = useRoomContext()
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const { pinnedIdentity, identity: localIdentity } = useConferenceStore()
  const [isScreenExpanded, setIsScreenExpanded] = useState(false)
  const currentLocalIdentity = localParticipant?.identity ?? localIdentity
  const allParticipants = [
    ...(localParticipant ? [localParticipant] : []),
    ...participants.filter((participant) => participant.identity !== localParticipant?.identity),
  ]

  // Active speakers from room
  const activeSpeakerIds = room.activeSpeakers.map((s) => s.identity)

  // Screen share tracks
  const screenTracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }])
  const activeScreen = screenTracks.find((t) => t.publication?.track)

  const pinnedParticipant = pinnedIdentity
    ? allParticipants.find((p) => p.identity === pinnedIdentity)
    : null

  // Presentation mode: active screen share
  if (activeScreen && activeScreen.publication?.track) {
    const presenter = activeScreen.participant
    const track = activeScreen.publication.track as LocalVideoTrack | RemoteVideoTrack
    const presenterName = getParticipantUsername(presenter.metadata, presenter.identity)

    return (
      <div className={clsx('flex h-full', isMobileEmbed ? 'gap-2 flex-col' : 'gap-3')}>
        {/* Main screen share */}
        <div
          className="flex-1 min-w-0 min-h-0"
          onClick={() => setIsScreenExpanded((v) => !v)}
        >
          <ScreenShareViewer
            track={track}
            presenterName={presenterName}
            isExpanded={isScreenExpanded}
            onToggleExpand={() => setIsScreenExpanded((v) => !v)}
          />
        </div>

        {/* Sidebar: participants (hidden when expanded) */}
        {!isScreenExpanded && (
          <div className={clsx(
            'flex gap-2 overflow-y-auto shrink-0',
            isMobileEmbed ? 'w-full flex-row overflow-x-auto overflow-y-hidden' : 'w-44 flex-col'
          )}>
            {allParticipants.map((p) => (
              <div key={p.identity} className={clsx(
                'aspect-video shrink-0',
                isMobileEmbed ? 'w-32' : 'w-full'
              )}>
                <ConferenceTile
                  participant={p}
                  isLocal={p.identity === currentLocalIdentity}
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

  // Spotlight/pinned mode
  if (pinnedParticipant) {
    const others = allParticipants.filter((p) => p.identity !== pinnedParticipant.identity)
    return (
      <div className={clsx('flex h-full', isMobileEmbed ? 'gap-2 flex-col' : 'gap-3')}>
        <div className="flex-1 min-w-0 min-h-0">
          <ConferenceTile
            participant={pinnedParticipant}
            isLocal={pinnedParticipant.identity === currentLocalIdentity}
            size="large"
            isActiveSpeaker={activeSpeakerIds.includes(pinnedParticipant.identity)}
          />
        </div>
        {others.length > 0 && (
          <div className={clsx(
            'flex gap-2 overflow-y-auto shrink-0',
            isMobileEmbed ? 'w-full flex-row overflow-x-auto overflow-y-hidden' : 'w-44 flex-col'
          )}>
            {others.map((p) => (
              <div key={p.identity} className={clsx(
                'aspect-video shrink-0',
                isMobileEmbed ? 'w-32' : 'w-full'
              )}>
                <ConferenceTile
                  participant={p}
                  isLocal={p.identity === currentLocalIdentity}
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
  const cols = getGridCols(allParticipants.length)
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }[cols] || 'grid-cols-6'

  return (
    <div className={clsx(
      'grid gap-2 h-full auto-rows-fr',
      isMobileEmbed
        ? allParticipants.length <= 2
          ? 'grid-cols-1'
          : 'grid-cols-2'
        : gridClass
    )}>
      {allParticipants.map((p) => (
        <ConferenceTile
          key={p.identity}
          participant={p}
          isLocal={p.identity === currentLocalIdentity}
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
