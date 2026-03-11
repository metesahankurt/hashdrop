'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LiveKitRoom } from '@livekit/components-react'
import { DisconnectReason } from 'livekit-client'
import { motion, AnimatePresence } from 'framer-motion'
import { Video } from 'lucide-react'
import { useConferenceStore } from '@/store/use-conference-store'
import { ConferencePreJoin } from './conference-pre-join'
import { ConferenceRoomInner } from './conference-room'

const LK_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || ''

interface ConferenceViewProps {
  initialCode?: string | null
}

export function ConferenceView({ initialCode }: ConferenceViewProps) {
  const router = useRouter()
  const { status, token, setStatus, reset } = useConferenceStore()

  const isPreJoin = status === 'idle' || status === 'pre-join'
  const isConnecting = status === 'connecting'
  const isInRoom = status === 'in-room' || status === 'waiting'
  const isEnded = status === 'ended' || status === 'denied'

  // Cleanup on unmount
  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleLeave = useCallback(() => {
    reset()
    router.push('/')
  }, [reset, router])

  const handleDisconnect = useCallback((reason?: DisconnectReason) => {
    if (
      reason === DisconnectReason.PARTICIPANT_REMOVED ||
      reason === DisconnectReason.ROOM_DELETED
    ) {
      setStatus('denied')
    } else if (reason !== DisconnectReason.CLIENT_INITIATED) {
      setStatus('ended')
    }
  }, [setStatus])

  return (
    <>
      <AnimatePresence mode="wait">
        {isPreJoin && (
          <motion.div key="prejoin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ConferencePreJoin
              initialCode={initialCode}
              onEnterRoom={() => setStatus('connecting')}
            />
          </motion.div>
        )}

        {isEnded && (
          <motion.div
            key="ended"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen flex flex-col items-center justify-center px-4 gap-6"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 border border-border flex items-center justify-center">
              <Video className="w-8 h-8 text-muted" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                {status === 'denied' ? 'Entry Denied' : 'Meeting Ended'}
              </h2>
              <p className="text-sm text-muted">
                {status === 'denied'
                  ? 'The host did not admit you or removed you from the meeting.'
                  : 'The video conference has ended.'}
              </p>
            </div>
            <button
              onClick={() => { reset(); }}
              className="glass-btn-primary px-6 py-3 rounded-xl text-sm"
            >
              Start New Meeting
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LiveKit Room — mounts when token is ready */}
      {(isConnecting || isInRoom) && token && (
        <LiveKitRoom
          token={token}
          serverUrl={LK_URL}
          connect={true}
          onDisconnected={handleDisconnect}
          onError={(err) => {
            console.error('[Conference] LiveKit error:', err)
          }}
        >
          <ConferenceRoomInner onLeave={handleLeave} />
        </LiveKitRoom>
      )}
    </>
  )
}
