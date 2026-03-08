'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoConnection } from './video-connection'
import { VideoDisplay } from './video-display'
import { VideoControls } from './video-controls'
import { VideoChat } from './video-chat'
import { VideoLobby } from './video-lobby'
import { CallStatus } from './call-status'
import { VideoInfoSection } from './video-info-section'
import { useVideoStore } from '@/store/use-video-store'
import { heroVariants } from '@/lib/animations'
import { Video } from 'lucide-react'

export function VideoCallView({ initialAction }: { initialAction?: 'create' | 'join' }) {
  const router = useRouter()
  const {
    callStatus, callStartTime, setCallDuration, resetCall,
    isChatOpen, setChatOpen,
    pendingCall, setPendingCall,
  } = useVideoStore()

  useEffect(() => {
    if (callStatus !== 'connected' || !callStartTime) return
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTime) / 1000)
      setCallDuration(elapsed)
    }, 1000)
    return () => clearInterval(interval)
  }, [callStatus, callStartTime, setCallDuration])

  useEffect(() => {
    return () => { resetCall() }
  }, [resetCall])

  const handleEndCall = () => {
    resetCall()
    router.push('/')
  }

  const isInCall = callStatus === 'connected'
  const isRinging = callStatus === 'ringing'
  const isPreCall = callStatus === 'idle' || callStatus === 'generating' || callStatus === 'ready' || callStatus === 'calling'
  const isPostCall = callStatus === 'ended' || callStatus === 'failed'

  // Lobby: answer the pending call
  const handleLobbyJoin = useCallback(() => {
    if (!pendingCall) return
    const {
      localStream, isCameraOff, screenStream, isScreenSharing,
      setCallStatus, setCallStartTime, addMediaConnection, setRemoteStreams,
    } = useVideoStore.getState()

    if (!localStream) { pendingCall.answer(new MediaStream()); setPendingCall(null); setCallStatus('calling'); return }
    const outgoing = new MediaStream()
    const audioTrack = localStream.getAudioTracks()[0]
    const screenTrack = isScreenSharing ? (screenStream?.getVideoTracks()[0] || null) : null
    const cameraTrack = !isCameraOff ? (localStream.getVideoTracks()[0] || null) : null
    if (cameraTrack) outgoing.addTrack(cameraTrack)
    if (screenTrack) outgoing.addTrack(screenTrack)
    if (audioTrack) outgoing.addTrack(audioTrack)

    const answeredCall = pendingCall
    const remotePeerId = answeredCall.peer
    answeredCall.answer(outgoing.getTracks().length ? outgoing : localStream)

    setPendingCall(null)
    setCallStatus('calling')

    // After answer(), peerConnection is created by PeerJS.
    // Set up robust connection detection directly here.
    const finalize = () => {
      const { callStatus: current } = useVideoStore.getState()
      if (current === 'connected') return // already done

      const pc = answeredCall.peerConnection
      if (pc) {
        const receivers = pc.getReceivers()
        const videoTrack = receivers.find(r => r.track?.kind === 'video')?.track
        const audioTrack = receivers.find(r => r.track?.kind === 'audio')?.track
        if (videoTrack || audioTrack) {
          const cameraStream = videoTrack ? new MediaStream([videoTrack, ...(audioTrack ? [audioTrack] : [])]) : null
          setRemoteStreams(remotePeerId, { camera: cameraStream, screen: null })
        }
      }

      addMediaConnection(remotePeerId, answeredCall)
      setCallStatus('connected')
      setCallStartTime(Date.now())
    }

    // Strategy 1: PeerJS stream event
    answeredCall.on('stream', () => finalize())

    // Strategy 2: Poll for peerConnection and set up native handlers
    const waitForPc = () => {
      const pc = answeredCall.peerConnection
      if (!pc) { setTimeout(waitForPc, 50); return }

      pc.addEventListener('track', () => {
        finalize()
        // Rebuild remote streams for screen share track changes
        const { setRemoteStreams: setStreams } = useVideoStore.getState()
        const receivers = pc.getReceivers()
        const audioTracks = receivers.map(r => r.track).filter((t): t is MediaStreamTrack => !!t && t.kind === 'audio')
        const videoTracks = receivers.map(r => r.track).filter((t): t is MediaStreamTrack => !!t && t.kind === 'video')
        const camTrack = videoTracks[0] || null
        const scrTrack = videoTracks[1] || null
        const build = (vt: MediaStreamTrack | null) => {
          if (!vt) return null
          const s = new MediaStream()
          s.addTrack(vt)
          audioTracks.forEach(t => s.addTrack(t))
          return s
        }
        setStreams(remotePeerId, { camera: build(camTrack), screen: build(scrTrack) })
      })
      pc.addEventListener('iceconnectionstatechange', () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          finalize()
        }
      })
      // Already connected?
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        finalize()
      }
    }
    waitForPc()
  }, [pendingCall, setPendingCall])

  const handleLobbyDecline = useCallback(() => {
    if (pendingCall) { try { pendingCall.close() } catch { /* ignore */ } }
    setPendingCall(null)
    resetCall()
  }, [pendingCall, setPendingCall, resetCall])

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-16 md:py-20 relative z-10">
        <div className={`w-full mx-auto flex-1 flex flex-col justify-center gap-8 md:gap-12 ${isInCall ? 'max-w-7xl' : 'max-w-3xl'}`}>

          {/* Lobby — incoming call waiting for user confirmation */}
          <AnimatePresence mode="wait">
            {isRinging && (
              <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <VideoLobby onJoin={handleLobbyJoin} onDecline={handleLobbyDecline} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero — before call */}
          <AnimatePresence mode="wait">
            {isPreCall && (
              <motion.div key="video-hero" variants={heroVariants} initial="initial" animate="animate" exit="exit" className="text-center space-y-4 md:space-y-5">
                {initialAction === 'join' ? (
                  <>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1]">
                      Join{' '}
                      <span className="text-primary font-bold">Call</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted max-w-lg mx-auto leading-relaxed">
                      Enter the host&apos;s code to join the video call.
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1]">
                      Video{' '}
                      <span className="text-primary font-bold">Call</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted max-w-lg mx-auto leading-relaxed">
                      Secure peer-to-peer video calls. Fully encrypted.
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pre-call connection UI */}
          {isPreCall && (
            <div className="w-full space-y-4">
              <VideoDisplay />
              <div className="glass-card rounded-2xl p-3">
                <VideoControls preCall />
              </div>
              <VideoConnection initialAction={initialAction} />
            </div>
          )}

          {/* In-call: Video area + optional chat panel */}
          {isInCall && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-4">
              <CallStatus />

              {/* Main row: video + chat */}
              <div className="flex gap-3 items-start">
                {/* Video area */}
                <div className="flex-1 min-w-0">
                  <VideoDisplay />
                </div>

                {/* Chat panel */}
                <AnimatePresence>
                  {isChatOpen && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 320 }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.25 }}
                      className="shrink-0 overflow-hidden"
                      style={{ height: '70vh' }}
                    >
                      <div className="w-80 h-full">
                        <VideoChat onClose={() => setChatOpen(false)} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="glass-card rounded-2xl p-4">
                <VideoControls
                  onEndCall={handleEndCall}
                  onToggleChat={() => setChatOpen(!isChatOpen)}
                />
              </div>
            </motion.div>
          )}

          {/* Post-call */}
          {isPostCall && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-border flex items-center justify-center mx-auto">
                <Video className="w-8 h-8 text-muted" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">
                  {callStatus === 'ended' ? 'Call Ended' : 'Connection Failed'}
                </h2>
                <p className="text-sm text-muted">
                  {callStatus === 'ended' ? 'Your video call has ended.' : 'Could not establish a connection. Please try again.'}
                </p>
              </div>
              <button onClick={handleEndCall} className="glass-btn-primary px-6 py-3 rounded-xl text-sm">
                Start New Call
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {!isInCall && <VideoInfoSection />}
    </>
  )
}
