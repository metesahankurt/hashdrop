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

const CODE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

export function VideoConnection() {
  const {
    peer, setPeer,
    callStatus, setCallStatus,
    setMediaConnection,
    setLocalStream,
    setRemoteCameraStream,
    setRemoteScreenStream,
    setCallStartTime,
    resetCall,
    setRemoteDisplay,
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

  const rebuildRemoteStreams = useCallback((pc: RTCPeerConnection) => {
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

    const cameraStream = buildStream(cameraTrack)
    const screenStream = buildStream(screenTrack)

    setRemoteCameraStream(cameraStream)
    setRemoteScreenStream(screenStream)

    if (screenStream && !cameraStream) {
      setRemoteDisplay('screen')
      return
    }

    const { remoteDisplay } = useVideoStore.getState()
    if (remoteDisplay === 'screen' && !screenStream) {
      setRemoteDisplay('camera')
    }
  }, [setRemoteCameraStream, setRemoteScreenStream, setRemoteDisplay])

  const [generatedInfo, setGeneratedInfo] = useState<{ displayCode: string; peerId: string } | null>(null)
  const [inputCode, setInputCode] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [showReceive, setShowReceive] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [codeExpiry, setCodeExpiry] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [canShare, setCanShare] = useState(false)
  const mountedRef = useRef(true)

  // Track component unmount
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

  // Refresh code
  const refreshCode = useCallback(() => {
    const newDisplayCode = generateSecureCode()
    const newPeerId = codeToCallPeerId(newDisplayCode)
    const newExpiry = Date.now() + CODE_EXPIRY_MS

    // Reset existing call state
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

  // Initialize media and Peer
  useEffect(() => {
    if (!peerId || peer) return

    const initPeer = async () => {
      try {
        // Get local media first
        console.log('[VideoCall] Step 1: Requesting camera/mic access...')
        setCallStatus('generating')
        const stream = await getLocalMediaStream()
        if (!mountedRef.current) {
          stopMediaStream(stream)
          return
        }
        console.log('[VideoCall] Step 2: Media access granted. Tracks:', stream.getTracks().map(t => `${t.kind}:${t.label}`))
        setLocalStream(stream)

        // Create peer
        const peerHost = 'hashdrop.onrender.com'
        const peerPort = 443
        const peerPath = '/'
        console.log(`[VideoCall] Step 3: Creating peer "${peerId}" → ${peerHost}:${peerPort}${peerPath}`)

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
            console.error('[VideoCall] TIMEOUT: Peer never connected to signaling server after 30s')
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

        // Handle incoming calls
        newPeer.on('call', (call) => {
          console.log('[VideoCall] Step 5: INCOMING CALL from:', call.peer)
          if (!mountedRef.current) return
          setCallStatus('ringing')

          // Answer with local stream
          const outgoingStream = buildOutgoingStream()
          console.log('[VideoCall] Step 6: Answering call, outgoing stream:', outgoingStream ? `${outgoingStream.getTracks().length} tracks` : 'NULL')
          if (outgoingStream) {
            call.answer(outgoingStream)
            console.log('[VideoCall] Step 7: Call answered, waiting for remote stream...')
          } else {
            console.error('[VideoCall] ERROR: No outgoing stream to answer with!')
          }

          call.on('stream', (remoteStream) => {
            console.log('[VideoCall] Step 8: GOT REMOTE STREAM! Tracks:', remoteStream.getTracks().map(t => `${t.kind}:${t.label}`))
            if (!mountedRef.current) return
            if (call.peerConnection) {
              rebuildRemoteStreams(call.peerConnection)
            } else {
              setRemoteCameraStream(remoteStream)
              setRemoteScreenStream(null)
            }
            setCallStatus('connected')
            setCallStartTime(Date.now())
            setMediaConnection(call)
            toast.success('Call connected!')
          })

          if (call.peerConnection) {
            call.peerConnection.ontrack = (event) => {
              console.log('[VideoCall] ontrack event:', event.track.kind, event.track.label)
              rebuildRemoteStreams(call.peerConnection)
            }
            call.peerConnection.oniceconnectionstatechange = () => {
              console.log('[VideoCall] ICE state (receiver):', call.peerConnection.iceConnectionState)
            }
            call.peerConnection.onconnectionstatechange = () => {
              console.log('[VideoCall] Connection state (receiver):', call.peerConnection.connectionState)
            }
          }

          call.on('close', () => {
            console.log('[VideoCall] Call closed (receiver side)')
            if (!mountedRef.current) return
            setRemoteCameraStream(null)
            setRemoteScreenStream(null)
            setCallStatus('ended')
            toast.info('Call ended')
          })

          call.on('error', (err) => {
            console.error('[VideoCall] Call error (receiver):', err.type, err.message)
            if (!mountedRef.current) return
            setCallStatus('failed')
            const errorInfo = formatErrorForToast(err, 'call-failed')
            toast.error(errorInfo.title, { description: errorInfo.description })
          })
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

        newPeer.on('disconnected', () => {
          console.warn('[VideoCall] DISCONNECTED from signaling server')
        })

        newPeer.on('close', () => {
          console.warn('[VideoCall] Peer CLOSED')
        })

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

    return () => {
      // Don't set mountedRef.current = false here - it's managed by the separate unmount effect
    }
  }, [peerId, peer, setPeer, setCallStatus, setLocalStream, setRemoteCameraStream, setRemoteScreenStream, setMediaConnection, setCallStartTime, refreshCode, rebuildRemoteStreams, buildOutgoingStream])

  // Connect to peer (caller)
  const connectToCall = useCallback((targetCode: string) => {
    console.log('[VideoCall] CALLER: Starting call to code:', targetCode)

    if (!peer) {
      console.error('[VideoCall] CALLER: No peer! Not connected to signaling server yet.')
      toast.error('Initializing connection... Please wait.')
      return
    }

    console.log('[VideoCall] CALLER: Peer is ready, ID:', peer.id)

    const outgoingStream = buildOutgoingStream()
    if (!outgoingStream) {
      console.error('[VideoCall] CALLER: No outgoing stream - camera not ready')
      toast.error('Camera not ready. Please wait.')
      return
    }

    console.log('[VideoCall] CALLER: Outgoing stream ready, tracks:', outgoingStream.getTracks().map(t => `${t.kind}:${t.label}`))

    setCallStatus('calling')
    const targetId = codeToCallPeerId(targetCode.trim())
    console.log(`[VideoCall] CALLER: Calling target peer ID: "${targetId}"`)

    const call = peer.call(targetId, outgoingStream)

    if (!call) {
      console.error('[VideoCall] CALLER: peer.call() returned null!')
      toast.error('Failed to initiate call')
      setCallStatus('failed')
      return
    }

    console.log('[VideoCall] CALLER: Call initiated, waiting for response...')

    // Connection timeout
    const callTimeout = setTimeout(() => {
      console.error('[VideoCall] CALLER: TIMEOUT after 30s - no stream received')
      call.close()
      setCallStatus('failed')
      toast.error('Call timeout', {
        description: 'Could not reach the other peer. Make sure they are online.',
        duration: 6000
      })
    }, 30000)

    call.on('stream', (remoteStream) => {
      console.log('[VideoCall] CALLER: GOT REMOTE STREAM! Tracks:', remoteStream.getTracks().map(t => `${t.kind}:${t.label}`))
      clearTimeout(callTimeout)
      if (call.peerConnection) {
        rebuildRemoteStreams(call.peerConnection)
      } else {
        setRemoteCameraStream(remoteStream)
        setRemoteScreenStream(null)
      }
      setCallStatus('connected')
      setCallStartTime(Date.now())
      setMediaConnection(call)
      toast.success('Call connected!')
    })

    if (call.peerConnection) {
      call.peerConnection.ontrack = (event) => {
        console.log('[VideoCall] CALLER ontrack:', event.track.kind, event.track.label)
        rebuildRemoteStreams(call.peerConnection)
      }
      call.peerConnection.oniceconnectionstatechange = () => {
        console.log('[VideoCall] CALLER ICE state:', call.peerConnection.iceConnectionState)
      }
      call.peerConnection.onconnectionstatechange = () => {
        console.log('[VideoCall] CALLER Connection state:', call.peerConnection.connectionState)
      }
      call.peerConnection.onicecandidateerror = (event: RTCPeerConnectionIceErrorEvent) => {
        console.warn('[VideoCall] CALLER ICE candidate error:', event.errorCode, event.errorText, event.url)
      }
    }

    call.on('close', () => {
      console.log('[VideoCall] CALLER: Call closed')
      clearTimeout(callTimeout)
      setRemoteCameraStream(null)
      setRemoteScreenStream(null)
      setCallStatus('ended')
      toast.info('Call ended')
    })

    call.on('error', (err) => {
      console.error('[VideoCall] CALLER: Call error:', err.type, err.message)
      clearTimeout(callTimeout)
      setCallStatus('failed')
      const errorInfo = formatErrorForToast(err, 'call-failed')
      toast.error(errorInfo.title, { description: errorInfo.description })
    })
  }, [peer, setCallStatus, setRemoteCameraStream, setRemoteScreenStream, setMediaConnection, setCallStartTime, rebuildRemoteStreams, buildOutgoingStream])

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

  // Don't show connection UI when connected or in call
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
            Share this code to start a video call
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

          {/* QR Code */}
          <AnimatePresence>
            {showQR && displayCode && (
              <QRCodeDisplay code={displayCode} size={180} url={`https://hashdrop.metesahankurt.cloud?mode=videocall&code=${displayCode}`} />
            )}
          </AnimatePresence>

          {/* Expiry Timer */}
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
                    Enter caller&apos;s code
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

      {/* Calling state */}
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
