'use client'

import { useCallback } from 'react'
import { useRoomContext, useLocalParticipant } from '@livekit/components-react'
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, Users, PhoneOff, Hand,
} from 'lucide-react'
import { useConferenceStore } from '@/store/use-conference-store'
import { clsx } from 'clsx'
import { toast } from 'sonner'

interface ConferenceControlsProps {
  onLeave: () => void
}

export function ConferenceControls({ onLeave }: ConferenceControlsProps) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()

  const {
    isMicMuted, isCameraOff, isScreenSharing,
    isChatOpen, isParticipantsOpen, unreadCount,
    setMicMuted, setCameraOff, setScreenSharing,
    setChatOpen, setParticipantsOpen,
  } = useConferenceStore()

  const toggleMic = useCallback(async () => {
    if (!localParticipant) return
    const newMuted = !isMicMuted
    await localParticipant.setMicrophoneEnabled(!newMuted)
    setMicMuted(newMuted)
  }, [localParticipant, isMicMuted, setMicMuted])

  const toggleCamera = useCallback(async () => {
    if (!localParticipant) return
    const newOff = !isCameraOff
    await localParticipant.setCameraEnabled(!newOff)
    setCameraOff(newOff)
  }, [localParticipant, isCameraOff, setCameraOff])

  const toggleScreen = useCallback(async () => {
    if (!localParticipant) return
    try {
      const newSharing = !isScreenSharing
      await localParticipant.setScreenShareEnabled(newSharing)
      setScreenSharing(newSharing)
    } catch {
      toast.error('Failed to start screen share')
      setScreenSharing(false)
    }
  }, [localParticipant, isScreenSharing, setScreenSharing])

  const participantCount = room.numParticipants

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      {/* Left: info */}
      <div className="flex items-center gap-2 text-xs text-muted min-w-0">
        <Users className="w-3.5 h-3.5 shrink-0" />
        <span>{participantCount} {participantCount === 1 ? 'participant' : 'participants'}</span>
      </div>

      {/* Center: main controls */}
      <div className="flex items-center gap-2">
        <ControlBtn
          active={!isMicMuted}
          onClick={toggleMic}
          icon={isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          label={isMicMuted ? 'Unmute' : 'Mute'}
          danger={isMicMuted}
        />
        <ControlBtn
          active={!isCameraOff}
          onClick={toggleCamera}
          icon={isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          label={isCameraOff ? 'Start Camera' : 'Stop Camera'}
          danger={isCameraOff}
        />
        <ControlBtn
          active={isScreenSharing}
          onClick={toggleScreen}
          icon={isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          label={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        />

        {/* End call */}
        <button
          onClick={onLeave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-colors text-sm font-medium"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

      {/* Right: panels */}
      <div className="flex items-center gap-2">
        <ControlBtn
          active={isChatOpen}
          onClick={() => setChatOpen(!isChatOpen)}
          icon={
            <div className="relative">
              <MessageSquare className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          }
          label="Chat"
        />
        <ControlBtn
          active={isParticipantsOpen}
          onClick={() => setParticipantsOpen(!isParticipantsOpen)}
          icon={<Users className="w-4 h-4" />}
          label="Participants"
        />
        <ControlBtn
          active={false}
          onClick={() => toast('Raise hand feature coming soon')}
          icon={<Hand className="w-4 h-4" />}
          label="Raise Hand"
        />
      </div>
    </div>
  )
}

function ControlBtn({
  active, onClick, icon, label, danger,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={clsx(
        'p-2 rounded-xl border transition-colors',
        danger
          ? 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25'
          : active
          ? 'bg-primary/20 border-primary/40 text-primary hover:bg-primary/30'
          : 'bg-white/5 border-white/10 text-muted hover:bg-white/10 hover:text-foreground'
      )}
    >
      {icon}
    </button>
  )
}
