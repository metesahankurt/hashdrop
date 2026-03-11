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
import { VideoInvitePanel } from './video-invite-panel'
import { useVideoStore } from '@/store/use-video-store'
import { Video, WifiOff, RefreshCw } from 'lucide-react'

export function VideoCallView({ initialAction }: { initialAction?: 'create' | 'join' }) {
  const router = useRouter()
  const {
    callStatus, callStartTime, setCallDuration, resetCall,
    isChatOpen, setChatOpen,
    isInviteOpen, setInviteOpen,
    pendingCall, setPendingCall,
  } = useVideoStore()

  useEffect(() => {
    if ((callStatus !== 'connected' && callStatus !== 'waiting') || !callStartTime) return
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

  const isInCall = callStatus === 'connected' || callStatus === 'waiting'
  const isRinging = callStatus === 'ringing'
  const isPreCall = callStatus === 'idle' || callStatus === 'generating' || callStatus === 'ready' || callStatus === 'calling'
  // Only treat as post-call if an actual call was made (callStartTime set) OR call ended normally
  const isPostCall = callStatus === 'ended' || (callStatus === 'failed' && callStartTime !== null)
  // Signaling server init failure (before any call was attempted)
  const isInitFailed = callStatus === 'failed' && callStartTime === null

  useEffect(() => {
    if (!isInCall) return
    const scrollY = window.scrollY
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    window.scrollTo(0, 0)

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [isInCall])

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
      {isInCall && (
        <div className="fixed left-0 right-0 bottom-0 top-20 flex flex-col z-10 overflow-hidden px-4 md:px-8 pb-4 md:pb-6 bg-background">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-7xl mx-auto h-full flex flex-col gap-3">
            <CallStatus />

            <div className="flex-1 min-h-0 flex gap-3 items-stretch">
              <div className="flex-1 min-w-0 min-h-0">
                <VideoDisplay />
              </div>

              <AnimatePresence>
                {(isChatOpen || isInviteOpen) && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 320 }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.25 }}
                    className="shrink-0 overflow-hidden h-full"
                  >
                    <div className="w-80 h-full">
                      {isChatOpen && (
                        <VideoChat onClose={() => setChatOpen(false)} />
                      )}
                      {isInviteOpen && !isChatOpen && (
                        <VideoInvitePanel onClose={() => setInviteOpen(false)} />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="glass-card rounded-2xl p-4 shrink-0">
              <VideoControls
                onEndCall={handleEndCall}
                onToggleChat={() => setChatOpen(!isChatOpen)}
              />
            </div>
          </motion.div>
        </div>
      )}

      <div className={isInCall ? "hidden" : "min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-16 md:py-20 relative z-10"}>
        <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center gap-8 md:gap-12">
          {/* Lobby — incoming call waiting for user confirmation */}
          <AnimatePresence mode="wait">
            {isRinging && (
              <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <VideoLobby onJoin={handleLobbyJoin} onDecline={handleLobbyDecline} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Signaling server init failure — retry prompt */}
          {isInitFailed && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto">
                <WifiOff className="w-7 h-7 text-yellow-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold text-foreground">Server Unavailable</h3>
                <p className="text-sm text-muted">Could not connect to the signaling server.<br />It may be starting up — please retry in a moment.</p>
              </div>
              <button
                onClick={() => { resetCall() }}
                className="glass-btn-primary px-6 py-3 rounded-xl text-sm flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </motion.div>
          )}

          {/* Pre-call connection UI - explicitly always rendered to keep logic active */}
          <div className={isPostCall || isInitFailed ? "hidden" : "w-full space-y-4"}>
            {isPreCall && (
              <>
                <VideoDisplay />
                <div className="glass-card rounded-2xl p-3">
                  <VideoControls preCall />
                </div>
              </>
            )}
            <div className={isPreCall ? "" : "hidden"}>
              <VideoConnection initialAction={initialAction} />
            </div>
          </div>

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
    </>
  )
}
