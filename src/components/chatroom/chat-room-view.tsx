'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Peer from 'peerjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, ArrowRight, Copy, Check, Clock,
  Send, Users, Lock, Eye, EyeOff, X, ChevronLeft, QrCode, Share2, ScanLine
} from 'lucide-react'
import { useChatRoomStore, type RoomMessage } from '@/store/use-chat-room-store'
import { generateSecureCode, codeToCallPeerId } from '@/lib/code-generator'
import { QRCodeDisplay } from '@/components/transfer/qr-code-display'
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
// STEP 2 — Room code generation + join
// ============================================================
interface RoomSetupProps {
  username: string
  onBack: () => void
  onRoomReady: (code: string, passwordHash: string | null, isHost: boolean) => void
}

function RoomSetup({ username, onBack, onRoomReady }: RoomSetupProps) {
  const [genCode] = useState(() => generateSecureCode())
  const [inputCode, setInputCode] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [enablePassword, setEnablePassword] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showJoinPwd, setShowJoinPwd] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [timeLeft, setTimeLeft] = useState(CODE_EXPIRY_MS / 1000)
  const [canShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share)
  const expiryTime = useRef<number>(0)

  useEffect(() => {
    expiryTime.current = Date.now() + CODE_EXPIRY_MS
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((expiryTime.current - Date.now()) / 1000))
      setTimeLeft(left)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const copyCode = () => {
    navigator.clipboard.writeText(genCode)
    setCopied(true); toast.success('Kod kopyalandı!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareCode = async () => {
    try { await navigator.share({ title: 'HashDrop Sohbet Odası', text: `Sohbet odama katıl: ${genCode}` }) } catch { /* ignore */ }
  }

  const handleCreate = async () => {
    const hash = enablePassword && passwordInput ? await hashPassword(passwordInput) : null
    onRoomReady(genCode, hash, true)
  }

  const handleJoin = async () => {
    if (!inputCode.trim()) return
    const hash = joinPassword ? await hashPassword(joinPassword) : null
    onRoomReady(inputCode.trim(), hash, false)
  }

  const callUrl = `https://hashdrop.metesahankurt.cloud?mode=chatroom&code=${genCode}`

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto space-y-5">
      {/* Back + username */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-all text-muted hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
            {username[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-foreground font-medium">{username}</span>
        </div>
      </div>

      {/* Create Room */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Oda Oluştur</h3>
        <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2.5 glow-primary">
          <span className="font-mono text-lg text-primary font-bold tracking-wide flex-1">{genCode}</span>
          <div className="flex gap-1">
            <button onClick={copyCode} className="p-1.5 hover:bg-white/10 rounded-md transition-all">
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted" />}
            </button>
            {canShare && <button onClick={shareCode} className="p-1.5 hover:bg-white/10 rounded-md transition-all"><Share2 className="w-4 h-4 text-muted" /></button>}
            <button onClick={() => setShowQR(!showQR)} className="p-1.5 hover:bg-white/10 rounded-md transition-all">
              <QrCode className={`w-4 h-4 ${showQR ? 'text-primary' : 'text-muted'}`} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showQR && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden flex justify-center">
              <QRCodeDisplay code={genCode} size={160} url={callUrl} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <Clock className="w-3 h-3" />
          <span>Süre: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        </div>

        {/* Password */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <div onClick={() => setEnablePassword(!enablePassword)}
              className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${enablePassword ? 'bg-primary' : 'bg-white/20'}`}>
              <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow transition-all ${enablePassword ? 'left-5' : 'left-1'}`} />
            </div>
            <span className="text-xs text-muted flex items-center gap-1"><Lock className="w-3 h-3" /> Şifre Koru</span>
          </label>
          <AnimatePresence>
            {enablePassword && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} placeholder="Oda şifresi..." value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)} className="glass-input w-full text-sm pr-9" style={{ fontSize: '16px' }} />
                  <button onClick={() => setShowPwd(!showPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" type="button">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={handleCreate} className="glass-btn-primary w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
          Oda Oluştur <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30" /></div>
        <div className="relative flex justify-center"><span className="px-3 text-xs text-muted bg-background">veya</span></div>
      </div>

      <button onClick={() => setShowJoin(!showJoin)} className="w-full py-2 text-sm text-muted hover:text-foreground transition-all flex items-center justify-center gap-2">
        <span>{showJoin ? 'Gizle' : 'Odaya Katıl'}</span>
        <motion.div animate={{ rotate: showJoin ? 90 : 0 }} transition={{ duration: 0.2 }}><ArrowRight className="w-4 h-4" /></motion.div>
      </button>

      <AnimatePresence>
        {showJoin && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Oda Kodu Gir</h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Cosmic-Falcon" value={inputCode} onChange={e => setInputCode(e.target.value)}
                  className="glass-input flex-1 text-base font-mono text-center" style={{ fontSize: '16px' }} />
                <button onClick={() => setShowQRScanner(true)} className="glass-card px-3 rounded-xl text-muted hover:text-foreground hover:bg-white/10 transition-all">
                  <ScanLine className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <input type={showJoinPwd ? 'text' : 'password'} placeholder="Şifre (varsa)" value={joinPassword}
                  onChange={e => setJoinPassword(e.target.value)} className="glass-input w-full text-sm pr-9" style={{ fontSize: '16px' }} />
                <button onClick={() => setShowJoinPwd(!showJoinPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" type="button">
                  {showJoinPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button onClick={handleJoin} disabled={!inputCode.trim()}
                className="glass-btn-primary w-full py-2.5 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                Katıl <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showQRScanner && (
        <QrScanner onCodeScanned={(code) => { setInputCode(code); setShowQRScanner(false); setShowJoin(true); toast.success('QR okundu!') }}
          onClose={() => setShowQRScanner(false)} />
      )}
    </motion.div>
  )
}

// ============================================================
// STEP 3 — Live Chat Room
// ============================================================
function LiveChatRoom({ username, onLeave }: { username: string; onLeave: () => void }) {
  const { messages, participants, dataConnections, addMessage } = useChatRoomStore()
  const [input, setInput] = useState('')
  const [showParticipants, setShowParticipants] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
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

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)', minHeight: 480 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 glass-card rounded-t-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Sohbet Odası</p>
            <p className="text-xs text-muted">{username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted hover:text-foreground glass-card rounded-lg transition-all">
            <Users className="w-3.5 h-3.5" />
            <span>{1 + participantList.length}</span>
          </button>
          <button onClick={handleLeave} className="p-1.5 hover:bg-danger/20 rounded-lg transition-all text-muted hover:text-danger" title="Ayrıl">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Participants */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="glass-card border-t-0 px-4 py-2 overflow-hidden shrink-0">
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs glass-card px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />{username} <span className="text-muted">(sen)</span>
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
            <p className="text-sm text-muted">Oda hazır! İlk mesajı sen yaz.</p>
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
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Mesajını yaz... (Enter)" className="glass-input flex-1 text-sm py-2.5 px-3 rounded-xl" style={{ fontSize: '16px' }} />
          <button onClick={sendMessage} disabled={!input.trim()}
            className="w-10 h-10 rounded-xl glass-btn-primary flex items-center justify-center disabled:opacity-40 shrink-0">
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
type Step = 'setup' | 'chatting'

export function ChatRoomView({ initialUsername }: { initialUsername?: string }) {
  const {
    setPeer, setStatus, username, setUsername, setRoomCode, setRoomPasswordHash,
    addMessage, addParticipant, addDataConnection, removeParticipant, removeDataConnection, resetRoom,
  } = useChatRoomStore()

  // Use provided username (from gate) or whatever's in the store
  useEffect(() => {
    if (initialUsername && !username) setUsername(initialUsername)
    else if (initialUsername) setUsername(initialUsername)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [step, setStep] = useState<Step>('setup')
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false; resetRoom() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addSystemMsg = useCallback((text: string) => {
    addMessage({ id: crypto.randomUUID(), from: 'system', text, timestamp: Date.now(), isLocal: false, isSystem: true })
  }, [addMessage])

  const handleLeave = useCallback(() => { resetRoom(); setStep('setup') }, [resetRoom])

  const setupConn = useCallback((conn: DataConnection, remotePeerId: string, localUsername: string, localPwdHash: string | null) => {
    conn.on('data', (raw) => {
      const data = raw as { type: string; payload?: RoomMessage; username?: string; hash?: string; participants?: [string, string][] }

      if (data.type === 'chat' && data.payload) {
        addMessage({ ...data.payload, isLocal: false })
      } else if (data.type === 'announce' && data.username) {
        addParticipant(remotePeerId, data.username)
        addSystemMsg(`${data.username} odaya katıldı`)
        conn.send({ type: 'announce', username: localUsername })
        const { participants: p } = useChatRoomStore.getState()
        conn.send({ type: 'participants', participants: Array.from(p.entries()) })
      } else if (data.type === 'participants' && data.participants) {
        const { peer: localPeer } = useChatRoomStore.getState()
        data.participants.forEach(([pid, uname]) => { if (pid !== localPeer?.id) addParticipant(pid, uname) })
      } else if (data.type === 'leave' && data.username) {
        removeParticipant(remotePeerId)
        removeDataConnection(remotePeerId)
        addSystemMsg(`${data.username} odadan ayrıldı`)
      } else if (data.type === 'auth') {
        if (localPwdHash) {
          if (data.hash === localPwdHash) conn.send({ type: 'auth-ok' })
          else { conn.send({ type: 'auth-rejected' }); setTimeout(() => conn.close(), 300) }
        } else {
          conn.send({ type: 'auth-ok' })
        }
      } else if (data.type === 'auth-ok') {
        conn.send({ type: 'announce', username: localUsername })
      } else if (data.type === 'auth-rejected') {
        toast.error('Yanlış şifre — odaya erişim reddedildi')
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

  const handleRoomReady = useCallback(async (code: string, pwdHash: string | null, isHost: boolean) => {
    setRoomCode(code)
    setRoomPasswordHash(pwdHash)
    setStatus('generating')

    const peerId = codeToCallPeerId(code)

    const peerConfig = {
      host: 'hashdrop.onrender.com', port: 443, path: '/', secure: true, debug: 1,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
    }

    if (isHost) {
      const newPeer = new Peer(peerId, peerConfig)

      newPeer.on('open', () => {
        if (!mountedRef.current) return
        setPeer(newPeer)
        addParticipant(newPeer.id, username)
        setStatus('connected')
        setStep('chatting')
        addSystemMsg('Oda oluşturuldu! Kodu paylaşarak arkadaşlarını davet et.')
      })

      newPeer.on('connection', (conn) => {
        const { dataConnections } = useChatRoomStore.getState()
        if (dataConnections.size >= MAX_PEERS) { conn.close(); return }
        conn.on('open', () => setupConn(conn, conn.peer, username, pwdHash))
      })

      newPeer.on('error', (err) => {
        if (err.type === 'unavailable-id') toast.error('Bu kod kullanımda, başkasını dene.')
        else toast.error('Bağlantı hatası')
        setStatus('failed')
      })
    } else {
      const joinerPeerId = codeToCallPeerId(generateSecureCode())
      const newPeer = new Peer(joinerPeerId, peerConfig)

      newPeer.on('open', () => {
        if (!mountedRef.current) return
        setPeer(newPeer)

        const conn = newPeer.connect(peerId, { reliable: true })
        conn.on('open', () => {
          setupConn(conn, peerId, username, null)
          // Send auth (empty hash if no password required)
          conn.send({ type: 'auth', hash: pwdHash || '' })
          setStatus('connected')
          setStep('chatting')
          addSystemMsg('Odaya bağlandı!')
        })

        conn.on('error', () => {
          toast.error('Odaya bağlanılamadı. Kodu kontrol et.')
          setStatus('failed')
        })
      })

      newPeer.on('error', () => { toast.error('Bağlantı hatası'); setStatus('failed') })
    }
  }, [username, setPeer, setStatus, setRoomCode, setRoomPasswordHash, addParticipant, addSystemMsg, setupConn])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-16 md:py-20 relative z-10">
      <AnimatePresence mode="wait">
        {step === 'setup' && (
          <motion.div key="setup" className="w-full">
            <RoomSetup username={username} onBack={() => setStep('setup')} onRoomReady={handleRoomReady} />
          </motion.div>
        )}
        {step === 'chatting' && (
          <motion.div key="chatting" className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LiveChatRoom username={username} onLeave={handleLeave} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
