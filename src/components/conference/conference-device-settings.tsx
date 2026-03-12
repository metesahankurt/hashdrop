'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { X, Mic, Volume2, Video, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeviceInfo {
  deviceId: string
  label: string
}

interface ConferenceDeviceSettingsProps {
  onClose: () => void
}

export function ConferenceDeviceSettings({ onClose }: ConferenceDeviceSettingsProps) {
  const room = useRoomContext()

  const [audioInputs, setAudioInputs]   = useState<DeviceInfo[]>([])
  const [audioOutputs, setAudioOutputs] = useState<DeviceInfo[]>([])
  const [videoInputs, setVideoInputs]   = useState<DeviceInfo[]>([])

  const [activeMic,     setActiveMic]     = useState('')
  const [activeSpeaker, setActiveSpeaker] = useState('')
  const [activeCamera,  setActiveCamera]  = useState('')

  const [switching, setSwitching] = useState<string | null>(null)

  // Enumerate devices and detect currently active ones
  useEffect(() => {
    const load = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()

        const inputs   = devices.filter(d => d.kind === 'audioinput')
          .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` }))
        const outputs  = devices.filter(d => d.kind === 'audiooutput')
          .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Speaker ${i + 1}` }))
        const cameras  = devices.filter(d => d.kind === 'videoinput')
          .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }))

        setAudioInputs(inputs)
        setAudioOutputs(outputs)
        setVideoInputs(cameras)

        // Detect active devices from current media tracks
        const lp = room.localParticipant

        const audioPub = Array.from(lp.audioTrackPublications.values())[0]
        const audioDeviceId = audioPub?.track?.mediaStreamTrack?.getSettings()?.deviceId ?? ''
        if (audioDeviceId) setActiveMic(audioDeviceId)
        else if (inputs[0]) setActiveMic(inputs[0].deviceId)

        const videoPub = Array.from(lp.videoTrackPublications.values())[0]
        const videoDeviceId = videoPub?.track?.mediaStreamTrack?.getSettings()?.deviceId ?? ''
        if (videoDeviceId) setActiveCamera(videoDeviceId)
        else if (cameras[0]) setActiveCamera(cameras[0].deviceId)

        // Try room's active audiooutput
        try {
          const spk = (room as { getActiveDevice?: (k: string) => string | undefined })
            .getActiveDevice?.('audiooutput') ?? ''
          if (spk) setActiveSpeaker(spk)
          else if (outputs[0]) setActiveSpeaker(outputs[0].deviceId)
        } catch {
          if (outputs[0]) setActiveSpeaker(outputs[0].deviceId)
        }
      } catch (err) {
        console.error('[DeviceSettings] enumerateDevices error', err)
      }
    }
    load()
  }, [room])

  const switchDevice = useCallback(async (
    kind: 'audioinput' | 'audiooutput' | 'videoinput',
    deviceId: string,
    setter: (id: string) => void,
    label: string,
  ) => {
    setter(deviceId)
    setSwitching(kind)
    try {
      await room.switchActiveDevice(kind, deviceId)
      toast.success(`${label} switched`)
    } catch (err) {
      console.error(`[DeviceSettings] switchActiveDevice(${kind}) error`, err)
      toast.error(`Failed to switch ${label.toLowerCase()}`)
    } finally {
      setSwitching(null)
    }
  }, [room])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl p-6 w-full max-w-md mx-4 space-y-6 border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Device Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Microphone */}
        <DeviceSelect
          icon={<Mic className="w-4 h-4 text-primary" />}
          label="Microphone"
          devices={audioInputs}
          value={activeMic}
          loading={switching === 'audioinput'}
          onChange={(id) => switchDevice('audioinput', id, setActiveMic, 'Microphone')}
        />

        {/* Speaker */}
        <DeviceSelect
          icon={<Volume2 className="w-4 h-4 text-primary" />}
          label="Speaker"
          devices={audioOutputs}
          value={activeSpeaker}
          loading={switching === 'audiooutput'}
          onChange={(id) => switchDevice('audiooutput', id, setActiveSpeaker, 'Speaker')}
          emptyHint="Speaker selection is not supported in this browser."
        />

        {/* Camera */}
        <DeviceSelect
          icon={<Video className="w-4 h-4 text-primary" />}
          label="Camera"
          devices={videoInputs}
          value={activeCamera}
          loading={switching === 'videoinput'}
          onChange={(id) => switchDevice('videoinput', id, setActiveCamera, 'Camera')}
        />

        <button
          onClick={onClose}
          className="glass-btn w-full py-2.5 text-sm flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Done
        </button>
      </div>
    </div>
  )
}

function DeviceSelect({
  icon,
  label,
  devices,
  value,
  onChange,
  loading,
  emptyHint = 'No devices found.',
}: {
  icon: React.ReactNode
  label: string
  devices: DeviceInfo[]
  value: string
  onChange: (id: string) => void
  loading?: boolean
  emptyHint?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
        {icon}
        <span>{label}</span>
        {loading && (
          <span className="ml-auto text-[11px] text-primary animate-pulse">Switching…</span>
        )}
      </div>

      {devices.length === 0 ? (
        <p className="text-xs text-muted pl-6">{emptyHint}</p>
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="glass-input w-full text-sm py-2.5 px-3 rounded-xl cursor-pointer disabled:opacity-50"
        >
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId} className="bg-[#111] text-foreground">
              {d.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
