'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Peer from 'peerjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, ArrowRight, Copy, Check, Clock,
  Send, X, Share2, ScanLine, Loader2, ChevronLeft, Eye, EyeOff, Lock, ShieldCheck
} from 'lucide-react'
import { useChatRoomStore, type RoomMessage } from '@/store/use-chat-room-store'
import { useUsernameStore } from '@/store/use-username-store'
import { generateSecureCode, codeToCallPeerId } from '@/lib/code-generator'
import { QrScanner } from '@/components/transfer/qr-scanner'
import { toast } from 'sonner'
import type { DataConnection } from 'peerjs'
import { useSearchParams } from 'next/navigation'

const CODE_EXPIRY_MS = 10 * 60 * 1000
const MAX_PEERS = 4
const BASE_URL = 'https://hashdrop.metesahankurt.cloud'

async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
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
          <a key={i} href={part} target="_blank" rel="noopener noreferrer"
            className="underline text-primary hover:text-primary/80 break-all">{part}</a>
        ) : <span key={i}>{part}</span>
      )}
    </span>
  )
}

// ============================================================
// PASSWORD SETUP SCREEN — shown when creating a room
// ============================================================
interface PasswordSetupScreenProps {
  onConfirm: (hash: string | null) => void
}

function PasswordSetupScreen({ onConfirm }: PasswordSetupScreenProps) {
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const handleSkip = () => onConfirm(null)
  const handleSet = async () => {
    const trimmed = password.trim()
    if (!trimmed) { onConfirm(null); return }
    const hash = await hashPassword(trimmed)
    onConfirm(hash)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto space-y-5">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Oda Şifresi</h2>
        <p className="text-xs text-muted">Şifre belirleyerek odana yalnızca davet ettiğin kişilerin girmesini sağla.<br />İsteğe bağlı — atlayabilirsin.</p>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            placeholder="Şifre belirle (opsiyonel)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSet()}
            className="glass-input w-full text-sm pr-9"
            style={{ fontSize: '16px' }}
            autoFocus
          />
          <button onClick={() => setShowPwd(!showPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" type="button">
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSkip}
            className="glass-btn flex-1 py-2.5 rounded-xl text-sm text-muted hover:text-foreground"
          >
            Atla
          </button>
          <button
            onClick={handleSet}
            disabled={!password.trim()}
            className="glass-btn-primary flex-1 py-2.5 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Şifreli Oluştur
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
// JOIN SCREEN — shown when user wants to join an existing room
// ============================================================
interface JoinScreenProps {
  username: string
  initialCode?: string | null
  incomingHasPassword?: boolean
  onBack: () => void
  onJoin: (code: string, pwdHash: string | null) => void
}

function JoinScreen({ username, initialCode, incomingHasPassword, onBack, onJoin }: JoinScreenProps) {
  const [inputCode, setInputCode] = useState(initialCode || '')
  const [joinPassword, setJoinPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  // Auto-join only if there is an initial code AND the room is NOT password-protected
  // (if password-protected, we need the user to enter the password first)
  useEffect(() => {
    if (initialCode && !incomingHasPassword && !isJoining) {
      setIsJoining(true)
      onJoin(initialCode, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleJoin = async () => {
    if (!inputCode.trim()) return
    setIsJoining(true)
    const hash = joinPassword ? await hashPassword(joinPassword) : null
    await onJoin(inputCode.trim(), hash)
    setIsJoining(false)
  }

  // If auto-joining (non-password link), show spinner
  if (initialCode && !incomingHasPassword) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto flex flex-col items-center gap-4 py-12">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted text-sm">Odaya bağlanılıyor: <span className="text-primary font-mono">{initialCode}</span></p>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-all text-muted hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Odaya Katıl</h2>
          <p className="text-xs text-muted"><span className="text-primary">{username}</span> olarak katılıyorsun</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        {/* Code input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Oda kodu (ör. Cosmic-Falcon)"
            value={inputCode}
            onChange={e => setInputCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            className="glass-input flex-1 text-base font-mono text-center"
            style={{ fontSize: '16px' }}
            autoFocus={!initialCode}
            readOnly={!!initialCode}
          />
          <button onClick={() => setShowQRScanner(true)} className="glass-card px-3 rounded-xl text-muted hover:text-foreground hover:bg-white/10 transition-all">
            <ScanLine className="w-4 h-4" />
          </button>
        </div>

        {/* Password hint banner if incoming link is password-protected */}
        {initialCode && incomingHasPassword && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            Bu oda şifre korumalı. Katılmak için şifreyi gir.
          </div>
        )}

        {/* Password field — always show for manual join, show for password-protected link */}
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            placeholder={incomingHasPassword ? 'Oda şifresini gir' : 'Şifre (varsa)'}
            value={joinPassword}
            onChange={e => setJoinPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            className="glass-input w-full text-sm pr-9"
            style={{ fontSize: '16px' }}
            autoFocus={!!(initialCode && incomingHasPassword)}
          />
          <button onClick={() => setShowPwd(!showPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" type="button">
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleJoin}
          disabled={!inputCode.trim() || isJoining || (!!incomingHasPassword && !joinPassword.trim())}
          className="glass-btn-primary w-full py-2.5 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Odaya Katıl <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>

      {showQRScanner && (
        <QrScanner
          onCodeScanned={(code) => { setInputCode(code); setShowQRScanner(false); toast.success('QR tarandı!') }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </motion.div>
  )
}

// ============================================================
// LIVE CHAT ROOM
// ============================================================
interface LiveChatRoomProps {
  username: string
  roomCode: string
  roomHasPassword: boolean
  timeLeft: number
  onLeave: () => void
}

function LiveChatRoom({ username, roomCode, roomHasPassword, timeLeft, onLeave }: LiveChatRoomProps) {
  const { messages, participants, dataConnections, addMessage } = useChatRoomStore()
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [canShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const participantList = useMemo(() => Array.from(participants.entries()), [participants])

  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages — scroll the container, NOT the document
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages])

  // Focus input on mount — use preventScroll to stop mobile browsers from scrolling the page
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 80)
    return () => clearTimeout(t)
  }, [])

  // On iOS Safari, the virtual keyboard can push the input out of view.
  // Since the chat is in a fixed container, we only need to ensure
  // the parent scrollable area shows the input — NOT scrollIntoView on the document.
  const handleInputFocus = useCallback(() => {
    // no-op: the fixed container handles visibility
  }, [])

  const sendMessage = useCallback(() => {
    const text = input.trim()
    if (!text) return
    const msg: RoomMessage = { id: crypto.randomUUID(), from: username, text, timestamp: Date.now(), isLocal: true }
    addMessage(msg)
    dataConnections.forEach(conn => { try { conn.send({ type: 'chat', payload: { ...msg, isLocal: false } }) } catch { /* ignore */ } })
    setInput('')
  }, [input, username, addMessage, dataConnections])

  const handleLeave = () => {
    dataConnections.forEach(conn => { try { conn.send({ type: 'leave', username }) } catch { /* ignore */ } })
    onLeave()
  }

  const buildInviteUrl = () => {
    const { username: uname } = useUsernameStore.getState()
    const fromParam = uname ? `?from=${encodeURIComponent(uname)}` : ''
    const pwdParam = roomHasPassword
      ? (fromParam ? '&pwd=1' : '?pwd=1')
      : ''
    return `${BASE_URL}/chatroom/${encodeURIComponent(roomCode)}${fromParam}${pwdParam}`
  }

  const copyCode = () => {
    navigator.clipboard.writeText(buildInviteUrl())
    setCopied(true)
    toast.success(roomHasPassword ? 'Şifreli davet linki kopyalandı!' : 'Davet linki kopyalandı!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareCode = async () => {
    try {
      await navigator.share({
        title: 'HashDrop Chat Odası',
        text: `Odaya katıl: ${roomCode}${roomHasPassword ? ' (şifreli)' : ''}`,
        url: buildInviteUrl(),
      })
    } catch { /* ignore */ }
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-full min-h-0">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="glass-card rounded-t-2xl shrink-0 border-b-0 overflow-hidden">
        {/* Top bar */}
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
                    <Lock className="w-2.5 h-2.5" /> Şifreli
                  </span>
                )}
              </div>
              <p className="text-xs text-muted font-mono">{roomCode}</p>
            </div>
          </div>
          <button onClick={handleLeave}
            className="p-1.5 hover:bg-danger/20 rounded-lg transition-all text-muted hover:text-danger flex items-center gap-1.5 px-3"
            title="Odadan Ayrıl"
          >
            <span className="text-xs font-medium hidden sm:inline">Ayrıl</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info panel — invite link + participants */}
        <div className="px-4 py-3 bg-black/20 border-t border-white/5 space-y-3">
          {/* Invite link row */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted">Davet Linki</span>
              {roomHasPassword && <Lock className="w-3 h-3 text-yellow-400" />}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <a
                  href={buildInviteUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs text-primary hover:underline block w-full"
                >
                  {BASE_URL}/chatroom/{roomCode}{roomHasPassword ? '?pwd=1' : ''}
                </a>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={copyCode}
                  className="glass-btn flex-1 sm:flex-none px-3 py-2 text-xs flex items-center justify-center gap-1.5 rounded-lg">
                  {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Kopyala</span>
                </button>
                {canShare && (
                  <button onClick={shareCode}
                    className="glass-btn flex-1 sm:flex-none px-3 py-2 text-xs flex items-center justify-center gap-1.5 rounded-lg">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Paylaş</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Expiry */}
          {timeLeft > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Clock className="w-3.5 h-3.5" />
              <span>Link {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} içinde sona erer</span>
            </div>
          )}

          {/* Participants */}
          <div className="flex items-start sm:items-center gap-2">
            <span className="text-xs font-medium text-muted shrink-0 mt-1 sm:mt-0">Katılımcılar:</span>
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-xs glass-card px-2.5 py-1 rounded-md flex items-center gap-1.5 border-primary/20 bg-primary/5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />{username} <span className="text-muted">(sen)</span>
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

      {/* ── Messages ───────────────────────────────────── */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto glass-card border-t-0 border-b-0 rounded-none px-3 md:px-4 py-4 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <MessageSquare className="w-10 h-10 text-muted/30" />
            <p className="text-sm text-muted">Oda hazır! İlk mesajı sen gönder.</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map(msg => {
            if (msg.isSystem) {
              return (
                <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-1">
                  <span className="text-xs text-muted/60 italic">{msg.text}</span>
                </motion.div>
              )
            }
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
                className={`flex flex-col ${msg.isLocal ? 'items-end' : 'items-start'}`}>
                {!msg.isLocal && <span className="text-xs text-primary font-medium ml-1 mb-0.5">{msg.from}</span>}
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${msg.isLocal ? 'bg-primary/20 border border-primary/30 rounded-br-sm' : 'glass-card rounded-bl-sm'}`}>
                  <LinkText text={msg.text} />
                </div>
                <span className="text-[10px] text-muted mt-0.5 px-1">{formatTime(msg.timestamp)}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ──────────────────────────────────────── */}
      <div className="glass-card border-t-0 rounded-b-2xl px-3 py-3 shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.nativeEvent.isComposing) return
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
            }}
            placeholder="Mesaj yaz... (Enter)"
            className="glass-input flex-1 text-sm py-2.5 px-3 rounded-xl"
            style={{ fontSize: '16px' }}
            onFocus={handleInputFocus}
          />
          <button
            type="button"
            onClick={sendMessage}
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

// ============================================================
// MAIN — ChatRoomView
// ============================================================
type Step = 'password-setup' | 'creating' | 'join' | 'chatting'

export function ChatRoomView({
  initialUsername,
  initialAction,
  incomingCode: incomingCodeProp,
  incomingHasPassword,
}: {
  initialUsername?: string
  initialAction?: 'create' | 'join'
  /** Room code passed directly from /chatroom/[code] route */
  incomingCode?: string
  incomingHasPassword?: boolean
}) {
  const searchParams = useSearchParams()
  const urlMode = searchParams?.get('mode')
  const urlCode = searchParams?.get('code')
  const urlPwd = searchParams?.get('pwd')
  // Prefer prop-based code (from /chatroom/[code] route), fallback to URL ?code= param
  const incomingCode = incomingCodeProp ?? urlCode
  // Use prop if available, fallback to URL param
  const hasIncomingPassword = incomingHasPassword ?? (urlPwd === '1')

  const {
    setPeer, setStatus, username, setUsername, roomCode, setRoomCode, setRoomPasswordHash,
    addMessage, addParticipant, addDataConnection, removeParticipant, removeDataConnection, resetRoom,
  } = useChatRoomStore()

  useEffect(() => {
    if (initialUsername) setUsername(initialUsername)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Determine initial step:
  // - If we have an incoming code → go straight to join
  // - If action is explicitly 'join' → join screen
  // - Otherwise → password setup before creating
  const initialStep: Step = incomingCode
    ? 'join'
    : initialAction === 'join'
    ? 'join'
    : 'password-setup'

  const [step, setStep] = useState<Step>(initialStep)
  const [timeLeft, setTimeLeft] = useState(CODE_EXPIRY_MS / 1000)
  const [, setIsCreating] = useState(false)
  const [pendingRoomCode] = useState(() => generateSecureCode())
  const [roomHasPassword, setRoomHasPassword] = useState(false)
  const mountedRef = useRef(true)
  const expiryRef = useRef(Date.now() + CODE_EXPIRY_MS)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false; resetRoom() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Countdown timer (only relevant while chatting as host)
  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((expiryRef.current - Date.now()) / 1000))
      setTimeLeft(left)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const addSystemMsg = useCallback((text: string) => {
    addMessage({ id: crypto.randomUUID(), from: 'system', text, timestamp: Date.now(), isLocal: false, isSystem: true })
  }, [addMessage])

  const handleLeave = useCallback(() => {
    resetRoom()
    setStep('password-setup')
    setIsCreating(false)
    setRoomHasPassword(false)
  }, [resetRoom])

  const setupConn = useCallback((conn: DataConnection, remotePeerId: string, localUsername: string, localPwdHash: string | null, announcedRef: React.MutableRefObject<Set<string>>) => {
    conn.on('data', (raw) => {
      const data = raw as { type: string; payload?: RoomMessage; username?: string; hash?: string; participants?: [string, string][]; peerId?: string }

      if (data.type === 'chat' && data.payload) {
        addMessage({ ...data.payload, isLocal: false })
        // Host rebroadcast
        const { peer, dataConnections: conns } = useChatRoomStore.getState()
        if (peer?.id === codeToCallPeerId(useChatRoomStore.getState().roomCode)) {
          conns.forEach((c, id) => {
            if (id !== remotePeerId) {
              try { c.send({ type: 'chat', payload: data.payload }) } catch { /* ignore */ }
            }
          })
        }
      } else if (data.type === 'announce' && data.username) {
        const { participants: existingP } = useChatRoomStore.getState()
        const alreadyKnown = existingP.has(remotePeerId)
        addParticipant(remotePeerId, data.username)
        if (!alreadyKnown) addSystemMsg(`${data.username} odaya katıldı`)
        if (!announcedRef.current.has(remotePeerId)) {
          announcedRef.current.add(remotePeerId)
          conn.send({ type: 'announce', username: localUsername })
          const { participants: p } = useChatRoomStore.getState()
          conn.send({ type: 'participants', participants: Array.from(p.entries()) })
          const { peer: localPeer, dataConnections: conns } = useChatRoomStore.getState()
          if (localPeer?.id === codeToCallPeerId(useChatRoomStore.getState().roomCode)) {
            conns.forEach((c, id) => {
              if (id !== remotePeerId) {
                try { c.send({ type: 'announce-broadcast', username: data.username, peerId: remotePeerId }) } catch { /* ignore */ }
              }
            })
          }
        }
      } else if (data.type === 'participants' && data.participants) {
        const { peer: localPeer } = useChatRoomStore.getState()
        data.participants.forEach(([pid, uname]) => { if (pid !== localPeer?.id) addParticipant(pid, uname) })
      } else if (data.type === 'leave' && data.username) {
        removeParticipant(remotePeerId)
        removeDataConnection(remotePeerId)
        addSystemMsg(`${data.username} odadan ayrıldı`)
      } else if (data.type === 'announce-broadcast' && data.username && data.peerId) {
        const { participants: existingP2 } = useChatRoomStore.getState()
        if (!existingP2.has(data.peerId)) {
          addParticipant(data.peerId, data.username)
          addSystemMsg(`${data.username} odaya katıldı`)
        }
      } else if (data.type === 'auth') {
        if (localPwdHash) {
          if (data.hash === localPwdHash) conn.send({ type: 'auth-ok' })
          else { conn.send({ type: 'auth-rejected' }); setTimeout(() => conn.close(), 300) }
        } else {
          conn.send({ type: 'auth-ok' })
        }
      } else if (data.type === 'auth-rejected') {
        toast.error('Yanlış şifre — erişim reddedildi')
        handleLeave()
      }
    })

    conn.on('close', () => {
      const { participants } = useChatRoomStore.getState()
      const uname = participants.get(remotePeerId)
      removeParticipant(remotePeerId)
      removeDataConnection(remotePeerId)
      if (uname) addSystemMsg(`${uname} odadan ayrıldı`)
    })

    conn.on('error', err => console.error('[ChatRoom]', err))
    addDataConnection(remotePeerId, conn)
  }, [addMessage, addParticipant, removeParticipant, addDataConnection, removeDataConnection, addSystemMsg, handleLeave])

  // Create room: called after password setup (hash may be null for no password)
  const createRoom = useCallback(async (code: string, pwdHash: string | null) => {
    const currentUsername = useChatRoomStore.getState().username || initialUsername || ''
    if (!currentUsername) return

    setIsCreating(true)
    setRoomCode(code)
    setRoomPasswordHash(pwdHash)
    setRoomHasPassword(!!pwdHash)
    setStatus('generating')

    const peerId = codeToCallPeerId(code)
    const announcedRef = { current: new Set<string>() }

    const peerConfig = {
      host: 'hashdrop.onrender.com', port: 443, path: '/', secure: true, debug: 1,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
    }

    const newPeer = new Peer(peerId, peerConfig)

    newPeer.on('open', () => {
      if (!mountedRef.current) return
      setPeer(newPeer)
      setStatus('connected')
      setStep('chatting')
      setIsCreating(false)
      addSystemMsg(pwdHash ? 'Şifreli oda oluşturuldu! Davet linkini paylaş.' : 'Oda hazır! Davet linkini paylaş.')
    })

    newPeer.on('connection', (conn) => {
      const { dataConnections } = useChatRoomStore.getState()
      if (dataConnections.size >= MAX_PEERS) { conn.close(); return }
      conn.on('open', () => {
        setupConn(conn, conn.peer, currentUsername, pwdHash, announcedRef)
        conn.send({ type: 'announce', username: currentUsername })
        const { participants: p } = useChatRoomStore.getState()
        conn.send({ type: 'participants', participants: Array.from(p.entries()) })
        announcedRef.current.add(conn.peer)
      })
    })

    newPeer.on('error', (err) => {
      if (err.type === 'unavailable-id') toast.error('Bu kod kullanımda, tekrar dene.')
      else toast.error('Bağlantı hatası')
      setStatus('failed')
      setIsCreating(false)
      setStep('password-setup')
    })
  }, [initialUsername, setPeer, setStatus, setRoomCode, setRoomPasswordHash, addSystemMsg, setupConn])

  // Password setup confirmed → create room
  const handlePasswordSetupConfirm = useCallback((pwdHash: string | null) => {
    setStep('creating')
    createRoom(pendingRoomCode, pwdHash)
  }, [createRoom, pendingRoomCode])

  // Join an existing room
  const handleJoin = useCallback(async (code: string, pwdHash: string | null) => {
    const currentUsername = useChatRoomStore.getState().username || initialUsername || ''
    if (!currentUsername) return

    setRoomCode(code)
    setRoomPasswordHash(pwdHash)
    setStatus('generating')

    const joinerPeerId = codeToCallPeerId(generateSecureCode())
    const hostPeerId = codeToCallPeerId(code)
    const announcedRef = { current: new Set<string>() }

    const peerConfig = {
      host: 'hashdrop.onrender.com', port: 443, path: '/', secure: true, debug: 1,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
    }

    const newPeer = new Peer(joinerPeerId, peerConfig)

    newPeer.on('open', () => {
      if (!mountedRef.current) return
      setPeer(newPeer)

      const conn = newPeer.connect(hostPeerId, { reliable: true })
      conn.on('open', () => {
        setupConn(conn, hostPeerId, currentUsername, null, announcedRef)
        conn.send({ type: 'auth', hash: pwdHash || '' })
        conn.send({ type: 'announce', username: currentUsername })
        announcedRef.current.add(hostPeerId)
        setStatus('connected')
        setStep('chatting')
        addSystemMsg('Odaya bağlandın!')
      })

      conn.on('error', () => {
        toast.error('Odaya bağlanılamadı. Kod doğru mu?')
        setStatus('failed')
        setStep('join')
      })
    })

    newPeer.on('error', () => {
      toast.error('Bağlantı hatası. Tekrar dene.')
      setStatus('failed')
      setStep('join')
    })
  }, [initialUsername, setPeer, setStatus, setRoomCode, setRoomPasswordHash, addSystemMsg, setupConn])

  // Prevent body/document scroll when chat room is mounted (mobile Safari included)
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

  return (
    <div className="fixed left-0 right-0 bottom-0 flex flex-col z-10 overflow-hidden px-4 md:px-8 pb-6"
      style={{ top: 64 }}
    >
      <AnimatePresence mode="wait">

        {/* Password setup step */}
        {step === 'password-setup' && (
          <motion.div key="password-setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center">
            <PasswordSetupScreen onConfirm={handlePasswordSetupConfirm} />
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => setStep('join')}
              className="mt-6 text-xs text-muted hover:text-foreground underline transition-colors"
            >
              Var olan bir odaya katıl
            </motion.button>
          </motion.div>
        )}

        {/* Creating spinner */}
        {step === 'creating' && (
          <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted">Oda oluşturuluyor...</p>
          </motion.div>
        )}

        {/* Join screen */}
        {step === 'join' && (
          <motion.div key="join" className="w-full flex-1 flex flex-col items-center justify-center">
            <JoinScreen
              username={username || initialUsername || ''}
              initialCode={incomingCode}
              incomingHasPassword={hasIncomingPassword}
              onBack={() => setStep('password-setup')}
              onJoin={handleJoin}
            />
          </motion.div>
        )}

        {/* Live chat */}
        {step === 'chatting' && (
          <motion.div key="chatting" className="w-full h-full flex-1 flex flex-col min-h-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LiveChatRoom
              username={username || initialUsername || ''}
              roomCode={roomCode}
              roomHasPassword={roomHasPassword}
              timeLeft={timeLeft}
              onLeave={handleLeave}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
