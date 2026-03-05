'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageSquare } from 'lucide-react'
import { useVideoStore, type ChatMessage } from '@/store/use-video-store'

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Auto-detect URLs and render as clickable links
function MessageText({ text }: { text: string }) {
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
        )
      )}
    </span>
  )
}

interface VideoChatProps {
  onClose: () => void
}

export function VideoChat({ onClose }: VideoChatProps) {
  const { chatMessages, dataConnections, addChatMessage, resetUnread } = useVideoStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    resetUnread()
  }, [resetUnread])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const sendMessage = useCallback(() => {
    const text = input.trim()
    if (!text) return

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      from: 'local',
      fromLabel: 'You',
      text,
      timestamp: Date.now(),
    }

    addChatMessage(msg)

    // Broadcast to all data connections
    dataConnections.forEach((conn) => {
      try {
        conn.send({ type: 'chat', payload: msg })
      } catch (err) {
        console.error('[Chat] Send error:', err)
      }
    })

    setInput('')
  }, [input, dataConnections, addChatMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full glass-card rounded-2xl overflow-hidden"
      style={{ minHeight: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Chat</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
        >
          <X className="w-4 h-4 text-muted" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ minHeight: 0 }}>
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <MessageSquare className="w-8 h-8 text-muted/40" />
            <p className="text-xs text-muted">No messages yet. Start the conversation!</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {chatMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex flex-col ${msg.from === 'local' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  msg.from === 'local'
                    ? 'bg-primary/20 border border-primary/30 text-foreground rounded-br-sm'
                    : 'glass-card text-foreground rounded-bl-sm'
                }`}
              >
                {msg.from === 'remote' && (
                  <p className="text-xs text-primary font-medium mb-0.5">{msg.fromLabel}</p>
                )}
                <MessageText text={msg.text} />
              </div>
              <span className="text-[10px] text-muted mt-0.5 px-1">
                {formatTime(msg.timestamp)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t border-border">
        {dataConnections.size === 0 && (
          <p className="text-xs text-muted text-center mb-2">
            No peers connected — messages cannot be sent
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            className="glass-input flex-1 text-sm py-2 px-3 rounded-xl"
            style={{ fontSize: '16px' }} // prevent iOS zoom
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || dataConnections.size === 0}
            className="w-10 h-10 shrink-0 glass-icon-btn disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
