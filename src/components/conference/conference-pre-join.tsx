'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Video, Mic, MicOff, VideoOff, Copy, Check, QrCode, Users, Lock, Eye, EyeOff } from 'lucide-react'
import { useConferenceStore } from '@/store/use-conference-store'
import { useUsernameStore } from '@/store/use-username-store'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { generateSecureCode } from '@/lib/code-generator'

interface ConferencePreJoinProps {
  initialCode?: string | null
  initialMode?: 'create' | 'join'
  autoEnter?: boolean
  isMobileEmbed?: boolean
  onEnterRoom: () => void
}

export function ConferencePreJoin({ initialCode, initialMode, autoEnter, isMobileEmbed: _isMobileEmbed, onEnterRoom }: ConferencePreJoinProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const autoEnteredRef = useRef(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mode, setMode] = useState<'create' | 'join'>(initialMode ?? (initialCode ? 'join' : 'create'))
  const [joinCode, setJoinCode] = useState(initialCode || '')
  const [createdCode, setCreatedCode] = useState('')
  const [showQr, setShowQr] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const { username } = useUsernameStore()
  const { isMicMuted, isCameraOff, setMicMuted, setCameraOff, setRoom, setStatus } = useConferenceStore()

  // Camera preview
  useEffect(() => {
    if (isCameraOff) { stream?.getTracks().forEach((t) => t.stop()); setStream(null); return }
    let s: MediaStream | null = null
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((ms) => {
        s = ms
        setStream(ms)
        if (videoRef.current) videoRef.current.srcObject = ms
      })
      .catch(() => { /* no camera */ })
    return () => { s?.getTracks().forEach((t) => t.stop()) }
  }, [isCameraOff]) // eslint-disable-line react-hooks/exhaustive-deps

  const generateRoomCode = () => {
    const code = generateSecureCode()
    setCreatedCode(code)
    return code
  }

  const handleCreate = async () => {
    if (!username) { toast.error('Please enter a username'); return }
    setLoading(true)
    try {
      const roomName = createdCode || generateRoomCode()
      const res = await fetch('/api/conference/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, username }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      const data = await res.json()
      setCreatedCode(roomName)
      setRoom(data.roomName, data.token, data.identity, 'host', username)
      setStatus('connecting')
      onEnterRoom()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) { toast.error('Enter a room code'); return }
    if (!username) { toast.error('Please enter a username'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/conference/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: code, username }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      const data = await res.json()
      setRoom(code, data.token, data.identity, 'participant', username)
      setStatus('connecting')
      onEnterRoom()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join room')
    } finally {
      setLoading(false)
    }
  }

  // Auto-enter on mount when requested (e.g. "Start Without Sharing" from mobile)
  useEffect(() => {
    if (!autoEnter || autoEnteredRef.current || !username) return
    autoEnteredRef.current = true
    if (mode === 'join' && joinCode.trim()) {
      handleJoin()
    } else if (mode === 'create') {
      handleCreate()
    }
  }, [username]) // eslint-disable-line react-hooks/exhaustive-deps

  const copyLink = () => {
    const url = `${window.location.origin}/conference?code=${createdCode}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Invite link copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const joinUrl = createdCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/conference?code=${createdCode}` : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
    >
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <Video className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">HashDrop Conference</h1>
          <p className="text-muted mt-2">Secure video conferencing for up to 50 participants</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Camera preview */}
          <div className="space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-white/5 border border-white/10">
              {!isCameraOff && stream ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">
                      {username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <span className="text-sm text-muted">{username || 'No username set'}</span>
                </div>
              )}
              {/* Quick controls */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={() => setMicMuted(!isMicMuted)}
                  className={`p-2 rounded-xl border transition-colors ${isMicMuted ? 'bg-red-500/30 border-red-500/40 text-red-400' : 'bg-black/50 border-white/20 text-white hover:bg-black/70'}`}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setCameraOff(!isCameraOff)}
                  className={`p-2 rounded-xl border transition-colors ${isCameraOff ? 'bg-red-500/30 border-red-500/40 text-red-400' : 'bg-black/50 border-white/20 text-white hover:bg-black/70'}`}
                >
                  {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted">
              <Users className="w-4 h-4" />
              <span>Up to 50 participants · Encrypted connection</span>
            </div>
          </div>

          {/* Join/Create panel */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            {/* Tabs */}
            <div className="flex rounded-xl bg-white/5 p-1">
              <button
                onClick={() => setMode('create')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'create' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted hover:text-foreground'}`}
              >
                Start Meeting
              </button>
              <button
                onClick={() => setMode('join')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'join' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted hover:text-foreground'}`}
              >
                Join Meeting
              </button>
            </div>

            {mode === 'create' ? (
              <div className="space-y-4">
                {createdCode ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted">Meeting Code</p>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                      <span className="flex-1 font-mono text-lg font-bold text-primary tracking-widest">{createdCode}</span>
                      <button onClick={copyLink} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted" />}
                      </button>
                      <button onClick={() => setShowQr(!showQr)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <QrCode className="w-4 h-4 text-muted" />
                      </button>
                    </div>
                    {showQr && joinUrl && (
                      <div className="flex justify-center p-4 bg-white rounded-xl">
                        <QRCodeSVG value={joinUrl} size={160} />
                      </div>
                    )}
                    <p className="text-xs text-muted text-center">Share this code with participants</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted">Create a new conference room and invite participants.</p>
                    <button
                      onClick={() => setCreatedCode(generateRoomCode())}
                      className="w-full text-sm py-2 rounded-xl border border-white/10 text-muted hover:bg-white/5 hover:text-foreground transition-colors"
                    >
                      Generate Code
                    </button>
                  </div>
                )}

                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full glass-btn-primary py-3 rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Starting...</>
                  ) : (
                    <><Video className="w-4 h-4" />Start Meeting</>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted">Meeting Code</label>
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="WORD-WORD"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted font-mono text-lg tracking-widest focus:outline-none focus:border-primary/50"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <button
                  onClick={handleJoin}
                  disabled={loading || !joinCode.trim()}
                  className="w-full glass-btn-primary py-3 rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Connecting...</>
                  ) : (
                    <><Video className="w-4 h-4" />Join Meeting</>
                  )}
                </button>
                <p className="text-xs text-muted text-center">
                  You will wait in the waiting room until the host admits you
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
