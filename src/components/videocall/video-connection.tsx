'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Peer from 'peerjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, ArrowRight, Loader2, Check, Clock, RefreshCw, ChevronDown, QrCode, Share2 } from 'lucide-react'
import { useVideoStore } from '@/store/use-video-store'
import { toast } from 'sonner'
import { generateSecureCode, codeToCallPeerId } from '@/lib/code-generator'
import { getLocalMediaStream, stopMediaStream } from '@/lib/media-utils'
import { QRCodeDisplay } from '@/components/transfer/qr-code-display'
import { formatErrorForToast } from '@/lib/error-handler'
import type { MediaConnection } from 'peerjs'

const CODE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes
const MAX_PEERS = 4 // max remote peers (5 total including local)

export function VideoConnection() {
  const {
    peer, setPeer,
    callStatus, setCallStatus,
    addMediaConnection, removeMediaConnection,
    setRemoteStreams, removeRemoteStreams,
    setLocalStream,
    setCallStartTime,
    resetCall,
  } = useVideoStore()

  const buildOutgoingStream = useCallback(() => {
    const { localStream: currentLocal, screenStream, isScreenSharing, isCameraOff } = useVideoStore.getState()
    if (!currentLocal) return null

    const audioTrack = currentLocal.getAudioTracks()[0] || null
    const screenTrack = isScreenSharing ? (screenStream?.getVideoTracks()[0] || null) : null
    const cameraTrack = !isCameraOff ? (currentLocal.getVideoTracks()[0] || null) : null

    if (!audioTrack && !screenTrack && !cameraTrack) return null

    const outgoing = new MediaStream()
    if (cameraTrack) outgoing.addTrack(cameraTrack)
    if (screenTrack) outgoing.addTrack(screenTrack)
    if (audioTrack) outgoing.addTrack(audioTrack)
    return outgoing
  }, [])

  // Rebuild remote streams for a specific peer from their RTCPeerConnection
  const rebuildRemoteStreamsForPeer = useCallback((peerId: string, pc: RTCPeerConnection) => {
    const receivers = pc.getReceivers()
    const audioTracks = receivers
      .map(r => r.track)
      .filter((t): t is MediaStreamTrack => !!t && t.kind === 'audio')
    const videoTracks = receivers
      .map(r => r.track)
      .filter((t): t is MediaStreamTrack => !!t && t.kind === 'video')

    const cameraTrack = videoTracks[0] || null
    const screenTrack = videoTracks[1] || null

    const buildStream = (videoTrack: MediaStreamTrack | null) => {
      if (!videoTrack) return null
      const stream = new MediaStream()
      stream.addTrack(videoTrack)
      audioTracks.forEach(track => stream.addTrack(track))
      return stream
    }

    setRemoteStreams(peerId, {
      camera: buildStream(cameraTrack),
      screen: buildStream(screenTrack),
    })
  }, [setRemoteStreams])

  const [generatedInfo, setGeneratedInfo] = useState<{ displayCode: string; peerId: string } | null>(null)
  const [inputCode, setInputCode] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [showReceive, setShowReceive] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [codeExpiry, setCodeExpiry] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [canShare, setCanShare] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share)
  }, [])

  // Generate code on mount
  useEffect(() => {
    if (!generatedInfo) {
      const displayCode = generateSecureCode()
      const peerId = codeToCallPeerId(displayCode)
      const expiry = Date.now() + CODE_EXPIRY_MS
      setGeneratedInfo({ displayCode, peerId })
      setCodeExpiry(expiry)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayCode = generatedInfo?.displayCode || ''
  const peerId = generatedInfo?.peerId

  const refreshCode = useCallback(() => {
    const newDisplayCode = generateSecureCode()
    const newPeerId = codeToCallPeerId(newDisplayCode)
    const newExpiry = Date.now() + CODE_EXPIRY_MS
    resetCall()
    setGeneratedInfo({ displayCode: newDisplayCode, peerId: newPeerId })
    setCodeExpiry(newExpiry)
    setShowQR(false)
    toast.success('New video call code generated!')
  }, [resetCall])

  // Countdown timer
  useEffect(() => {
    if (!codeExpiry) return
    const interval = setInterval(() => {
      const remaining = codeExpiry - Date.now()
      if (remaining <= 0) {
        setTimeLeft(0)
        toast.error('Code expired! Generating new code...')
        refreshCode()
      } else {
        setTimeLeft(Math.ceil(remaining / 1000))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [codeExpiry, refreshCode])

  // Finalize a single peer connection
  const finalizeConnection = useCallback((
    call: ReturnType<Peer['call']>,
    remotePeerId: string,
    side: string
  ) => {
    const connectedRef = { done: false }

    const finalizeNow = (reason: string) => {
      if (connectedRef.done || !mountedRef.current) return false
      if (!call.peerConnection) return false
      connectedRef.done = true
      console.log(`[VideoCall] ${side} (${remotePeerId}): CONNECTED via ${reason}!`)
      rebuildRemoteStreamsForPeer(remotePeerId, call.peerConnection)
      addMediaConnection(remotePeerId, call)

      // Mark as connected when we have at least one remote peer
      setCallStatus('connected')
      setCallStartTime(Date.now())
      toast.success('Call connected!')
      return true
    }

    const tryFinalize = (hasTrack = false) => {
      if (connectedRef.done || !mountedRef.current) return false
      if (!call.peerConnection) return false
      if (hasTrack) return finalizeNow('ontrack')
      const receivers = call.peerConnection.getReceivers()
      const hasVideo = receivers.some(r => r.track?.kind === 'video')
      const hasAudio = receivers.some(r => r.track?.kind === 'audio')
      if (hasVideo || hasAudio) return finalizeNow('receiver-check')
      return false
    }

    return { tryFinalize, connectedRef }
  }, [rebuildRemoteStreamsForPeer, addMediaConnection, setCallStatus, setCallStartTime])

  // Attach standard event handlers to a call
  const attachCallHandlers = useCallback((
    call: MediaConnection,
    remotePeerId: string,
    side: string,
    onTimeout?: () => void
  ) => {
    const { tryFinalize, connectedRef } = finalizeConnection(call, remotePeerId, side)
    const callTimeout = onTimeout ? setTimeout(() => {
      if (!connectedRef.done) {
        console.error(`[VideoCall] ${side}: TIMEOUT for ${remotePeerId}`)
        call.close()
        if (onTimeout) onTimeout()
      }
    }, 30000) : null

    // PeerJS stream fallback
    call.on('stream', (remoteStream) => {
      console.log(`[VideoCall] ${side} (${remotePeerId}): GOT STREAM`, remoteStream.getTracks().map(t => `${t.kind}`))
      if (callTimeout) clearTimeout(callTimeout)
      if (connectedRef.done || !mountedRef.current) return
      connectedRef.done = true
      if (call.peerConnection) {
        rebuildRemoteStreamsForPeer(remotePeerId, call.peerConnection)
      } else {
        setRemoteStreams(remotePeerId, { camera: remoteStream, screen: null })
      }
      addMediaConnection(remotePeerId, call)
      setCallStatus('connected')
      setCallStartTime(Date.now())
      toast.success('Call connected!')
    })

    if (call.peerConnection) {
      call.peerConnection.ontrack = (event) => {
        console.log(`[VideoCall] ${side} (${remotePeerId}) ontrack:`, event.track.kind)
        if (tryFinalize(true) && callTimeout) clearTimeout(callTimeout)
      }
      call.peerConnection.oniceconnectionstatechange = () => {
        const state = call.peerConnection.iceConnectionState
        if (state === 'connected' || state === 'completed') {
          if (tryFinalize() && callTimeout) clearTimeout(callTimeout)
        }
      }
    }

    call.on('close', () => {
      console.log(`[VideoCall] ${side} (${remotePeerId}): closed`)
      if (!mountedRef.current) return
      removeMediaConnection(remotePeerId)
      removeRemoteStreams(remotePeerId)

      // If no more connections, update status
      const { mediaConnections } = useVideoStore.getState()
      if (mediaConnections.size === 0) {
        setCallStatus('ended')
        toast.info('Call ended')
      }
    })

    call.on('error', (err) => {
      console.error(`[VideoCall] ${side} (${remotePeerId}) error:`, err.type, err.message)
      if (!mountedRef.current) return
      const errorInfo = formatErrorForToast(err, 'call-failed')
      toast.error(errorInfo.title, { description: errorInfo.description })
    })
  }, [finalizeConnection, rebuildRemoteStreamsForPeer, setRemoteStreams, addMediaConnection, removeMediaConnection, removeRemoteStreams, setCallStatus, setCallStartTime])

  // Initialize media and Peer
  useEffect(() => {
    if (!peerId || peer) return

    const initPeer = async () => {
      try {
        console.log('[VideoCall] Step 1: Requesting camera/mic access...')
        setCallStatus('generating')
        const stream = await getLocalMediaStream()
        if (!mountedRef.current) { stopMediaStream(stream); return }
        console.log('[VideoCall] Step 2: Media access granted.')
        setLocalStream(stream)

        const peerHost = 'hashdrop.onrender.com'
        const peerPort = 443
        const peerPath = '/'
        console.log(`[VideoCall] Step 3: Creating peer "${peerId}"`)

        const newPeer = new Peer(peerId, {
          host: peerHost,
          port: peerPort,
          path: peerPath,
          secure: true,
          debug: 3,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              {
                urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443?transport=tcp'],
                username: 'openrelayproject',
                credential: 'openrelayproject'
              }
            ]
          }
        })

        const connectionTimeout = setTimeout(() => {
          if (!newPeer.id) {
            newPeer.destroy()
            if (mountedRef.current) {
              toast.error('Could not connect to network. Please refresh.')
              setCallStatus('failed')
            }
          }
        }, 30000)

        newPeer.on('open', (id) => {
          clearTimeout(connectionTimeout)
          if (!mountedRef.current) return
          console.log('[VideoCall] Step 4: CONNECTED to signaling server! Peer ID:', id)
          setPeer(newPeer)
          setCallStatus('ready')
        })

        // Handle incoming calls (someone joins via our code)
        newPeer.on('call', (call) => {
          const remotePeerId = call.peer
          console.log('[VideoCall] INCOMING CALL from:', remotePeerId)
          if (!mountedRef.current) return

          // Reject if at capacity
          const { mediaConnections } = useVideoStore.getState()
          if (mediaConnections.size >= MAX_PEERS) {
            console.warn('[VideoCall] At capacity, rejecting call from', remotePeerId)
            call.close()
            return
          }

          setCallStatus('ringing')
          const outgoingStream = buildOutgoingStream()
          if (outgoingStream) {
            call.answer(outgoingStream)
          } else {
            console.error('[VideoCall] No outgoing stream to answer with!')
          }

          attachCallHandlers(call, remotePeerId, 'RECEIVER')
        })

        newPeer.on('error', (err) => {
          clearTimeout(connectionTimeout)
          if (!mountedRef.current) return
          console.error('[VideoCall] PEER ERROR:', err.type, err.message)
          if (err.type === 'unavailable-id') {
            toast.error('Code already in use. Generating new code...')
            refreshCode()
          } else {
            const errorInfo = formatErrorForToast(err, 'connection-failed')
            toast.error(errorInfo.title, { description: errorInfo.description })
            setCallStatus('failed')
          }
        })

        newPeer.on('disconnected', () => console.warn('[VideoCall] DISCONNECTED from signaling server'))
        newPeer.on('close', () => console.warn('[VideoCall] Peer CLOSED'))

      } catch (err) {
        if (!mountedRef.current) return
        console.error('[VideoCall] Media access error:', err)
        toast.error('Camera/microphone access denied', {
          description: 'Please allow camera and microphone access in your browser settings.'
        })
        setCallStatus('failed')
      }
    }

    initPeer()
  }, [peerId, peer, setPeer, setCallStatus, setLocalStream, refreshCode, buildOutgoingStream, attachCallHandlers])

  // Connect to a peer (caller initiates)
  const connectToCall = useCallback((targetCode: string) => {
    console.log('[VideoCall] CALLER: Starting call to code:', targetCode)

    if (!peer) {
      toast.error('Initializing connection... Please wait.')
      return
    }

    const { mediaConnections } = useVideoStore.getState()
    if (mediaConnections.size >= MAX_PEERS) {
      toast.error('Conference is full (max 5 participants)')
      return
    }

    const outgoingStream = buildOutgoingStream()
    if (!outgoingStream) {
      toast.error('Camera not ready. Please wait.')
      return
    }

    setCallStatus('calling')
    const targetId = codeToCallPeerId(targetCode.trim())
    console.log(`[VideoCall] CALLER: Calling target peer ID: "${targetId}"`)

    const call = peer.call(targetId, outgoingStream)

    if (!call) {
      toast.error('Failed to initiate call')
      setCallStatus('failed')
      return
    }

    attachCallHandlers(call, targetId, 'CALLER', () => {
      setCallStatus('failed')
      toast.error('Call timeout', {
        description: 'Could not reach the other peer. Make sure they are online.',
        duration: 6000
      })
    })
  }, [peer, setCallStatus, buildOutgoingStream, attachCallHandlers])

  const copyCode = () => {
    navigator.clipboard.writeText(displayCode)
    setIsCopied(true)
    toast.success('Code copied!')
    setTimeout(() => setIsCopied(false), 2000)
  }

  const shareCode = async () => {
    if (!navigator.share || !displayCode) return
    try {
      await navigator.share({
        title: 'HashDrop Video Call',
        text: `Join my video call with code: ${displayCode}`,
        url: `https://hashdrop.metesahankurt.cloud?mode=videocall&code=${displayCode}`
      })
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error)
      }
    }
  }

  if (callStatus === 'connected' || callStatus === 'ended') {
    return null
  }

  return (
    <div className="w-full flex flex-col items-center gap-6 md:gap-8">
      {/* Code Display */}
      {(callStatus === 'ready' || callStatus === 'generating') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-3"
        >
          <p className="text-sm text-muted">
            Share this code to start a video call (up to 5 participants)
          </p>

          <div className="inline-flex items-center gap-2 glass-card rounded-lg px-3 py-2.5 glow-primary">
            <span className="font-mono text-xl md:text-2xl text-primary font-bold tracking-wide">
              {displayCode || '---'}
            </span>
            <div className="flex gap-1.5">
              <button onClick={copyCode} className="p-1.5 hover:bg-white/10 rounded-md transition-all" title="Copy code">
                {isCopied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted hover:text-foreground" />}
              </button>
              {canShare && (
                <button onClick={shareCode} className="p-1.5 hover:bg-white/10 rounded-md transition-all" title="Share code">
                  <Share2 className="w-4 h-4 text-muted hover:text-foreground" />
                </button>
              )}
              <button onClick={() => setShowQR(!showQR)} className="p-1.5 hover:bg-white/10 rounded-md transition-all" title={showQR ? 'Hide QR code' : 'Show QR code'}>
                <QrCode className={`w-4 h-4 ${showQR ? 'text-primary' : 'text-muted hover:text-foreground'}`} />
              </button>
              <button onClick={refreshCode} className="p-1.5 hover:bg-white/10 rounded-md transition-all" title="Generate new code">
                <RefreshCw className="w-4 h-4 text-muted hover:text-foreground" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showQR && displayCode && (
              <QRCodeDisplay code={displayCode} size={180} url={`https://hashdrop.metesahankurt.cloud?mode=videocall&code=${displayCode}`} />
            )}
          </AnimatePresence>

          {timeLeft !== null && timeLeft > 0 && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted">
              <Clock className="w-3 h-3" />
              <span>Expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Join Call Section */}
      {(callStatus === 'ready' || callStatus === 'generating' || callStatus === 'idle' || callStatus === 'ringing' || callStatus === 'failed') && (
        <div className="w-full space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-muted bg-background">or</span>
            </div>
          </div>

          <button
            onClick={() => setShowReceive(!showReceive)}
            className="w-full py-2 text-sm text-muted hover:text-foreground transition-all flex items-center justify-center gap-2"
          >
            <span>{showReceive ? 'Hide join' : 'Join a call'}</span>
            <motion.div animate={{ rotate: showReceive ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showReceive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Enter host&apos;s code
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    <input
                      type="text"
                      placeholder={peer ? 'Cosmic-Falcon' : 'Initializing...'}
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      className="glass-input w-full px-3 py-2.5 text-base font-mono text-center text-foreground placeholder:text-muted/50 focus:outline-none"
                      disabled={!peer}
                    />
                    <button
                      onClick={() => connectToCall(inputCode)}
                      disabled={!inputCode || !peer}
                      className="glass-btn-primary w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span>Join Call</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    {!peer && (
                      <p className="text-xs text-muted text-center">
                        Initializing camera and connection...
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {callStatus === 'calling' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-3"
        >
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted">Calling...</p>
        </motion.div>
      )}
    </div>
  )
}
