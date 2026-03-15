'use client'

import { useEffect, useCallback, useRef } from 'react'
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

  type PendingFile = {
    chunks: string[]
    totalChunks: number
    filename: string
    mimeType: string
    sender: string
    receivedCount: number
  }
  const pendingFilesRef = useRef<Map<string, PendingFile>>(new Map())

  const {
    role, username, identity, roomName, status,
    isMicMuted, isCameraOff,
    setStatus, addWaitingParticipant, setWaitingParticipants, removeWaitingParticipant,
    addChatMessage, setCallStartTime,
  } = useConferenceStore()

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
        setCallStartTime(Date.now())
        await publishTracks()
      } else {
        // Participant joins waiting room — join-request is sent by the retry effect
        setStatus('waiting')
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

        const fd = data as Record<string, unknown>

        if (fd.type === 'file-start' && fd.fileId) {
          pendingFilesRef.current.set(fd.fileId as string, {
            chunks: new Array(fd.totalChunks as number).fill(''),
            totalChunks: fd.totalChunks as number,
            filename: fd.filename as string,
            mimeType: fd.mimeType as string,
            sender: fd.sender as string,
            receivedCount: 0,
          })
        }

        if (fd.type === 'file-chunk' && fd.fileId) {
          const pf = pendingFilesRef.current.get(fd.fileId as string)
          if (pf) {
            pf.chunks[fd.index as number] = fd.data as string
            pf.receivedCount++
          }
        }

        if (fd.type === 'file-end' && fd.fileId) {
          const pf = pendingFilesRef.current.get(fd.fileId as string)
          if (pf && pf.receivedCount >= pf.totalChunks) {
            const fileUrl = `data:${pf.mimeType};base64,${pf.chunks.join('')}`
            const senderName = participant
              ? getUsername(participant.metadata, participant.identity)
              : pf.sender
            addChatMessage({
              id: `file-${fd.fileId as string}`,
              from: 'remote',
              fromLabel: senderName,
              text: `📎 ${pf.filename}`,
              timestamp: Date.now(),
              fileUrl,
              fileName: pf.filename,
              fileMime: pf.mimeType,
            })
            pendingFilesRef.current.delete(fd.fileId as string)
          }
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
  }, [room, role, publishTracks, setStatus, addWaitingParticipant, removeWaitingParticipant, addChatMessage, setCallStartTime])

  // Poll waiting participants every 2s (host only — fallback for missed data messages)
  useEffect(() => {
    if (role !== 'host' || !roomName) return
    let cancelled = false
    const poll = async () => {
      try {
        const res = await fetch(`/api/conference/waiting?roomName=${encodeURIComponent(roomName)}`)
        if (!res.ok || cancelled) return
        const data = await res.json() as { participants?: Array<{ identity: string; username: string }> }
        if (!cancelled) {
          setWaitingParticipants(
            (data.participants || []).map((p) => ({ identity: p.identity, username: p.username, joinedAt: Date.now() }))
          )
        }
      } catch { /* ignore */ }
    }
    poll()
    const interval = setInterval(poll, 2000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [role, roomName, setWaitingParticipants])

  // Retry join-request every 5s while in waiting state (in case initial message was lost)
  useEffect(() => {
    if (status !== 'waiting' || role === 'host' || !localParticipant || !identity || !username) return
    const send = async () => {
      try {
        const data = new TextEncoder().encode(
          JSON.stringify({ type: 'join-request', identity, username })
        )
        await localParticipant.publishData(data, { reliable: true })
      } catch { /* ignore */ }
    }
    const timer = setTimeout(send, 500)
    const interval = setInterval(send, 5000)
    return () => { clearTimeout(timer); clearInterval(interval) }
  }, [status, localParticipant, identity, username, role])

  // Handle permission changes (waiting → admitted)
  useEffect(() => {
    if (!localParticipant) return
    const handler = async () => {
      const perms = localParticipant.permissions
      if (perms?.canPublish && role !== 'host') {
        setStatus('in-room')
        setCallStartTime(Date.now())
        await publishTracks()
        toast.success('You have been admitted to the meeting!')
      }
    }
    localParticipant.on(ParticipantEvent.ParticipantPermissionsChanged, handler)
    return () => { localParticipant.off(ParticipantEvent.ParticipantPermissionsChanged, handler) }
  }, [localParticipant, role, publishTracks, setStatus])

  return { participants }
}
