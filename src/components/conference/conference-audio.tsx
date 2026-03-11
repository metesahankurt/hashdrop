'use client'

import { useEffect } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { Track, RoomEvent } from 'livekit-client'
import { useConferenceStore } from '@/store/use-conference-store'

// Attaches remote audio tracks to the DOM for playback, respects speaker mute
export function AudioRenderer() {
  const room = useRoomContext()
  const { isSpeakerMuted } = useConferenceStore()

  useEffect(() => {
    if (!room) return

    const attachAudio = () => {
      room.remoteParticipants.forEach((participant) => {
        participant.audioTrackPublications.forEach((pub) => {
          if (pub.track && !pub.isMuted) {
            const elements = pub.track.attachedElements
            if (elements.length === 0) {
              pub.track.attach()
            }
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

  // Apply speaker mute/unmute to all attached audio elements
  useEffect(() => {
    if (!room) return
    room.remoteParticipants.forEach((participant) => {
      participant.audioTrackPublications.forEach((pub) => {
        if (pub.track) {
          pub.track.attachedElements.forEach((el) => {
            ;(el as HTMLMediaElement).muted = isSpeakerMuted
          })
        }
      })
    })
  }, [room, isSpeakerMuted])

  return null
}
