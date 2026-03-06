'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Peer from 'peerjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, ArrowRight, Loader2, Check, Clock, RefreshCw, ChevronDown, QrCode, Share2, ScanLine, Lock, Eye, EyeOff } from 'lucide-react'
import { useVideoStore, type ChatMessage } from '@/store/use-video-store'
import { useUsernameStore } from '@/store/use-username-store'
import { toast } from 'sonner'
import { generateSecureCode, codeToCallPeerId } from '@/lib/code-generator'
import { getLocalMediaStreamWithFallback, stopMediaStream } from '@/lib/media-utils'
import { QRCodeDisplay } from '@/components/transfer/qr-code-display'
import { QrScanner } from '@/components/transfer/qr-scanner'
import { formatErrorForToast } from '@/lib/error-handler'
import type { MediaConnection, DataConnection } from 'peerjs'
import { useSearchParams } from 'next/navigation'

const CODE_EXPIRY_MS = 5 * 60 * 1000
const MAX_PEERS = 4

async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function VideoConnection({ initialAction }: { initialAction?: 'create' | 'join' } = {}) {
  const {
    peer, setPeer,
    callStatus, setCallStatus,
    addMediaConnection, removeMediaConnection,
    addDataConnection, removeDataConnection,
    setRemoteStreams, removeRemoteStreams,
    setLocalStream,
    setCallStartTime,
    resetCall,
    addChatMessage,
    callPasswordHash, setCallPasswordHash,
    addPeerUsername, removePeerUsername,
    setPendingCall,
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

  const rebuildRemoteStreamsForPeer = useCallback((peerId: string, pc: RTCPeerConnection) => {
    const receivers = pc.getReceivers()
    const audioTracks = receivers.map(r => r.track).filter((t): t is MediaStreamTrack => !!t && t.kind === 'audio')
    const videoTracks = receivers.map(r => r.track).filter((t): t is MediaStreamTrack => !!t && t.kind === 'video')
    const cameraTrack = videoTracks[0] || null
    const screenTrack = videoTracks[1] || null
    const buildStream = (vt: MediaStreamTrack | null) => {
      if (!vt) return null
      const s = new MediaStream()
      s.addTrack(vt)
      audioTracks.forEach(t => s.addTrack(t))
      return s
    }
    setRemoteStreams(peerId, { camera: buildStream(cameraTrack), screen: buildStream(screenTrack) })
  }, [setRemoteStreams])

  // ---------- Data channel helpers ----------
  const setupDataConnection = useCallback((conn: DataConnection, remotePeerId: string) => {
    conn.on('data', (raw) => {
      const data = raw as { type: string; payload?: ChatMessage; hash?: string; username?: string }
      if (data.type === 'chat' && data.payload) {
        const { peerUsernames } = useVideoStore.getState()
        const senderName = peerUsernames.get(remotePeerId) || 'Peer'
        addChatMessage({ ...data.payload, from: 'remote', fromLabel: senderName })
      } else if (data.type === 'announce' && data.username) {
        // Store remote peer's username
        addPeerUsername(remotePeerId, data.username)
      } else if (data.type === 'auth') {
        // Host receives auth attempt
        const { callPasswordHash: storedHash } = useVideoStore.getState()
        if (storedHash) {
          if (data.hash === storedHash) {
            conn.send({ type: 'auth-ok' })
          } else {
            conn.send({ type: 'auth-rejected' })
            setTimeout(() => {
              const { mediaConnections } = useVideoStore.getState()
              const mc = mediaConnections.get(remotePeerId)
              if (mc) mc.close()
            }, 500)
            toast.error('A peer was rejected — wrong password')
          }
        } else {
          conn.send({ type: 'auth-ok' })
        }
      } else if (data.type === 'auth-ok') {
        // Announce local username to remote peer after auth passes
        const { username: localUsername } = useUsernameStore.getState()
        if (localUsername) conn.send({ type: 'announce', username: localUsername })
      } else if (data.type === 'auth-rejected') {
        toast.error('Wrong password — kicked from call')
        resetCall()
      }
    })
    conn.on('close', () => { removeDataConnection(remotePeerId); removePeerUsername(remotePeerId) })
    conn.on('error', (err) => console.error('[DataConn] Error:', err))
    addDataConnection(remotePeerId, conn)
  }, [addChatMessage, addDataConnection, removeDataConnection, resetCall, addPeerUsername, removePeerUsername])

  // ---------- States ----------
  const searchParams = useSearchParams()
  const urlMode = searchParams?.get('mode')
  const urlCode = searchParams?.get('code')
  const incomingCode = urlMode === 'videocall' ? urlCode : null

  const [generatedInfo, setGeneratedInfo] = useState<{ displayCode: string; peerId: string } | null>(null)
  const [inputCode, setInputCode] = useState(incomingCode || '')
  const [joinPassword, setJoinPassword] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [showReceive, setShowReceive] = useState(!!incomingCode || initialAction === 'join')
  const [showQR, setShowQR] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [codeExpiry, setCodeExpiry] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [canShare, setCanShare] = useState(false)
  // Password creation
  const [enablePassword, setEnablePassword] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])
  useEffect(() => { setCanShare(typeof navigator !== 'undefined' && !!navigator.share) }, [])

  useEffect(() => {
    if (!generatedInfo) {
      const displayCode = generateSecureCode()
      const peerId = codeToCallPeerId(displayCode)
      setGeneratedInfo({ displayCode, peerId })
      setCodeExpiry(Date.now() + CODE_EXPIRY_MS)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Add effect to auto-join if we have the peer initialized, we have an incoming code, and we haven't joined yet
  const [hasAutoJoined, setHasAutoJoined] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  
  // We will run this effect once the peer is ready and we haven't auto-joined yet
  // We'll move it down to after `connectToCall` is declared to avoid the reference error.

  const displayCode = generatedInfo?.displayCode || ''
  const peerId = generatedInfo?.peerId

  const refreshCode = useCallback(() => {
    const newDisplayCode = generateSecureCode()
    const newPeerId = codeToCallPeerId(newDisplayCode)
    resetCall()
    setGeneratedInfo({ displayCode: newDisplayCode, peerId: newPeerId })
    setCodeExpiry(Date.now() + CODE_EXPIRY_MS)
    setShowQR(false)
    toast.success('New video call code generated!')
  }, [resetCall])

  useEffect(() => {
    if (!codeExpiry) return
    const interval = setInterval(() => {
      const remaining = codeExpiry - Date.now()
      if (remaining <= 0) { setTimeLeft(0); toast.error('Code expired! Generating new code...'); refreshCode() }
      else setTimeLeft(Math.ceil(remaining / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [codeExpiry, refreshCode])

  // ---------- Finalize media connection ----------
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

  const attachCallHandlers = useCallback((
    call: MediaConnection,
    remotePeerId: string,
    side: string,
    onTimeout?: () => void
  ) => {
    const { tryFinalize, connectedRef } = finalizeConnection(call, remotePeerId, side)
    const callTimeout = onTimeout ? setTimeout(() => {
      if (!connectedRef.done) { call.close(); if (onTimeout) onTimeout() }
    }, 30000) : null

    call.on('stream', (remoteStream) => {
      if (callTimeout) clearTimeout(callTimeout)
      if (connectedRef.done || !mountedRef.current) return
      connectedRef.done = true
      if (call.peerConnection) rebuildRemoteStreamsForPeer(remotePeerId, call.peerConnection)
      else setRemoteStreams(remotePeerId, { camera: remoteStream, screen: null })
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
      const { mediaConnections } = useVideoStore.getState()
      if (mediaConnections.size === 0) { setCallStatus('ended'); toast.info('Call ended') }
    })

    call.on('error', (err) => {
      console.error(`[VideoCall] ${side} (${remotePeerId}) error:`, err.type, err.message)
      if (!mountedRef.current) return
      const errorInfo = formatErrorForToast(err, 'call-failed')
      toast.error(errorInfo.title, { description: errorInfo.description })
    })
  }, [finalizeConnection, rebuildRemoteStreamsForPeer, setRemoteStreams, addMediaConnection, removeMediaConnection, removeRemoteStreams, setCallStatus, setCallStartTime])

  // ---------- Initialize peer ----------
  useEffect(() => {
    if (!peerId || peer) return
    const initPeer = async () => {
      try {
        setCallStatus('generating')
        const { stream, hasVideo } = await getLocalMediaStreamWithFallback()
        if (!mountedRef.current) { stopMediaStream(stream); return }
        setLocalStream(stream)
        if (!hasVideo) {
          useVideoStore.getState().toggleCamera() // set isCameraOff = true
          toast.info('No camera detected. Joining with audio only.')
        }

        const newPeer = new Peer(peerId, {
          host: 'hashdrop.onrender.com', port: 443, path: '/', secure: true, debug: 3,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' }
            ]
          }
        })

        const connectionTimeout = setTimeout(() => {
          if (!newPeer.id) { newPeer.destroy(); if (mountedRef.current) { toast.error('Could not connect to network.'); setCallStatus('failed') } }
        }, 30000)

        newPeer.on('open', (id) => {
          clearTimeout(connectionTimeout)
          if (!mountedRef.current) return
          console.log('[VideoCall] Connected to signaling server:', id)
          setPeer(newPeer)
          setCallStatus('ready')

          // Set password hash for future incoming calls
          if (enablePassword && passwordInput) {
            hashPassword(passwordInput).then(h => setCallPasswordHash(h))
          }
        })

        // Incoming data connections (chat + auth)
        newPeer.on('connection', (conn) => {
          conn.on('open', () => setupDataConnection(conn, conn.peer))
        })

        // Incoming media calls — store for lobby confirmation
        newPeer.on('call', (call) => {
          if (!mountedRef.current) return
          const { mediaConnections } = useVideoStore.getState()
          if (mediaConnections.size >= MAX_PEERS) { call.close(); return }
          // Attach event handlers now so stream/close/error work post-answer
          attachCallHandlers(call, call.peer, 'RECEIVER')
          // Store call for lobby — user must click Join to answer()
          setPendingCall(call)
          setCallStatus('ringing')
        })

        newPeer.on('error', (err) => {
          clearTimeout(connectionTimeout)
          if (!mountedRef.current) return
          if (err.type === 'unavailable-id') { toast.error('Code already in use. Generating new code...'); refreshCode() }
          else { const ei = formatErrorForToast(err, 'connection-failed'); toast.error(ei.title, { description: ei.description }); setCallStatus('failed') }
        })

        newPeer.on('disconnected', () => console.warn('[VideoCall] DISCONNECTED'))
        newPeer.on('close', () => console.warn('[VideoCall] Peer CLOSED'))
      } catch (err) {
        if (!mountedRef.current) return
        console.error('[VideoCall] Media error:', err)
        const error = err as DOMException
        if (error.name === 'NO_MEDIA_DEVICES') {
          toast.error('No camera or microphone found', { description: 'Please connect a media device and try again.' })
        } else if (error.name === 'NotAllowedError') {
          toast.error('Camera/microphone access denied', { description: 'Please allow access in your browser settings.' })
        } else {
          toast.error('Media device error', { description: 'Could not access camera or microphone.' })
        }
        setCallStatus('failed')
      }
    }
    initPeer()
  }, [peerId, peer, setPeer, setCallStatus, setLocalStream, refreshCode, buildOutgoingStream, attachCallHandlers, setupDataConnection, enablePassword, passwordInput, setCallPasswordHash, setPendingCall])

  // ---------- Connect to peer (caller) ----------
  const connectToCall = useCallback(async (targetCode: string) => {
    if (!peer) { toast.error('Initializing connection... Please wait.'); return }
    const { mediaConnections } = useVideoStore.getState()
    if (mediaConnections.size >= MAX_PEERS) { toast.error('Conference is full'); return }
    const outgoingStream = buildOutgoingStream()
    if (!outgoingStream) { toast.error('Media not ready. Please wait.'); return }
    setCallStatus('calling')
    const targetId = codeToCallPeerId(targetCode.trim())

    // Open data channel first (for auth + chat)
    const dataConn = peer.connect(targetId, { reliable: true })
    dataConn.on('open', async () => {
      setupDataConnection(dataConn, targetId)
      // Send password if required
      if (joinPassword) {
        const hash = await hashPassword(joinPassword)
        dataConn.send({ type: 'auth', hash })
      } else {
        dataConn.send({ type: 'auth', hash: '' })
      }
    })

    const call = peer.call(targetId, outgoingStream)
    if (!call) { toast.error('Failed to initiate call'); setCallStatus('failed'); return }

    attachCallHandlers(call, targetId, 'CALLER', () => {
      setCallStatus('failed')
      toast.error('Call timeout', { description: 'Could not reach the other peer.', duration: 6000 })
    })
  }, [peer, setCallStatus, buildOutgoingStream, attachCallHandlers, setupDataConnection, joinPassword])

  useEffect(() => {
    if (incomingCode && peer && !hasAutoJoined) {
      setHasAutoJoined(true)
      setIsJoining(true)
      connectToCall(incomingCode)
    }
  }, [incomingCode, peer, hasAutoJoined, connectToCall])

  const handleQRScanned = useCallback((code: string) => {
    setInputCode(code)
    setShowQRScanner(false)
    setShowReceive(true)
    toast.success('QR code scanned! Press "Join Call" to connect.')
  }, [])

  const copyCode = () => {
    const { username: uname } = useUsernameStore.getState()
    const fromParam = uname ? `&from=${encodeURIComponent(uname)}` : ''
    const fullUrl = `https://hashdrop.metesahankurt.cloud?mode=videocall&code=${displayCode}${fromParam}`
    navigator.clipboard.writeText(fullUrl)
    setIsCopied(true)
    toast.success('Invite link copied!')
    setTimeout(() => setIsCopied(false), 2000)
  }

  const shareCode = async () => {
    if (!navigator.share || !displayCode) return
    const { username } = useUsernameStore.getState()
    const fromParam = username ? `&from=${encodeURIComponent(username)}` : ''
    try {
      await navigator.share({ title: 'HashDrop Video Call', text: `Join my video call with code: ${displayCode}`, url: `https://hashdrop.metesahankurt.cloud?mode=videocall&code=${displayCode}${fromParam}` })
    } catch (error) {
      if ((error as Error).name !== 'AbortError') console.error('Share failed:', error)
    }
  }

  // Update password hash when settings change
  useEffect(() => {
    if (!enablePassword || !passwordInput) { setCallPasswordHash(null); return }
    hashPassword(passwordInput).then(h => setCallPasswordHash(h))
  }, [enablePassword, passwordInput, setCallPasswordHash])

  const isJoinMode = initialAction === 'join'
  const isCreateMode = initialAction === 'create' || !initialAction

  if (callStatus === 'connected' || callStatus === 'ended') return null

  return (
    <>
      <div className="w-full flex flex-col items-center gap-6 md:gap-8">
        {/* Code Display — only when creating */}
        {isCreateMode && (callStatus === 'ready' || callStatus === 'generating') && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="text-center space-y-3 w-full">
            <p className="text-sm text-muted">Share this code to start a video call (up to 5 participants)</p>

            <div className="inline-flex items-center gap-2 glass-card rounded-lg px-3 py-2.5 glow-primary">
              <span className="font-mono text-xl md:text-2xl text-primary font-bold tracking-wide">{displayCode || '---'}</span>
              <div className="flex gap-1.5">
                <button onClick={copyCode} className="p-1.5 hover:bg-white/10 rounded-md transition-all" title="Copy code">
                  {isCopied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted hover:text-foreground" />}
                </button>
                {canShare && (
                  <button onClick={shareCode} className="p-1.5 hover:bg-white/10 rounded-md transition-all" title="Share code">
                    <Share2 className="w-4 h-4 text-muted hover:text-foreground" />
                  </button>
                )}
                <button onClick={() => setShowQR(!showQR)} className="p-1.5 hover:bg-white/10 rounded-md transition-all" title={showQR ? 'Hide QR' : 'Show QR'}>
                  <QrCode className={`w-4 h-4 ${showQR ? 'text-primary' : 'text-muted hover:text-foreground'}`} />
                </button>
                <button onClick={refreshCode} className="p-1.5 hover:bg-white/10 rounded-md transition-all" title="New code">
                  <RefreshCw className="w-4 h-4 text-muted hover:text-foreground" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showQR && displayCode && (() => {
                const { username } = useUsernameStore.getState()
                const fromParam = username ? `&from=${encodeURIComponent(username)}` : ''
                return <QRCodeDisplay code={displayCode} size={180} url={`https://hashdrop.metesahankurt.cloud?mode=videocall&code=${displayCode}${fromParam}`} />
              })()}
            </AnimatePresence>

            {timeLeft !== null && timeLeft > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted">
                <Clock className="w-3 h-3" />
                <span>Expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
              </div>
            )}

            {/* Password protection toggle */}
            <div className="mt-2 text-left w-full max-w-xs mx-auto">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => setEnablePassword(!enablePassword)}
                  className={`w-8 h-4 rounded-full transition-all flex-shrink-0 ${enablePassword ? 'bg-primary' : 'bg-white/20'}`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white mt-0.5 ml-0.5 transition-all ${enablePassword ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-xs text-muted group-hover:text-foreground transition-colors flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Password protect
                </span>
              </label>

              <AnimatePresence>
                {enablePassword && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Call password..."
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="glass-input w-full text-sm pr-9"
                        style={{ fontSize: '16px' }}
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                        type="button"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {callPasswordHash && <p className="text-xs text-primary mt-1">Password set</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Incoming code auto-join (from URL) */}
        {incomingCode && (callStatus === 'ready' || callStatus === 'generating' || callStatus === 'idle') && (
          <div className="glass-card p-6 rounded-xl flex flex-col items-center justify-center gap-4 py-12">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-foreground">Joining call {incomingCode}...</p>
            <p className="text-xs text-muted">Initializing camera and microphone</p>
          </div>
        )}

        {/* JOIN MODE: Clean standalone join card */}
        {isJoinMode && !incomingCode && (callStatus === 'ready' || callStatus === 'generating' || callStatus === 'idle' || callStatus === 'failed') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code (e.g. Cosmic-Falcon)"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputCode.trim() && peer && !isJoining) {
                      setIsJoining(true)
                      connectToCall(inputCode)
                    }
                  }}
                  className="glass-input flex-1 text-base font-mono text-center text-foreground placeholder:text-muted/50 focus:outline-none"
                  disabled={!peer || isJoining}
                  style={{ fontSize: '16px' }}
                  autoFocus
                />
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="glass-card px-3 rounded-xl text-muted hover:text-foreground hover:bg-white/10 transition-all"
                  title="Scan QR"
                >
                  <ScanLine className="w-4 h-4" />
                </button>
              </div>

              {/* Optional join password */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (if any)"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputCode.trim() && peer && !isJoining) {
                      setIsJoining(true)
                      connectToCall(inputCode)
                    }
                  }}
                  className="glass-input w-full text-sm pr-9"
                  style={{ fontSize: '16px' }}
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground" type="button">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                onClick={() => { setIsJoining(true); connectToCall(inputCode); }}
                disabled={!inputCode.trim() || !peer || isJoining}
                className="glass-btn-primary w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Join Call</span><ArrowRight className="w-4 h-4" /></>}
              </button>

              {callStatus === 'failed' && (
                <p className="text-xs text-danger text-center">
                  Connection failed. Check the code and try again.
                </p>
              )}

              {!peer && <p className="text-xs text-muted text-center">Initializing camera and connection...</p>}
            </div>
          </motion.div>
        )}

        {/* CREATE MODE: Collapsible join section */}
        {isCreateMode && !incomingCode && (callStatus === 'ready' || callStatus === 'generating' || callStatus === 'idle' || callStatus === 'ringing' || callStatus === 'failed') && (
          <div className="w-full space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30" /></div>
              <div className="relative flex justify-center"><span className="px-3 text-xs text-muted bg-background">or</span></div>
            </div>

            <button onClick={() => setShowReceive(!showReceive)} className="w-full py-2 text-sm text-muted hover:text-foreground transition-all flex items-center justify-center gap-2">
              <span>{showReceive ? 'Hide join' : 'Join a call'}</span>
              <motion.div animate={{ rotate: showReceive ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showReceive && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                  <div className="glass-card p-4 rounded-xl space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Enter host&apos;s code</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter code (e.g. Cosmic-Falcon)"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && inputCode.trim() && peer && !isJoining) {
                            setIsJoining(true)
                            connectToCall(inputCode)
                          }
                        }}
                        className="glass-input flex-1 text-base font-mono text-center text-foreground placeholder:text-muted/50 focus:outline-none"
                        disabled={!peer || isJoining}
                        style={{ fontSize: '16px' }}
                      />
                      <button
                        onClick={() => setShowQRScanner(true)}
                        className="glass-card px-3 rounded-xl text-muted hover:text-foreground hover:bg-white/10 transition-all flex items-center gap-1.5 text-xs"
                        title="Scan QR"
                      >
                        <ScanLine className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Optional join password */}
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password (if any)"
                        value={joinPassword}
                        onChange={(e) => setJoinPassword(e.target.value)}
                        className="glass-input w-full text-sm pr-9"
                        style={{ fontSize: '16px' }}
                      />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground" type="button">
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      onClick={() => { setIsJoining(true); connectToCall(inputCode); }}
                      disabled={!inputCode || !peer || isJoining}
                      className="glass-btn-primary w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Join Call</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                    {!peer && <p className="text-xs text-muted text-center">Initializing camera and connection...</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {callStatus === 'calling' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted">Calling...</p>
          </motion.div>
        )}
      </div>

      {/* QR Scanner modal */}
      {showQRScanner && (
        <QrScanner
          onCodeScanned={handleQRScanned}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </>
  )
}
