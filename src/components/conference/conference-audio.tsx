'use client'

import { useEffect } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { Track, RoomEvent } from 'livekit-client'

// Attaches remote audio tracks to the DOM for playback
export function AudioRenderer() {
  const room = useRoomContext()

  useEffect(() => {
    if (!room) return

    const attachAudio = () => {
      room.remoteParticipants.forEach((participant) => {
        participant.audioTrackPublications.forEach((pub) => {
          if (pub.track && !pub.isMuted) {
            pub.track.attach()
          }
        })
      })
    }

    const handleTrack = () => attachAudio()
    room.on(RoomEvent.TrackSubscribed, handleTrack)
    room.on(RoomEvent.TrackUnsubscribed, handleTrack)
    attachAudio()

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrack)
      room.off(RoomEvent.TrackUnsubscribed, handleTrack)
    }
  }, [room])

  return null
}
