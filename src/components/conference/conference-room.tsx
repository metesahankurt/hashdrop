'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useConferenceStore } from '@/store/use-conference-store'
import { useConferenceLogic } from '@/hooks/use-conference-logic'
import { ConferenceGrid } from './conference-grid'
import { ConferenceControls } from './conference-controls'
import { ConferenceChat } from './conference-chat'
import { ConferenceParticipants } from './conference-participants'
import { ConferenceAdmitPanel } from './conference-admit-panel'
import { ConferenceWaiting } from './conference-waiting'
import { AudioRenderer } from './conference-audio'

interface ConferenceRoomProps {
  onLeave: () => void
}

// Inner component — runs inside <LiveKitRoom> provider
export function ConferenceRoomInner({ onLeave }: ConferenceRoomProps) {
  useConferenceLogic()

  const {
    status, role, waitingParticipants,
    isChatOpen, isParticipantsOpen,
    setChatOpen, setParticipantsOpen,
  } = useConferenceStore()

  // Prevent body scroll
  useEffect(() => {
    const scrollY = window.scrollY
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  if (status === 'waiting') {
    return (
      <>
        <AudioRenderer />
        <ConferenceWaiting />
      </>
    )
  }

  return (
    <>
      <AudioRenderer />
      <div className="fixed inset-0 top-0 flex flex-col bg-background z-20">
        <div className="flex-1 min-h-0 flex flex-col gap-3 p-3 md:p-4">
          {/* Admit panel — host only */}
          {role === 'host' && waitingParticipants.length > 0 && (
            <div className="shrink-0">
              <ConferenceAdmitPanel />
            </div>
          )}

          {/* Main area */}
          <div className="flex-1 min-h-0 flex gap-3">
            {/* Video grid */}
            <div className="flex-1 min-w-0 min-h-0">
              <ConferenceGrid />
            </div>

            {/* Side panels */}
            <AnimatePresence>
              {(isChatOpen || isParticipantsOpen) && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 320 }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 overflow-hidden h-full"
                >
                  <div className="w-80 h-full">
                    {isChatOpen && (
                      <ConferenceChat onClose={() => setChatOpen(false)} />
                    )}
                    {isParticipantsOpen && !isChatOpen && (
                      <ConferenceParticipants onClose={() => setParticipantsOpen(false)} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="glass-card rounded-2xl px-4 py-3 shrink-0">
            <ConferenceControls onLeave={onLeave} />
          </div>
        </div>
      </div>
    </>
  )
}
