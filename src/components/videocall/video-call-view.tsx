'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoConnection } from './video-connection'
import { VideoDisplay } from './video-display'
import { VideoControls } from './video-controls'
import { CallStatus } from './call-status'
import { VideoInfoSection } from './video-info-section'
import { useVideoStore } from '@/store/use-video-store'
import { heroVariants } from '@/lib/animations'
import { Video } from 'lucide-react'

export function VideoCallView() {
  const { callStatus, callStartTime, setCallDuration, resetCall } = useVideoStore()

  // Call duration timer
  useEffect(() => {
    if (callStatus !== 'connected' || !callStartTime) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTime) / 1000)
      setCallDuration(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [callStatus, callStartTime, setCallDuration])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetCall()
    }
  }, [resetCall])

  const handleEndCall = () => {
    resetCall()
  }

  const isInCall = callStatus === 'connected'
  const isPreCall = callStatus === 'idle' || callStatus === 'generating' || callStatus === 'ready' || callStatus === 'calling' || callStatus === 'ringing'
  const isPostCall = callStatus === 'ended' || callStatus === 'failed'

  return (
    <>
    <div className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-16 md:py-20 relative z-10">
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center gap-8 md:gap-12">
        {/* Hero Section - Before call */}
        <AnimatePresence mode="wait">
          {isPreCall && (
            <motion.div
              key="video-hero"
              variants={heroVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center space-y-4 md:space-y-5"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1]">
                Video{' '}
                <span className="text-primary font-bold">Call</span>
              </h1>
              <p className="text-lg md:text-xl text-muted max-w-lg mx-auto leading-relaxed">
                Secure peer-to-peer video calls. Fully encrypted.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pre-call: Connection UI */}
        {isPreCall && (
          <div className="w-full space-y-4">
            {/* Video Preview */}
            <VideoDisplay />
            {/* Pre-call controls: mic & camera only */}
            <div className="glass-card rounded-2xl p-3">
              <VideoControls preCall />
            </div>
            <VideoConnection />
          </div>
        )}

        {/* In call: Video + Controls */}
        {isInCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full space-y-4"
          >
            <CallStatus />
            <VideoDisplay />
            <div className="glass-card rounded-2xl p-4">
              <VideoControls onEndCall={handleEndCall} />
            </div>
          </motion.div>
        )}

        {/* Post-call */}
        {isPostCall && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 border border-border flex items-center justify-center mx-auto">
              <Video className="w-8 h-8 text-muted" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                {callStatus === 'ended' ? 'Call Ended' : 'Connection Failed'}
              </h2>
              <p className="text-sm text-muted">
                {callStatus === 'ended'
                  ? 'Your video call has ended.'
                  : 'Could not establish a connection. Please try again.'}
              </p>
            </div>
            <button
              onClick={handleEndCall}
              className="glass-btn-primary px-6 py-3 rounded-xl text-sm"
            >
              Start New Call
            </button>
          </motion.div>
        )}
      </div>
    </div>

    {/* Informational Section */}
    <VideoInfoSection />
    </>
  )
}
