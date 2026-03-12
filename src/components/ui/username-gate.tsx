'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, User, RefreshCw } from 'lucide-react'
import { useUsernameStore } from '@/store/use-username-store'
import { ModeEntryScreen } from './mode-entry-screen'
import type { ReactNode } from 'react'

interface UsernameGateProps {
  /** Icon to show in the step header */
  icon: ReactNode
  /** Feature name, e.g. "Dosya Transferi" */
  title: string
  /** Colored part of the title */
  highlight: string
  /** Description under the title */
  description: string
  /** Hint text shown under the input */
  hint?: string
  /** Called when username is confirmed */
  onConfirm: (username: string) => void
}

export function UsernameGate({ icon, title, highlight, description, hint, onConfirm }: UsernameGateProps) {
  const { username: savedUsername, setUsername } = useUsernameStore()
  const [name, setName] = useState(savedUsername)

  const handleConfirm = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setUsername(trimmed)
    onConfirm(trimmed)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-md mx-auto space-y-6 text-center"
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
        {icon}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          {title}{' '}
          <span className="text-primary font-bold">{highlight}</span>
        </h2>
        <p className="text-muted text-sm leading-relaxed max-w-xs mx-auto">{description}</p>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Your username..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            className="glass-input w-full text-base"
            style={{ fontSize: '16px', paddingLeft: '2.5rem' }}
            maxLength={24}
            autoFocus
          />
          {name && (
            <button
              onClick={() => setName('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              type="button"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {hint && <p className="text-xs text-muted">{hint}</p>}

        <button
          onClick={handleConfirm}
          disabled={!name.trim()}
          className="glass-btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>

        {savedUsername && savedUsername !== name && (
          <button
            onClick={() => { setName(savedUsername); onConfirm(savedUsername) }}
            className="text-xs text-muted hover:text-foreground underline transition-colors"
          >
            Continue as &quot;{savedUsername}&quot;
          </button>
        )}
      </div>
    </motion.div>
  )
}

// HOC wrapper that shows UsernameGate → ModeEntryScreen → children
interface WithUsernameGateProps {
  icon: ReactNode
  title: string
  highlight: string
  description: string
  hint?: string
  /** Which mode this gate is for (enables entry screen) */
  mode?: 'transfer' | 'chatroom' | 'conference'
  /** Skip entry screen (e.g. when opened from incoming link) */
  skipEntry?: boolean
  /** When true, pre-select 'join' action (link invite flow) */
  skipToJoin?: boolean
  children: (username: string, action?: 'create' | 'join') => ReactNode
}

export function WithUsernameGate({ icon, title, highlight, description, hint, mode, skipEntry, skipToJoin, children }: WithUsernameGateProps) {
  const { username: savedUsername } = useUsernameStore()
  const [confirmedUsername, setConfirmedUsername] = useState<string | null>(
    savedUsername || null
  )
  const [selectedAction, setSelectedAction] = useState<'create' | 'join' | null>(
    skipToJoin ? 'join' : skipEntry ? 'create' : null
  )

  const showEntryScreen = mode && confirmedUsername && !selectedAction

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!confirmedUsername ? (
        <motion.div key="gate" className="min-h-screen flex items-center justify-center px-4 py-16 relative z-10">
          <UsernameGate
            icon={icon}
            title={title}
            highlight={highlight}
            description={description}
            hint={hint}
            onConfirm={setConfirmedUsername}
          />
        </motion.div>
      ) : showEntryScreen ? (
        <motion.div key="entry" className="min-h-screen flex items-center justify-center px-4 py-16 relative z-10">
          <ModeEntryScreen
            mode={mode}
            icon={icon}
            onSelect={setSelectedAction}
          />
        </motion.div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          {children(confirmedUsername, selectedAction || undefined)}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
