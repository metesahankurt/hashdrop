'use client'

import { useEffect, useCallback } from 'react'
import {
  useRoomContext,
  useLocalParticipant,
  useParticipants,
} from '@livekit/components-react'
import { RoomEvent, DisconnectReason, ParticipantEvent, type RemoteParticipant } from 'livekit-client'
import { useConferenceStore } from '@/store/use-conference-store'
import { toast } from 'sonner'

function getUsername(metadata?: string, identity?: string): string {
  try {
    const m = JSON.parse(metadata || '{}')
    return m.username || identity || 'Participant'
  } catch {
    return identity || 'Participant'
  }
}

// Runs inside <LiveKitRoom> – handles all room event logic
export function useConferenceLogic() {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const participants = useParticipants()

  const {
    role, username, identity,
    isMicMuted, isCameraOff,
    setStatus, addWaitingParticipant, removeWaitingParticipant,
    addChatMessage,
  } = useConferenceStore()

  // Send join-request data message to all connected participants (host)
  const sendJoinRequest = useCallback(async () => {
    if (!localParticipant || !identity || !username) return
    try {
      const data = new TextEncoder().encode(
        JSON.stringify({ type: 'join-request', identity, username })
      )
      await localParticipant.publishData(data, { reliable: true })
    } catch { /* ignore */ }
  }, [localParticipant, identity, username])

  // Initialize tracks when admitted/host
  const publishTracks = useCallback(async () => {
    if (!localParticipant) return
    try {
      await localParticipant.setCameraEnabled(!isCameraOff)
      await localParticipant.setMicrophoneEnabled(!isMicMuted)
    } catch (err) {
      console.error('[Conference] Track publish error:', err)
    }
  }, [localParticipant, isCameraOff, isMicMuted])

  useEffect(() => {
    if (!room) return

    const handleConnected = async () => {
      if (role === 'host') {
        setStatus('in-room')
        await publishTracks()
      } else {
        // Participant joins waiting room
        setStatus('waiting')
        // Send join request after a short delay to ensure connection is stable
        setTimeout(sendJoinRequest, 500)
      }
    }

    const handleDisconnected = (reason?: DisconnectReason) => {
      if (
        reason === DisconnectReason.PARTICIPANT_REMOVED ||
        reason === DisconnectReason.ROOM_DELETED
      ) {
        setStatus('denied')
      } else {
        setStatus('ended')
      }
    }

    const handleParticipantConnected = (participant: RemoteParticipant) => {
      const name = getUsername(participant.metadata, participant.identity)
      try {
        const meta = JSON.parse(participant.metadata || '{}')
        if (meta.role !== 'waiting') {
          toast.success(`${name} joined the meeting`)
        }
      } catch {
        toast.success(`${name} joined the meeting`)
      }
    }

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      const name = getUsername(participant.metadata, participant.identity)
      removeWaitingParticipant(participant.identity)
      toast(`${name} left the meeting`)
    }

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant
    ) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload))

        if (data.type === 'join-request' && role === 'host') {
          addWaitingParticipant({
            identity: data.identity,
            username: data.username || 'Anonymous',
            joinedAt: Date.now(),
          })
          toast(`${data.username || 'Someone'} wants to join`, {
            action: { label: 'View', onClick: () => {} },
          })
        }

        if (data.type === 'chat' && data.text) {
          const senderName = participant
            ? getUsername(participant.metadata, participant.identity)
            : 'Anonymous'
          addChatMessage({
            id: `${Date.now()}-${Math.random()}`,
            from: 'remote',
            fromLabel: senderName,
            text: data.text,
            timestamp: Date.now(),
          })
        }
      } catch { /* ignore parse errors */ }
    }

    room.on(RoomEvent.Connected, handleConnected)
    room.on(RoomEvent.Disconnected, handleDisconnected)
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    room.on(RoomEvent.DataReceived, handleDataReceived)

    return () => {
      room.off(RoomEvent.Connected, handleConnected)
      room.off(RoomEvent.Disconnected, handleDisconnected)
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected)
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      room.off(RoomEvent.DataReceived, handleDataReceived)
    }
  }, [room, role, sendJoinRequest, publishTracks, setStatus, addWaitingParticipant, removeWaitingParticipant, addChatMessage])

  // Handle permission changes (waiting → admitted)
  useEffect(() => {
    if (!localParticipant) return
    const handler = async () => {
      const perms = localParticipant.permissions
      if (perms?.canPublish && role !== 'host') {
        setStatus('in-room')
        await publishTracks()
        toast.success('You have been admitted to the meeting!')
      }
    }
    localParticipant.on(ParticipantEvent.ParticipantPermissionsChanged, handler)
    return () => { localParticipant.off(ParticipantEvent.ParticipantPermissionsChanged, handler) }
  }, [localParticipant, role, publishTracks, setStatus])

  return { participants }
}
