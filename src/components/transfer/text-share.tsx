"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Type, Send, X, Copy, Check, Edit2, CheckCircle2 } from 'lucide-react'
import { useWarpStore } from '@/store/use-warp-store'
import { toast } from 'sonner'

export function TextShare() {
  const { setTextContent, setMode, textContent, mode, status, conn, isPeerReady, files } = useWarpStore()
  const [text, setText] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isTextSent, setIsTextSent] = useState(false)

  // Mark text as sent when transfer starts (for text sent with files)
  useEffect(() => {
    if (mode === 'send' && status === 'transferring' && textContent && files.length > 0) {
      setIsTextSent(true)
    }
  }, [mode, status, textContent, files.length])

  const handleShareText = () => {
    if (text.trim()) {
      setTextContent(text)
      setIsTextSent(false) // Reset sent status when updating text
      // If files are already selected, keep mode as 'send' (don't override)
      // Otherwise, set mode to 'text'
      if (files.length === 0) {
        setMode('text')
      }
      toast.success(files.length > 0 ? 'Text will be sent with files!' : 'Text ready to share!')
    }
  }

  const handleSendText = () => {
    if (!textContent || !conn) return

    conn.send({
      type: 'text-message',
      content: textContent,
      timestamp: Date.now(),
      hasFile: false  // Text only, no file coming
    })

    setIsTextSent(true) // Mark as sent
    toast.success('Text sent!')
  }

  const handleEditText = () => {
    setText(textContent || '')
    setIsTextSent(false)
    toast.info('Edit your message')
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
    setIsTextSent(false)
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
            <h3 className="text-sm font-semibold">
              {files.length > 0 ? 'Message with File' : 'Received Text'}
            </h3>
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
            {isTextSent ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <Type className="w-4 h-4 text-primary" />
            )}
            <h3 className="text-sm font-semibold">
              {isTextSent
                ? 'Message Sent'
                : isReady
                ? 'Ready to Send'
                : 'Waiting for Connection'}
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
          <div className="flex gap-2">
            {isTextSent ? (
              <button
                onClick={handleEditText}
                className="glass-card flex-1 py-2.5 text-sm flex items-center justify-center gap-2 border border-border hover:border-primary/30 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Message
              </button>
            ) : (
              <button
                onClick={handleSendText}
                className="glass-btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Text Now
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-2 text-sm text-muted">
            Share your code with someone to connect...
          </div>
        )}
      </motion.div>
    )
  }

  // Show text input form (when idle, preparing, or when files are selected)
  if (status === 'idle' || (mode === 'text' && status !== 'connected') || (mode === 'send' && status === 'ready')) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 rounded-xl"
      >
        <div className="flex items-center gap-2 mb-3">
          <Type className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">
            {files.length > 0 ? 'Add Message (Optional)' : 'Share Text or Link'}
          </h3>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={files.length > 0 ? "Add a message to send with your files..." : "Paste text, link, or message..."}
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
            {files.length > 0 ? 'Add Message' : 'Prepare'}
          </button>
        </div>
      </motion.div>
    )
  }

  return null
}
