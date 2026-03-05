'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Peer from 'peerjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, ArrowRight, Copy, Check, Clock,
  Send, Users, X, QrCode, Share2, ScanLine, Loader2, ChevronLeft, Eye, EyeOff
} from 'lucide-react'
import { useChatRoomStore, type RoomMessage } from '@/store/use-chat-room-store'
import { useUsernameStore } from '@/store/use-username-store'
import { generateSecureCode, codeToCallPeerId } from '@/lib/code-generator'
import { QrScanner } from '@/components/transfer/qr-scanner'
import { toast } from 'sonner'
import type { DataConnection } from 'peerjs'

const CODE_EXPIRY_MS = 10 * 60 * 1000
const MAX_PEERS = 4

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
// JOIN SCREEN — shown when user wants to join an existing room
// ============================================================
interface JoinScreenProps {
  username: string
  onBack: () => void
  onJoin: (code: string, pwdHash: string | null) => void
}

function JoinScreen({ username, onBack, onJoin }: JoinScreenProps) {
  const [inputCode, setInputCode] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)

  const handleJoin = async () => {
    if (!inputCode.trim()) return
    const hash = joinPassword ? await hashPassword(joinPassword) : null
    onJoin(inputCode.trim(), hash)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-all text-muted hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Join a Room</h2>
          <p className="text-xs text-muted">Joining as <span className="text-primary">{username}</span></p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter room code (e.g. Cosmic-Falcon)"
            value={inputCode}
            onChange={e => setInputCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            className="glass-input flex-1 text-base font-mono text-center"
            style={{ fontSize: '16px' }}
            autoFocus
          />
          <button onClick={() => setShowQRScanner(true)} className="glass-card px-3 rounded-xl text-muted hover:text-foreground hover:bg-white/10 transition-all">
            <ScanLine className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            placeholder="Password (if any)"
            value={joinPassword}
            onChange={e => setJoinPassword(e.target.value)}
            className="glass-input w-full text-sm pr-9"
            style={{ fontSize: '16px' }}
          />
          <button onClick={() => setShowPwd(!showPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" type="button">
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleJoin}
          disabled={!inputCode.trim()}
          className="glass-btn-primary w-full py-2.5 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
        >
          Join Room <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {showQRScanner && (
        <QrScanner
          onCodeScanned={(code) => { setInputCode(code); setShowQRScanner(false); toast.success('QR scanned!') }}
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
  timeLeft: number
  onLeave: () => void
}

function LiveChatRoom({ username, roomCode, timeLeft, onLeave }: LiveChatRoomProps) {
  const { messages, participants, dataConnections, addMessage } = useChatRoomStore()
  const [input, setInput] = useState('')
  const [showParticipants, setShowParticipants] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [canShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share)
  const bottomRef = useRef<HTMLDivElement>(null)
  // Only show remote participants (not self)
  const participantList = useMemo(() => Array.from(participants.entries()), [participants])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

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

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true); toast.success('Code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareCode = async () => {
    const { username: uname } = useUsernameStore.getState()
    const fromParam = uname ? `&from=${encodeURIComponent(uname)}` : ''
    try {
      await navigator.share({
        title: 'HashDrop Chat Room',
        text: `Join my chat room: ${roomCode}`,
        url: `https://hashdrop.metesahankurt.cloud?mode=chatroom&code=${roomCode}${fromParam}`
      })
    } catch { /* ignore */ }
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)', minHeight: 480 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 glass-card rounded-t-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Chat Room</p>
            <p className="text-xs text-muted">{username}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Room code toggle */}
          <button
            onClick={() => setShowCode(!showCode)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted hover:text-foreground glass-card rounded-lg transition-all"
            title="Share room code"
          >
            <QrCode className={`w-3.5 h-3.5 ${showCode ? 'text-primary' : ''}`} />
            <span className="hidden sm:inline">Invite</span>
          </button>
          {/* Participants count */}
          <button onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted hover:text-foreground glass-card rounded-lg transition-all">
            <Users className="w-3.5 h-3.5" />
            <span>{1 + participantList.length}</span>
          </button>
          <button onClick={handleLeave} className="p-1.5 hover:bg-danger/20 rounded-lg transition-all text-muted hover:text-danger" title="Leave">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Room code panel */}
      <AnimatePresence>
        {showCode && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="glass-card border-t-0 px-4 py-3 overflow-hidden shrink-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-primary font-bold tracking-wide text-sm flex-1">{roomCode}</span>
              <button onClick={copyCode} className="p-1.5 hover:bg-white/10 rounded-md transition-all">
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted" />}
              </button>
              {canShare && (
                <button onClick={shareCode} className="p-1.5 hover:bg-white/10 rounded-md transition-all">
                  <Share2 className="w-4 h-4 text-muted" />
                </button>
              )}
            </div>
            {timeLeft > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted">
                <Clock className="w-3 h-3" />
                <span>Code expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participants panel */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="glass-card border-t-0 px-4 py-2 overflow-hidden shrink-0">
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs glass-card px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />{username} <span className="text-muted">(you)</span>
              </span>
              {participantList.map(([pid, uname]) => (
                <span key={pid} className="text-xs glass-card px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full" />{uname}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto glass-card border-t-0 border-b-0 rounded-none px-4 py-3 space-y-1 min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <MessageSquare className="w-10 h-10 text-muted/30" />
            <p className="text-sm text-muted">Room ready! Be the first to say something.</p>
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
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="glass-card border-t-0 rounded-b-2xl px-3 py-3 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Type a message... (Enter)"
            className="glass-input flex-1 text-sm py-2.5 px-3 rounded-xl"
            style={{ fontSize: '16px' }}
          />
          <button
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
type Step = 'creating' | 'join' | 'chatting'

export function ChatRoomView({ initialUsername }: { initialUsername?: string }) {
  const {
    setPeer, setStatus, username, setUsername, setRoomCode, setRoomPasswordHash,
    addMessage, addParticipant, addDataConnection, removeParticipant, removeDataConnection, resetRoom,
  } = useChatRoomStore()

  useEffect(() => {
    if (initialUsername) setUsername(initialUsername)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [step, setStep] = useState<Step>('creating')
  const [timeLeft, setTimeLeft] = useState(CODE_EXPIRY_MS / 1000)
  const [isCreating, setIsCreating] = useState(false)
  const [activeRoomCode, setActiveRoomCode] = useState(() => generateSecureCode())
  const mountedRef = useRef(true)
  const expiryRef = useRef(Date.now() + CODE_EXPIRY_MS)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false; resetRoom() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Countdown timer
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

  const handleLeave = useCallback(() => { resetRoom(); setStep('creating'); setIsCreating(false); setActiveRoomCode(generateSecureCode()) }, [resetRoom])

  const setupConn = useCallback((conn: DataConnection, remotePeerId: string, localUsername: string, localPwdHash: string | null, announcedRef: React.MutableRefObject<Set<string>>) => {
    conn.on('data', (raw) => {
      const data = raw as { type: string; payload?: RoomMessage; username?: string; hash?: string; participants?: [string, string][] }

      if (data.type === 'chat' && data.payload) {
        addMessage({ ...data.payload, isLocal: false })
      } else if (data.type === 'announce' && data.username) {
        // Add remote participant
        addParticipant(remotePeerId, data.username)
        addSystemMsg(`${data.username} joined the room`)
        // Only send our announce back once (if not already announced to this peer)
        if (!announcedRef.current.has(remotePeerId)) {
          announcedRef.current.add(remotePeerId)
          conn.send({ type: 'announce', username: localUsername })
          // Send participants list to the new joiner
          const { participants: p } = useChatRoomStore.getState()
          conn.send({ type: 'participants', participants: Array.from(p.entries()) })
        }
      } else if (data.type === 'participants' && data.participants) {
        const { peer: localPeer } = useChatRoomStore.getState()
        data.participants.forEach(([pid, uname]) => { if (pid !== localPeer?.id) addParticipant(pid, uname) })
      } else if (data.type === 'leave' && data.username) {
        removeParticipant(remotePeerId)
        removeDataConnection(remotePeerId)
        addSystemMsg(`${data.username} left the room`)
      } else if (data.type === 'auth') {
        if (localPwdHash) {
          if (data.hash === localPwdHash) conn.send({ type: 'auth-ok' })
          else { conn.send({ type: 'auth-rejected' }); setTimeout(() => conn.close(), 300) }
        } else {
          conn.send({ type: 'auth-ok' })
        }
      } else if (data.type === 'auth-ok') {
        // Send our announce exactly once
        if (!announcedRef.current.has(remotePeerId)) {
          announcedRef.current.add(remotePeerId)
          conn.send({ type: 'announce', username: localUsername })
        }
      } else if (data.type === 'auth-rejected') {
        toast.error('Wrong password — access denied')
        handleLeave()
      }
    })

    conn.on('close', () => {
      const { participants } = useChatRoomStore.getState()
      const uname = participants.get(remotePeerId)
      removeParticipant(remotePeerId)
      removeDataConnection(remotePeerId)
      if (uname) addSystemMsg(`${uname} left the room`)
    })

    conn.on('error', err => console.error('[ChatRoom]', err))
    addDataConnection(remotePeerId, conn)
  }, [addMessage, addParticipant, removeParticipant, addDataConnection, removeDataConnection, addSystemMsg, handleLeave])

  // Auto-create room when component mounts (or when "creating" step is active)
  const createRoom = useCallback(async (code: string, pwdHash: string | null) => {
    const currentUsername = useChatRoomStore.getState().username || initialUsername || ''
    if (!currentUsername) return

    setIsCreating(true)
    setRoomCode(code)
    setRoomPasswordHash(pwdHash)
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
      // NOTE: We do NOT add host to participants map — they're shown as "(you)" separately
      setStatus('connected')
      setStep('chatting')
      addSystemMsg('Room created! Share the code to invite friends.')
      setIsCreating(false)
    })

    newPeer.on('connection', (conn) => {
      const { dataConnections } = useChatRoomStore.getState()
      if (dataConnections.size >= MAX_PEERS) { conn.close(); return }
      conn.on('open', () => setupConn(conn, conn.peer, currentUsername, pwdHash, announcedRef))
    })

    newPeer.on('error', (err) => {
      if (err.type === 'unavailable-id') toast.error('This code is in use, try another.')
      else toast.error('Connection error')
      setStatus('failed')
      setIsCreating(false)
    })
  }, [initialUsername, setPeer, setStatus, setRoomCode, setRoomPasswordHash, addSystemMsg, setupConn])

  // Auto-start creating the room when component first mounts
  useEffect(() => {
    if (step === 'creating' && !isCreating) {
      createRoom(activeRoomCode, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomCode])

  const handleJoin = useCallback(async (code: string, pwdHash: string | null) => {
    const currentUsername = useChatRoomStore.getState().username || initialUsername || ''
    if (!currentUsername) return

    setRoomCode(code)
    setRoomPasswordHash(pwdHash)
    setStatus('generating')

    const joinerPeerId = codeToCallPeerId(generateSecureCode())
    const peerId = codeToCallPeerId(code)
    const announcedRef = { current: new Set<string>() }

    const peerConfig = {
      host: 'hashdrop.onrender.com', port: 443, path: '/', secure: true, debug: 1,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
    }

    const newPeer = new Peer(joinerPeerId, peerConfig)

    newPeer.on('open', () => {
      if (!mountedRef.current) return
      setPeer(newPeer)

      const conn = newPeer.connect(peerId, { reliable: true })
      conn.on('open', () => {
        setupConn(conn, peerId, currentUsername, null, announcedRef)
        conn.send({ type: 'auth', hash: pwdHash || '' })
        setStatus('connected')
        setStep('chatting')
        addSystemMsg('Connected to the room!')
      })

      conn.on('error', () => {
        toast.error('Could not connect to room. Check the code.')
        setStatus('failed')
        setStep('join')
      })
    })

    newPeer.on('error', () => { toast.error('Connection error'); setStatus('failed'); setStep('join') })
  }, [initialUsername, setPeer, setStatus, setRoomCode, setRoomPasswordHash, addSystemMsg, setupConn])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-16 md:py-20 relative z-10">
      <AnimatePresence mode="wait">
        {/* Creating: loading spinner while auto-creating */}
        {step === 'creating' && (
          <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted">Setting up your room...</p>
          </motion.div>
        )}

        {/* Join: enter existing room code */}
        {step === 'join' && (
          <motion.div key="join" className="w-full">
            <JoinScreen
              username={username || initialUsername || ''}
              onBack={() => setStep('creating')}
              onJoin={handleJoin}
            />
          </motion.div>
        )}

        {/* Live chat */}
        {step === 'chatting' && (
          <motion.div key="chatting" className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LiveChatRoom
              username={username || initialUsername || ''}
              roomCode={activeRoomCode}
              timeLeft={timeLeft}
              onLeave={handleLeave}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Join existing room" link shown when creating/loading */}
      {step === 'creating' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => { resetRoom(); setStep('join') }}
          className="absolute bottom-8 text-xs text-muted hover:text-foreground underline transition-colors"
        >
          Join an existing room instead
        </motion.button>
      )}
    </div>
  )
}
