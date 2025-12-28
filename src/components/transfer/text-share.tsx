"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Type, Send, X, Copy, Check } from 'lucide-react'
import { useWarpStore } from '@/store/use-warp-store'
import { toast } from 'sonner'

export function TextShare() {
  const { setTextContent, setMode, textContent, mode, status, conn, isPeerReady } = useWarpStore()
  const [text, setText] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  const handleShareText = () => {
    if (text.trim()) {
      setTextContent(text)
      setMode('text')
      toast.success('Text ready to share!')
    }
  }

  const handleSendText = () => {
    if (!textContent || !conn) return

    conn.send({
      type: 'text-message',
      content: textContent,
      timestamp: Date.now()
    })

    toast.success('Text sent!')
  }

  const handleCopyText = () => {
    if (!textContent) return

    navigator.clipboard.writeText(textContent)
    setIsCopied(true)
    toast.success('Text copied!')
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleClear = () => {
    setText('')
    setTextContent(null)
    setMode(null)
  }

  // Show received text
  if (mode === 'receive' && textContent && status === 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 rounded-xl"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Received Text</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyText}
              className="p-1.5 hover:bg-white/10 rounded-md transition-all"
              title="Copy text"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4 text-muted hover:text-foreground" />
              )}
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 hover:bg-white/10 rounded-md transition-all"
            >
              <X className="w-4 h-4 text-muted hover:text-foreground" />
            </button>
          </div>
        </div>

        <div className="glass-input w-full px-3 py-2 text-sm whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
          {textContent}
        </div>

        <p className="text-xs text-muted mt-2">
          {textContent.length} characters
        </p>
      </motion.div>
    )
  }

  // Show send button or waiting state
  if (mode === 'text' && textContent) {
    const isReady = status === 'connected' && isPeerReady

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 rounded-xl"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">
              {isReady ? 'Ready to Send' : 'Waiting for Connection'}
            </h3>
          </div>
          <button
            onClick={handleClear}
            className="p-1.5 hover:bg-white/10 rounded-md transition-all"
          >
            <X className="w-4 h-4 text-muted hover:text-foreground" />
          </button>
        </div>

        <div className="glass-input w-full px-3 py-2 text-sm whitespace-pre-wrap break-words max-h-32 overflow-y-auto mb-3">
          {textContent}
        </div>

        {isReady ? (
          <button
            onClick={handleSendText}
            className="glass-btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Text Now
          </button>
        ) : (
          <div className="text-center py-2 text-sm text-muted">
            Share your code with someone to connect...
          </div>
        )}
      </motion.div>
    )
  }

  // Show text input form (when idle or preparing)
  if (status === 'idle' || (mode === 'text' && status !== 'connected')) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 rounded-xl"
      >
        <div className="flex items-center gap-2 mb-3">
          <Type className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Share Text or Link</h3>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text, link, or message..."
          className="glass-input w-full px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
          rows={4}
          maxLength={10000}
        />

        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-muted">
            {text.length} / 10,000 characters
          </span>
          <button
            onClick={handleShareText}
            disabled={!text.trim()}
            className="glass-btn-primary px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Send className="w-3 h-3" />
            Prepare
          </button>
        </div>
      </motion.div>
    )
  }

  return null
}
