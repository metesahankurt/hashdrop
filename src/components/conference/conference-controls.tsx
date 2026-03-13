'use client'

import { useCallback, useState } from 'react'
import { useRoomContext, useLocalParticipant } from '@livekit/components-react'
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, Users, PhoneOff, Volume2, VolumeOff, Link2, Settings, RefreshCw, Ellipsis,
} from 'lucide-react'
import { useConferenceStore } from '@/store/use-conference-store'
import { ConferenceDeviceSettings } from './conference-device-settings'
import { clsx } from 'clsx'
import { toast } from 'sonner'

interface ConferenceControlsProps {
  onLeave: () => void
  isMobileEmbed?: boolean
}

function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0)
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function ConferenceControls({ onLeave, isMobileEmbed }: ConferenceControlsProps) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const [showDeviceSettings, setShowDeviceSettings] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

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

  const switchScreenSource = useCallback(async () => {
    if (!localParticipant) return
    try {
      await localParticipant.setScreenShareEnabled(false)
      setScreenSharing(false)
      await new Promise(r => setTimeout(r, 200))
      await localParticipant.setScreenShareEnabled(true)
      setScreenSharing(true)
    } catch {
      setScreenSharing(false)
    }
  }, [localParticipant, setScreenSharing])

  const participantCount = room.numParticipants
  const toggleChat = () => {
    setChatOpen(!isChatOpen)
    if (isParticipantsOpen) setParticipantsOpen(false)
    if (isInviteOpen) setInviteOpen(false)
    setShowMoreMenu(false)
  }
  const toggleParticipants = () => {
    setParticipantsOpen(!isParticipantsOpen)
    if (isChatOpen) setChatOpen(false)
    if (isInviteOpen) setInviteOpen(false)
    setShowMoreMenu(false)
  }
  const toggleInvite = () => {
    setInviteOpen(!isInviteOpen)
    if (isChatOpen) setChatOpen(false)
    if (isParticipantsOpen) setParticipantsOpen(false)
    setShowMoreMenu(false)
  }
  const openDeviceSettings = () => {
    setShowDeviceSettings(true)
    setShowMoreMenu(false)
  }

  return (
    <>
    <div className={clsx(
      'flex gap-2 relative',
      isMobileEmbed
        ? 'flex-col items-stretch'
        : 'items-center justify-between flex-wrap'
    )}>
      {/* Left: timer + participant count */}
      <div className={clsx(
        'flex items-center text-xs text-muted min-w-0',
        isMobileEmbed ? 'gap-2 order-1' : 'gap-3'
      )}>
        {callDuration > 0 && (
          <span className="font-mono hidden sm:inline">{formatDuration(callDuration)}</span>
        )}
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span>{participantCount}</span>
        </div>
      </div>

      {/* Center: main controls */}
      <div className={clsx(
        'flex items-center',
        isMobileEmbed ? 'gap-2 order-2 flex-wrap justify-center' : 'gap-2'
      )}>
        <CtrlBtn
          onClick={toggleMic}
          active={!isMicMuted}
          danger={isMicMuted}
          icon={isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          title={isMicMuted ? 'Unmute' : 'Mute'}
          compact={isMobileEmbed}
        />
        <CtrlBtn
          onClick={toggleCamera}
          active={!isCameraOff}
          danger={isCameraOff}
          icon={isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          title={isCameraOff ? 'Start Camera' : 'Stop Camera'}
          compact={isMobileEmbed}
        />
        <CtrlBtn
          onClick={() => setSpeakerMuted(!isSpeakerMuted)}
          active={!isSpeakerMuted}
          danger={isSpeakerMuted}
          icon={isSpeakerMuted ? <VolumeOff className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
          compact={isMobileEmbed}
          hidden={isMobileEmbed}
        />
        <CtrlBtn
          onClick={toggleScreen}
          active={isScreenSharing}
          icon={isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          compact={isMobileEmbed}
          hidden={isMobileEmbed}
        />
        {isScreenSharing && (
          <CtrlBtn
            onClick={switchScreenSource}
            active={false}
            icon={<RefreshCw className="w-4 h-4" />}
            title="Switch screen source (brief interruption)"
            compact={isMobileEmbed}
            hidden={isMobileEmbed}
          />
        )}

        {isMobileEmbed && (
          <CtrlBtn
            onClick={toggleChat}
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
            compact
          />
        )}

        {isMobileEmbed && (
          <CtrlBtn
            onClick={() => setShowMoreMenu((v) => !v)}
            active={showMoreMenu || isParticipantsOpen || isInviteOpen || showDeviceSettings}
            icon={<Ellipsis className="w-5 h-5" />}
            title="More"
            compact
          />
        )}

        {/* End call */}
        <button
          onClick={onLeave}
          title="Leave Meeting"
          className={clsx(
            'rounded-full bg-danger hover:bg-danger/80 text-white flex items-center justify-center transition-all',
            isMobileEmbed ? 'w-11 h-11' : 'w-11 h-11 md:w-12 md:h-12 px-4'
          )}
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {/* Right: panels */}
      <div className={clsx(
        'flex items-center',
        isMobileEmbed ? 'hidden' : 'gap-2'
      )}>
        <CtrlBtn
          onClick={toggleChat}
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
          onClick={toggleParticipants}
          active={isParticipantsOpen}
          icon={<Users className="w-5 h-5" />}
          title="Participants"
        />
        <CtrlBtn
          onClick={toggleInvite}
          active={isInviteOpen}
          icon={<Link2 className="w-5 h-5" />}
          title="Meeting Info"
        />
        <CtrlBtn
          onClick={openDeviceSettings}
          active={showDeviceSettings}
          icon={<Settings className="w-5 h-5" />}
          title="Device Settings"
        />
      </div>

      {isMobileEmbed && showMoreMenu && (
        <div className="order-4 rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl p-2 grid grid-cols-4 gap-2">
          <CtrlBtn
            onClick={() => setSpeakerMuted(!isSpeakerMuted)}
            active={!isSpeakerMuted}
            danger={isSpeakerMuted}
            icon={isSpeakerMuted ? <VolumeOff className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
            compact
          />
          <CtrlBtn
            onClick={toggleScreen}
            active={isScreenSharing}
            icon={isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
            compact
          />
          <CtrlBtn
            onClick={toggleParticipants}
            active={isParticipantsOpen}
            icon={<Users className="w-5 h-5" />}
            title="Participants"
            compact
          />
          <CtrlBtn
            onClick={toggleInvite}
            active={isInviteOpen}
            icon={<Link2 className="w-5 h-5" />}
            title="Meeting Info"
            compact
          />
          <CtrlBtn
            onClick={openDeviceSettings}
            active={showDeviceSettings}
            icon={<Settings className="w-5 h-5" />}
            title="Device Settings"
            compact
          />
          {isScreenSharing && (
            <CtrlBtn
              onClick={switchScreenSource}
              active={false}
              icon={<RefreshCw className="w-4 h-4" />}
              title="Switch screen source"
              compact
            />
          )}
        </div>
      )}
    </div>

    {/* Device settings modal */}
    {showDeviceSettings && (
      <ConferenceDeviceSettings onClose={() => setShowDeviceSettings(false)} />
    )}
  </>
  )
}

function CtrlBtn({
  active, onClick, icon, title, danger, compact, hidden,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  danger?: boolean
  compact?: boolean
  hidden?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx(
        hidden && 'hidden',
        compact
          ? 'w-10 h-10 rounded-full flex items-center justify-center transition-all'
          : 'w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all',
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
