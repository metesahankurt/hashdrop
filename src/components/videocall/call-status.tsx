'use client'

import { motion } from 'framer-motion'
import { Phone, PhoneOff, Loader2 } from 'lucide-react'
import { useVideoStore, type VideoCallStatus } from '@/store/use-video-store'

const statusConfig: Record<VideoCallStatus, { label: string; color: string }> = {
  idle: { label: 'Ready', color: 'text-muted' },
  generating: { label: 'Generating code...', color: 'text-muted' },
  ready: { label: 'Waiting for peer...', color: 'text-primary' },
  calling: { label: 'Calling...', color: 'text-primary' },
  ringing: { label: 'Ringing...', color: 'text-primary' },
  connected: { label: 'Connected', color: 'text-success' },
  ended: { label: 'Call ended', color: 'text-muted' },
  failed: { label: 'Connection failed', color: 'text-danger' },
}

export function CallStatus() {
  const { callStatus, callDuration } = useVideoStore()

  const config = statusConfig[callStatus]

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center gap-2"
    >
      {(callStatus === 'calling' || callStatus === 'generating' || callStatus === 'ringing') && (
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
      )}
      {callStatus === 'connected' && (
        <Phone className="w-4 h-4 text-success" />
      )}
      {callStatus === 'ended' && (
        <PhoneOff className="w-4 h-4 text-muted" />
      )}

      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>

      {callStatus === 'connected' && callDuration > 0 && (
        <span className="text-sm text-muted font-mono ml-1">
          {formatDuration(callDuration)}
        </span>
      )}
    </motion.div>
  )
}
