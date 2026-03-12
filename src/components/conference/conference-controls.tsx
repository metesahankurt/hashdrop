'use client'

import { useCallback, useState } from 'react'
import { useRoomContext, useLocalParticipant } from '@livekit/components-react'
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, Users, PhoneOff, Volume2, VolumeOff, Link2, Settings,
} from 'lucide-react'
import { useConferenceStore } from '@/store/use-conference-store'
import { ConferenceDeviceSettings } from './conference-device-settings'
import { clsx } from 'clsx'
import { toast } from 'sonner'

interface ConferenceControlsProps {
  onLeave: () => void
}

function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0)
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function ConferenceControls({ onLeave }: ConferenceControlsProps) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const [showDeviceSettings, setShowDeviceSettings] = useState(false)

  const {
    isMicMuted, isCameraOff, isScreenSharing, isSpeakerMuted,
    isChatOpen, isParticipantsOpen, isInviteOpen, unreadCount, callDuration,
    setMicMuted, setCameraOff, setScreenSharing, setSpeakerMuted,
    setChatOpen, setParticipantsOpen, setInviteOpen,
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
    <>
    <div className="flex items-center justify-between gap-2 flex-wrap">
      {/* Left: timer + participant count */}
      <div className="flex items-center gap-3 text-xs text-muted min-w-0">
        {callDuration > 0 && (
          <span className="font-mono hidden sm:inline">{formatDuration(callDuration)}</span>
        )}
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span>{participantCount}</span>
        </div>
      </div>

      {/* Center: main controls */}
      <div className="flex items-center gap-2">
        <CtrlBtn
          onClick={toggleMic}
          active={!isMicMuted}
          danger={isMicMuted}
          icon={isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          title={isMicMuted ? 'Unmute' : 'Mute'}
        />
        <CtrlBtn
          onClick={toggleCamera}
          active={!isCameraOff}
          danger={isCameraOff}
          icon={isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          title={isCameraOff ? 'Start Camera' : 'Stop Camera'}
        />
        <CtrlBtn
          onClick={() => setSpeakerMuted(!isSpeakerMuted)}
          active={!isSpeakerMuted}
          danger={isSpeakerMuted}
          icon={isSpeakerMuted ? <VolumeOff className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
        />
        <CtrlBtn
          onClick={toggleScreen}
          active={isScreenSharing}
          icon={isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        />

        {/* End call */}
        <button
          onClick={onLeave}
          title="Leave Meeting"
          className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-danger hover:bg-danger/80 text-white flex items-center justify-center transition-all px-4"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {/* Right: panels */}
      <div className="flex items-center gap-2">
        <CtrlBtn
          onClick={() => {
            setChatOpen(!isChatOpen)
            if (isParticipantsOpen) setParticipantsOpen(false)
            if (isInviteOpen) setInviteOpen(false)
          }}
          active={isChatOpen}
          icon={
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && !isChatOpen && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          }
          title="Chat"
        />
        <CtrlBtn
          onClick={() => {
            setParticipantsOpen(!isParticipantsOpen)
            if (isChatOpen) setChatOpen(false)
            if (isInviteOpen) setInviteOpen(false)
          }}
          active={isParticipantsOpen}
          icon={<Users className="w-5 h-5" />}
          title="Participants"
        />
        <CtrlBtn
          onClick={() => {
            setInviteOpen(!isInviteOpen)
            if (isChatOpen) setChatOpen(false)
            if (isParticipantsOpen) setParticipantsOpen(false)
          }}
          active={isInviteOpen}
          icon={<Link2 className="w-5 h-5" />}
          title="Meeting Info"
        />
        <CtrlBtn
          onClick={() => setShowDeviceSettings(true)}
          active={showDeviceSettings}
          icon={<Settings className="w-5 h-5" />}
          title="Device Settings"
        />
      </div>
    </div>

    {/* Device settings modal */}
    {showDeviceSettings && (
      <ConferenceDeviceSettings onClose={() => setShowDeviceSettings(false)} />
    )}
  </>
  )
}

function CtrlBtn({
  active, onClick, icon, title, danger,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx(
        'w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all',
        danger
          ? 'bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30'
          : active
          ? 'bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30'
          : 'glass-card hover:bg-white/10 text-foreground'
      )}
    >
      {icon}
    </button>
  )
}
