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
import { ConferenceInvitePanel } from './conference-invite-panel'
import { AudioRenderer } from './conference-audio'

interface ConferenceRoomProps {
  onLeave: () => void
  isMobileEmbed?: boolean
}

// Inner component — runs inside <LiveKitRoom> provider
export function ConferenceRoomInner({ onLeave, isMobileEmbed }: ConferenceRoomProps) {
  useConferenceLogic()

  const {
    status, role, waitingParticipants,
    isChatOpen, isParticipantsOpen, isInviteOpen,
    setChatOpen, setParticipantsOpen, setInviteOpen,
    callStartTime, setCallDuration,
  } = useConferenceStore()

  // Call duration timer
  useEffect(() => {
    if (!callStartTime) return
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTime) / 1000)
      setCallDuration(elapsed)
    }, 1000)
    return () => clearInterval(interval)
  }, [callStartTime, setCallDuration])

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
        <div className="fixed inset-0 top-0 flex flex-col bg-background z-40 overflow-y-auto">
          <ConferenceWaiting />
        </div>
      </>
    )
  }

  const hasSidePanel = isChatOpen || isParticipantsOpen || isInviteOpen
  const showMobilePanelOverlay = isMobileEmbed && hasSidePanel

  return (
    <>
      <AudioRenderer />
      <div className="fixed inset-0 top-0 flex flex-col bg-background z-40">
        <div className={`flex-1 min-h-0 flex flex-col ${isMobileEmbed ? 'gap-1.5 p-1.5 pb-[6.75rem]' : 'gap-3 p-3 md:p-4'}`}>
          {/* Admit panel — host only */}
          {role === 'host' && waitingParticipants.length > 0 && (
            <div className="shrink-0">
              <ConferenceAdmitPanel />
            </div>
          )}

          {/* Main area */}
          <div className={`flex-1 min-h-0 flex ${isMobileEmbed ? 'gap-1.5 flex-col' : 'gap-3'}`}>
            {/* Video grid */}
            <div className={isMobileEmbed ? 'w-full flex-1 min-h-0' : 'flex-1 min-w-0 min-h-0'}>
              <div className={isMobileEmbed ? 'h-full min-h-0 w-full' : 'h-full'}>
                <ConferenceGrid isMobileEmbed={isMobileEmbed} />
              </div>
            </div>

            {/* Side panels */}
            <AnimatePresence>
              {hasSidePanel && (
                <motion.div
                  initial={showMobilePanelOverlay ? { opacity: 0, y: 24 } : { opacity: 0, width: 0 }}
                  animate={showMobilePanelOverlay ? { opacity: 1, y: 0 } : { opacity: 1, width: 320 }}
                  exit={showMobilePanelOverlay ? { opacity: 0, y: 24 } : { opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className={
                    showMobilePanelOverlay
                      ? 'absolute inset-x-1.5 top-1.5 bottom-[6.75rem] z-50 overflow-hidden rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl'
                      : 'shrink-0 overflow-hidden h-full'
                  }
                >
                  <div className={showMobilePanelOverlay ? 'h-full w-full' : 'w-80 h-full'}>
                    {isChatOpen && (
                      <ConferenceChat onClose={() => setChatOpen(false)} />
                    )}
                    {isParticipantsOpen && !isChatOpen && (
                      <ConferenceParticipants onClose={() => setParticipantsOpen(false)} />
                    )}
                    {isInviteOpen && !isChatOpen && !isParticipantsOpen && (
                      <ConferenceInvitePanel onClose={() => setInviteOpen(false)} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className={`glass-card shrink-0 ${isMobileEmbed ? 'rounded-[20px] px-2.5 py-2 fixed left-1.5 right-1.5 bottom-1.5 z-40' : 'rounded-2xl px-4 py-3'}`}>
            <ConferenceControls onLeave={onLeave} isMobileEmbed={isMobileEmbed} />
          </div>
        </div>
      </div>
    </>
  )
}
