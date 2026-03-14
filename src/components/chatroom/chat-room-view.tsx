'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, ArrowRight, Copy, Check, Clock,
  Send, X, Share2, ScanLine, Loader2, ChevronLeft, Eye, EyeOff, Lock, QrCode, Paperclip
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { Room, RoomEvent, type RemoteParticipant } from 'livekit-client'
import { useChatRoomStore, type RoomMessage } from '@/store/use-chat-room-store'
import { useUsernameStore } from '@/store/use-username-store'
import { generateSecureCode } from '@/lib/code-generator'
import { QrScanner } from '@/components/transfer/qr-scanner'

const CODE_EXPIRY_MS = 10 * 60 * 1000
const BASE_URL = 'https://hashdrop.metesahankurt.cloud'
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL

type ChatPayload =
  | { type: 'chat'; payload: RoomMessage }  // legacy web format
  | { type: 'chat'; id: string; content: string; sender: string; senderIdentity: string; timestamp: number }  // unified format
  | { type: 'file-start'; fileId: string; filename: string; mimeType: string; totalChunks: number; totalSize: number; sender: string }
  | { type: 'file-chunk'; fileId: string; index: number; data: string }
  | { type: 'file-end'; fileId: string }

type PendingChatFile = {
  chunks: string[]
  totalChunks: number
  filename: string
  mimeType: string
  sender: string
  receivedCount: number
}

function getParticipantUsername(participant?: { metadata?: string; identity?: string }) {
  try {
    const metadata = JSON.parse(participant?.metadata || '{}') as { username?: string }
    return metadata.username || participant?.identity || 'Participant'
  } catch {
    return participant?.identity || 'Participant'
  }
}

async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function LinkText({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  return (
    <span>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary hover:text-primary/80 break-all"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  )
}

interface PasswordSetupScreenProps {
  roomCode: string
  onConfirm: (hash: string | null) => void
}

function PasswordSetupScreen({ roomCode, onConfirm }: PasswordSetupScreenProps) {
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSet = async () => {
    const trimmed = password.trim()
    if (!trimmed) {
      onConfirm(null)
      return
    }
    onConfirm(await hashPassword(trimmed))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto space-y-5"
    >
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <MessageSquare className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Create Chat Room</h2>
        <p className="text-xs text-muted">Your room code is ready. Optionally add a password.</p>
      </div>

      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
        <span className="flex-1 font-mono text-lg font-bold text-primary tracking-widest">{roomCode}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(roomCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted" />}
        </button>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-muted flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Password (optional)
          </p>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Leave empty for no password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSet()}
              className="glass-input w-full text-sm pr-9"
              style={{ fontSize: '16px' }}
              autoFocus
            />
            <button
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
              type="button"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => onConfirm(null)} className="glass-btn flex-1 py-2.5 rounded-xl text-sm">
            Skip Password
          </button>
          <button onClick={() => void handleSet()} className="glass-btn-primary flex-1 py-2.5 rounded-xl text-sm">
            Create Room
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function JoinScreen({
  username,
  initialCode,
  incomingHasPassword,
  onBack,
  onJoin,
  embedded = false,
}: {
  username: string
  initialCode?: string
  incomingHasPassword?: boolean
  onBack: () => void
  onJoin: (code: string, passwordHash: string | null) => Promise<void> | void
  embedded?: boolean
}) {
  const [inputCode, setInputCode] = useState(initialCode || '')
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [joinPassword, setJoinPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const executeJoin = useCallback(async () => {
    const normalized = inputCode.trim().toUpperCase()
    if (!normalized) return
    setIsJoining(true)
    try {
      const hash = joinPassword.trim() ? await hashPassword(joinPassword.trim()) : null
      await onJoin(normalized, hash)
    } finally {
      setIsJoining(false)
    }
  }, [inputCode, joinPassword, onJoin])

  useEffect(() => {
    if (!initialCode || !username) return
    const timer = setTimeout(() => {
      void executeJoin()
    }, 350)
    return () => clearTimeout(timer)
  }, [initialCode, username, executeJoin])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto space-y-5"
    >
      {!embedded && (
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="glass-btn px-3 py-2 rounded-xl text-sm flex items-center gap-1.5">
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      )}

      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <MessageSquare className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Join Room</h2>
        <p className="text-xs text-muted">Enter the room code you received.</p>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-muted">Room Code</p>
          <div className="flex gap-2">
            <input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Room code (e.g. COSMIC-FALCON)"
              className="glass-input flex-1 font-mono tracking-widest text-sm"
              style={{ fontSize: '16px' }}
              autoFocus={!initialCode}
            />
            <button onClick={() => setShowQRScanner(true)} className="glass-icon-btn w-11 h-11 shrink-0">
              <ScanLine className="w-4 h-4" />
            </button>
          </div>
        </div>

        {(incomingHasPassword || joinPassword) && (
          <div className="space-y-1">
            <p className="text-xs text-muted flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Password
            </p>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Enter room password"
                className="glass-input w-full pr-9"
                style={{ fontSize: '16px' }}
              />
              <button
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
                type="button"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => void executeJoin()}
          disabled={!inputCode.trim() || isJoining || (!!incomingHasPassword && !joinPassword.trim())}
          className="glass-btn-primary w-full py-2.5 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Join Room <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>

      {showQRScanner && (
        <QrScanner
          onCodeScanned={(code) => {
            setInputCode(code)
            setShowQRScanner(false)
            toast.success('QR scanned!')
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </motion.div>
  )
}

function LiveChatRoom({
  username,
  roomCode,
  roomHasPassword,
  timeLeft,
  participants,
  onSendMessage,
  onSendFile,
  onLeave,
  embedded = false,
}: {
  username: string
  roomCode: string
  roomHasPassword: boolean
  timeLeft: number
  participants: Map<string, string>
  onSendMessage: (text: string) => void
  onSendFile: (file: File) => Promise<void>
  onLeave: () => void
  embedded?: boolean
}) {
  const { messages } = useChatRoomStore()
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [canShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const participantList = useMemo(() => Array.from(participants.entries()), [participants])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [messages])

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 80)
    return () => clearTimeout(t)
  }, [])

  const buildInviteUrl = () => {
    const { username: uname } = useUsernameStore.getState()
    const fromParam = uname ? `?from=${encodeURIComponent(uname)}` : ''
    const pwdParam = roomHasPassword ? (fromParam ? '&pwd=1' : '?pwd=1') : ''
    return `${BASE_URL}/chatroom/${encodeURIComponent(roomCode)}${fromParam}${pwdParam}`
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-full min-h-0">
      <div className="glass-card rounded-t-2xl shrink-0 border-b-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-black/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Chat Room</p>
                {roomHasPassword && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/25 text-yellow-400">
                    <Lock className="w-2.5 h-2.5" /> Protected
                  </span>
                )}
              </div>
              <p className="text-xs text-muted font-mono">{roomCode}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (embedded) {
                (window as any).ReactNativeWebView?.postMessage(JSON.stringify({ type: 'leave' }))
              } else {
                onLeave()
              }
            }}
            className="p-1.5 hover:bg-danger/20 rounded-lg transition-all text-muted hover:text-danger flex items-center gap-1.5 px-3"
            title="Leave Room"
          >
            {!embedded && <span className="text-xs font-medium hidden sm:inline">Leave</span>}
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 bg-black/20 border-t border-white/5 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted">Invite Link</span>
              {roomHasPassword && <Lock className="w-3 h-3 text-yellow-400" />}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <span className="truncate text-xs text-primary block w-full select-none cursor-default">
                  {BASE_URL}/chatroom/{roomCode}{roomHasPassword ? '?pwd=1' : ''}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(buildInviteUrl())
                    setCopied(true)
                    toast.success(roomHasPassword ? 'Protected invite link copied!' : 'Invite link copied!')
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="glass-btn flex-1 sm:flex-none px-3 py-2 text-xs flex items-center justify-center gap-1.5 rounded-lg"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
                {canShare && (
                  <button
                    onClick={() =>
                      navigator.share({
                        title: 'HashDrop Chat Room',
                        text: `Join room: ${roomCode}${roomHasPassword ? ' (protected)' : ''}`,
                        url: buildInviteUrl(),
                      }).catch(() => undefined)
                    }
                    className="glass-btn flex-1 sm:flex-none px-3 py-2 text-xs flex items-center justify-center gap-1.5 rounded-lg"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                )}
                <button
                  onClick={() => setShowQr(!showQr)}
                  className={`glass-btn flex-1 sm:flex-none px-3 py-2 text-xs flex items-center justify-center gap-1.5 rounded-lg ${showQr ? 'text-primary border-primary/30' : ''}`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">QR</span>
                </button>
              </div>
            </div>
            {showQr && (
              <div className="flex justify-center p-3 bg-white rounded-xl mt-1">
                <QRCodeSVG value={buildInviteUrl()} size={140} />
              </div>
            )}
          </div>

          {timeLeft > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Clock className="w-3.5 h-3.5" />
              <span>Link expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
          )}

          <div className="flex items-start sm:items-center gap-2">
            <span className="text-xs font-medium text-muted shrink-0 mt-1 sm:mt-0">Participants:</span>
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-xs glass-card px-2.5 py-1 rounded-md flex items-center gap-1.5 border-primary/20 bg-primary/5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />{username} <span className="text-muted">(you)</span>
              </span>
              {participantList.map(([pid, uname]) => (
                <span key={pid} className="text-xs glass-card px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full" />{uname}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto glass-card border-t-0 border-b-0 rounded-none px-3 md:px-4 py-4 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <MessageSquare className="w-10 h-10 text-muted/30" />
            <p className="text-sm text-muted">Room is ready! Send the first message.</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-1">
                  <span className="text-xs text-muted/60 italic">{msg.text}</span>
                </motion.div>
              )
            }
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex flex-col ${msg.isLocal ? 'items-end' : 'items-start'}`}
              >
                {!msg.isLocal && <span className="text-xs text-primary font-medium ml-1 mb-0.5">{msg.from}</span>}
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${msg.isLocal ? 'bg-primary/20 border border-primary/30 rounded-br-sm' : 'glass-card rounded-bl-sm'}`}>
                  {msg.fileUrl ? (
                    <>
                      <span>{msg.text}</span>
                      {msg.fileMime?.startsWith('image/') ? (
                        <img
                          src={msg.fileUrl}
                          alt={msg.fileName}
                          className="mt-1 max-w-[200px] max-h-[160px] object-contain rounded-lg cursor-pointer"
                          onClick={() => window.open(msg.fileUrl, '_blank')}
                        />
                      ) : (
                        <a href={msg.fileUrl} download={msg.fileName} className="mt-1 flex items-center gap-1.5 text-xs text-primary hover:underline">
                          <Paperclip className="w-3 h-3" />{msg.fileName}
                        </a>
                      )}
                    </>
                  ) : (
                    <LinkText text={msg.text} />
                  )}
                </div>
                <span className="text-[10px] text-muted mt-0.5 px-1">{formatTime(msg.timestamp)}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="glass-card border-t-0 rounded-b-2xl px-3 py-3 shrink-0">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.zip,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setIsSending(true)
              void onSendFile(file).finally(() => setIsSending(false))
              e.target.value = ''
            }}
          />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (!input.trim()) return
                onSendMessage(input.trim())
                setInput('')
              }
            }}
            placeholder="Type a message... (Enter)"
            className="glass-input flex-1 text-sm py-2.5 px-3 rounded-xl"
            style={{ fontSize: '16px' }}
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSending} className="w-10 h-10 shrink-0 glass-icon-btn disabled:opacity-40" title="Attach file">
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!input.trim()) return
              onSendMessage(input.trim())
              setInput('')
            }}
            disabled={!input.trim()}
            className="w-10 h-10 shrink-0 glass-icon-btn disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

type Step = 'password-setup' | 'creating' | 'join' | 'chatting'

export function ChatRoomView({
  initialUsername,
  initialAction,
  incomingCode: incomingCodeProp,
  incomingHasPassword,
  embedded = false,
}: {
  initialUsername?: string
  initialAction?: 'create' | 'join'
  incomingCode?: string
  incomingHasPassword?: boolean
  embedded?: boolean
}) {
  const searchParams = useSearchParams()
  const urlCode = searchParams?.get('code')
  const urlPwd = searchParams?.get('pwd')
  const topInset = embedded ? (Number(searchParams?.get('topInset') ?? 0) || 0) : 0
  const incomingCode = incomingCodeProp ?? urlCode ?? undefined
  const hasIncomingPassword = incomingHasPassword ?? (urlPwd === '1')

  const {
    setStatus, username, setUsername, roomCode, setRoomCode, setRoomPasswordHash,
    addMessage, addParticipant, removeParticipant, resetRoom,
  } = useChatRoomStore()
  const participants = useChatRoomStore((state) => state.participants)

  if (initialUsername && !username) {
    setUsername(initialUsername)
  }

  const initialStep: Step = incomingCode ? 'join' : initialAction === 'join' ? 'join' : 'password-setup'
  const [step, setStep] = useState<Step>(initialStep)
  const [timeLeft, setTimeLeft] = useState(CODE_EXPIRY_MS / 1000)
  const [isCreating, setIsCreating] = useState(false)
  const [pendingRoomCode] = useState(() => generateSecureCode())
  const [roomHasPassword, setRoomHasPassword] = useState(false)
  const mountedRef = useRef(true)
  const roomRef = useRef<Room | null>(null)
  const pendingFilesRef = useRef<Map<string, PendingChatFile>>(new Map())
  const expiryRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    expiryRef.current = Date.now() + CODE_EXPIRY_MS
    return () => {
      mountedRef.current = false
      roomRef.current?.disconnect()
      resetRoom()
    }
  }, [resetRoom])

  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((expiryRef.current - Date.now()) / 1000))
      setTimeLeft(left)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
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
  }, [])

  const addSystemMsg = useCallback((text: string) => {
    addMessage({ id: crypto.randomUUID(), from: 'system', text, timestamp: Date.now(), isLocal: false, isSystem: true })
  }, [addMessage])

  // Sets up event listeners only — call this BEFORE room.connect() so no events are missed
  const setupRoomListeners = useCallback((room: Room) => {
    console.log('[ChatRoom][WEB] setupRoomListeners called — attaching event listeners')

    room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      const remoteName = getParticipantUsername(participant)
      console.log('[ChatRoom][WEB] ParticipantConnected:', participant.identity, 'name:', remoteName, 'metadata:', participant.metadata)
      addParticipant(participant.identity, remoteName)
      addSystemMsg(`${remoteName} joined the room`)
    })

    room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      const remoteName = getParticipantUsername(participant)
      console.log('[ChatRoom][WEB] ParticipantDisconnected:', participant.identity, 'name:', remoteName)
      removeParticipant(participant.identity)
      addSystemMsg(`${remoteName} left the room`)
    })

    room.on(RoomEvent.Disconnected, (reason) => {
      console.log('[ChatRoom][WEB] Disconnected from room, reason:', reason)
      if (!mountedRef.current) return
      setStatus('ended')
    })

    room.on(RoomEvent.DataReceived, (payload, participant) => {
      try {
        const raw = new TextDecoder().decode(payload)
        console.log('[ChatRoom][WEB] DataReceived raw:', raw.slice(0, 200), 'from:', participant?.identity)
        const data = JSON.parse(raw) as ChatPayload
        const sender = participant ? getParticipantUsername(participant) : 'Participant'

        if (data.type === 'chat') {
          if ('content' in data) {
            // Unified flat format (mobile / new web)
            addMessage({
              id: data.id || crypto.randomUUID(),
              from: data.sender || sender,
              text: data.content,
              timestamp: data.timestamp,
              isLocal: false,
            })
          } else {
            // Legacy nested payload format (old web-to-web)
            addMessage({
              ...data.payload,
              from: sender,
              isLocal: false,
            })
          }
          return
        }

        if (data.type === 'file-start') {
          pendingFilesRef.current.set(data.fileId, {
            chunks: new Array(data.totalChunks).fill(''),
            totalChunks: data.totalChunks,
            filename: data.filename,
            mimeType: data.mimeType,
            sender: data.sender,
            receivedCount: 0,
          })
          return
        }

        if (data.type === 'file-chunk') {
          const pending = pendingFilesRef.current.get(data.fileId)
          if (!pending) return
          pending.chunks[data.index] = data.data
          pending.receivedCount += 1
          return
        }

        if (data.type === 'file-end') {
          const pending = pendingFilesRef.current.get(data.fileId)
          if (!pending || pending.receivedCount < pending.totalChunks) return
          const fileUrl = `data:${pending.mimeType};base64,${pending.chunks.join('')}`
          addMessage({
            id: `file-${data.fileId}`,
            from: sender,
            text: `📎 ${pending.filename}`,
            timestamp: Date.now(),
            isLocal: false,
            fileUrl,
            fileName: pending.filename,
            fileMime: pending.mimeType,
          })
          pendingFilesRef.current.delete(data.fileId)
        }
      } catch (error) {
        console.error('[ChatRoom] Failed to parse data payload', error)
      }
    })
  }, [addParticipant, addMessage, addSystemMsg, removeParticipant, setStatus])

  const connectToChatRoom = useCallback(async ({
    endpoint,
    roomName,
    localUsername,
    passwordHash,
  }: {
    endpoint: '/api/chatroom/create' | '/api/chatroom/join'
    roomName: string
    localUsername: string
    passwordHash: string | null
  }) => {
    if (!LIVEKIT_URL) {
      console.error('[ChatRoom][WEB] LIVEKIT_URL is not set!')
      toast.error('Chat service is not configured.')
      setStatus('failed')
      return
    }

    console.log('[ChatRoom][WEB] connectToChatRoom — endpoint:', endpoint, 'room:', roomName, 'user:', localUsername, 'livekit:', LIVEKIT_URL)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName,
        username: localUsername,
        passwordHash,
      }),
    })

    const data = await response.json()
    console.log('[ChatRoom][WEB] API response status:', response.status, 'data:', JSON.stringify(data).slice(0, 200))
    if (!response.ok) {
      throw new Error(data.error || 'Failed to join chat room')
    }

    const room = new Room({
      adaptiveStream: false,
      dynacast: false,
    })

    roomRef.current?.disconnect()
    roomRef.current = room

    // Attach listeners BEFORE connecting so no ParticipantConnected events are missed
    setupRoomListeners(room)

    console.log('[ChatRoom][WEB] Calling room.connect() to:', LIVEKIT_URL)
    await room.connect(LIVEKIT_URL, data.token, {
      autoSubscribe: true,
    })
    console.log('[ChatRoom][WEB] room.connect() resolved — localIdentity:', room.localParticipant?.identity)

    // Sync any participants already in the room when we connected
    const existing = Array.from(room.remoteParticipants.values())
    console.log('[ChatRoom][WEB] remoteParticipants after connect:', existing.length, existing.map(p => ({ id: p.identity, meta: p.metadata })))
    existing.forEach((participant) => {
      addParticipant(participant.identity, getParticipantUsername(participant))
    })

    addSystemMsg(`Connected as ${localUsername}`)
    setRoomCode(roomName)
    setRoomPasswordHash(passwordHash)
    setRoomHasPassword(Boolean(passwordHash))
    setStatus('connected')
    setStep('chatting')
    setIsCreating(false)
  }, [setupRoomListeners, addParticipant, addSystemMsg, setRoomCode, setRoomPasswordHash, setStatus])

  const createRoom = useCallback(async (code: string, passwordHash: string | null) => {
    let currentUsername = useChatRoomStore.getState().username
    if (!currentUsername && initialUsername) {
      setUsername(initialUsername)
      currentUsername = initialUsername
    }
    if (!currentUsername) return

    setIsCreating(true)
    setStatus('generating')
    try {
      await connectToChatRoom({
        endpoint: '/api/chatroom/create',
        roomName: code,
        localUsername: currentUsername,
        passwordHash,
      })
      addSystemMsg(passwordHash ? 'Protected room created! Share the invite link.' : 'Room is ready! Share the invite link.')
    } catch (error) {
      console.error('[ChatRoom] create failed', error)
      toast.error(error instanceof Error ? error.message : 'Could not create room')
      setStatus('failed')
      setIsCreating(false)
      setStep('password-setup')
    }
  }, [addSystemMsg, connectToChatRoom, initialUsername, setStatus, setUsername])

  const handleJoin = useCallback(async (code: string, passwordHash: string | null) => {
    let currentUsername = useChatRoomStore.getState().username
    if (!currentUsername && initialUsername) {
      setUsername(initialUsername)
      currentUsername = initialUsername
    }
    if (!currentUsername) {
      toast.error('Please set a username first')
      return
    }

    setStatus('joining')
    try {
      await connectToChatRoom({
        endpoint: '/api/chatroom/join',
        roomName: code,
        localUsername: currentUsername,
        passwordHash,
      })
      addSystemMsg('Connected to room!')
    } catch (error) {
      console.error('[ChatRoom] join failed', error)
      toast.error(error instanceof Error ? error.message : 'Could not join room')
      setStatus('failed')
      setStep('join')
    }
  }, [addSystemMsg, connectToChatRoom, initialUsername, setStatus, setUsername])

  const handleLeave = useCallback(() => {
    roomRef.current?.disconnect()
    roomRef.current = null
    resetRoom()
    setStep('password-setup')
    setIsCreating(false)
    setRoomHasPassword(false)
  }, [resetRoom])

  const sendMessage = useCallback((text: string) => {
    const room = roomRef.current
    const localUsername = username || initialUsername || 'You'
    if (!room?.localParticipant || !text.trim()) return

    const msg: RoomMessage = {
      id: crypto.randomUUID(),
      from: localUsername,
      text,
      timestamp: Date.now(),
      isLocal: true,
    }
    addMessage(msg)
    void room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify({
        type: 'chat',
        id: msg.id,
        content: text,
        sender: localUsername,
        senderIdentity: room.localParticipant.identity,
        timestamp: msg.timestamp,
      })),
      { reliable: true },
    )
  }, [addMessage, initialUsername, username])

  const sendFileToRoom = useCallback(async (file: File) => {
    const room = roomRef.current
    const localUsername = username || initialUsername || 'You'
    if (!room?.localParticipant) return

    const MAX = 5 * 1024 * 1024
    if (file.size > MAX) {
      toast.error('File too large (max 5MB)')
      return
    }

    const fileId = crypto.randomUUID()
    const CHUNK_BYTES = 9000
    const totalChunks = Math.ceil(file.size / CHUNK_BYTES)
    const encode = (obj: ChatPayload) => new TextEncoder().encode(JSON.stringify(obj))

    try {
      await room.localParticipant.publishData(
        encode({
          type: 'file-start',
          fileId,
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          totalChunks,
          totalSize: file.size,
          sender: localUsername,
        }),
        { reliable: true },
      )

      for (let i = 0; i < totalChunks; i += 1) {
        const slice = file.slice(i * CHUNK_BYTES, (i + 1) * CHUNK_BYTES)
        const bytes = new Uint8Array(await slice.arrayBuffer())
        let binary = ''
        for (let j = 0; j < bytes.byteLength; j += 1) binary += String.fromCharCode(bytes[j])
        await room.localParticipant.publishData(
          encode({ type: 'file-chunk', fileId, index: i, data: btoa(binary) }),
          { reliable: true },
        )
      }

      await room.localParticipant.publishData(encode({ type: 'file-end', fileId }), { reliable: true })

      const reader = new FileReader()
      reader.onload = () => {
        addMessage({
          id: `file-${fileId}-local`,
          from: localUsername,
          text: `📎 ${file.name}`,
          timestamp: Date.now(),
          isLocal: true,
          fileUrl: reader.result as string,
          fileName: file.name,
          fileMime: file.type || 'application/octet-stream',
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('[ChatRoom] file send failed', error)
      toast.error('Failed to send file')
    }
  }, [addMessage, initialUsername, username])

  const participantMap = useMemo(() => new Map(participants), [participants])

  return (
    <div
      className={`fixed left-0 right-0 bottom-0 ${embedded ? 'top-0' : 'top-20'} flex flex-col z-10 overflow-hidden px-4 md:px-8 ${embedded ? 'pb-2' : 'pb-6'}`}
      style={topInset > 0 ? { paddingTop: topInset } : undefined}
    >
      <AnimatePresence mode="wait">
        {step === 'password-setup' && (
          <motion.div key="password-setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center">
            <PasswordSetupScreen roomCode={pendingRoomCode} onConfirm={(hash) => {
              setStep('creating')
              void createRoom(pendingRoomCode, hash)
            }} />
            {!embedded && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => setStep('join')}
                className="mt-6 text-xs text-muted hover:text-foreground underline transition-colors"
              >
                Join an existing room
              </motion.button>
            )}
          </motion.div>
        )}

        {step === 'creating' && (
          <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted">{isCreating ? 'Creating room...' : 'Preparing chat room...'}</p>
          </motion.div>
        )}

        {step === 'join' && (
          <motion.div key="join" className="w-full flex-1 flex flex-col items-center justify-center">
            <JoinScreen
              username={username || initialUsername || ''}
              initialCode={incomingCode}
              incomingHasPassword={hasIncomingPassword}
              onBack={() => setStep('password-setup')}
              onJoin={handleJoin}
              embedded={embedded}
            />
          </motion.div>
        )}

        {step === 'chatting' && (
          <motion.div key="chatting" className="w-full h-full flex-1 flex flex-col min-h-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LiveChatRoom
              username={username || initialUsername || ''}
              roomCode={roomCode}
              roomHasPassword={roomHasPassword}
              timeLeft={timeLeft}
              participants={participantMap}
              onSendMessage={sendMessage}
              onSendFile={sendFileToRoom}
              onLeave={handleLeave}
              embedded={embedded}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
