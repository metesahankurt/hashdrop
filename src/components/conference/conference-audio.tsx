'use client'

import { useEffect } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { RoomEvent } from 'livekit-client'
import { useConferenceStore } from '@/store/use-conference-store'

// Attaches remote audio tracks to the DOM for playback, respects speaker mute
export function AudioRenderer() {
  const room = useRoomContext()
  const { isSpeakerMuted } = useConferenceStore()

  useEffect(() => {
    if (!room) return

    const attachAudio = () => {
      try {
        room.remoteParticipants.forEach((participant) => {
          participant.audioTrackPublications.forEach((pub) => {
            if (pub.track && !pub.isMuted) {
              pub.track.attach()
            }
          })
        })
      } catch { /* ignore */ }
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
    try {
      room.remoteParticipants.forEach((participant) => {
        participant.audioTrackPublications.forEach((pub) => {
          if (pub.track) {
            const elements = (pub.track as { attachedElements?: HTMLMediaElement[] }).attachedElements
            if (Array.isArray(elements)) {
              elements.forEach((el) => { el.muted = isSpeakerMuted })
            }
          }
        })
      })
    } catch { /* ignore */ }
  }, [room, isSpeakerMuted])

  return null
}
