'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Plus, LogIn } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModeEntryScreenProps {
  mode: 'transfer' | 'videocall' | 'chatroom' | 'conference'
  icon: ReactNode
  onSelect: (action: 'create' | 'join') => void
}

const modeConfig = {
  transfer: {
    title: 'File Transfer',
    create: { label: 'Send Files', description: 'Generate a code and share files with someone' },
    join: { label: 'Receive Files', description: 'Enter a code to receive files from someone' },
  },
  videocall: {
    title: 'Video Call',
    create: { label: 'Start a Call', description: 'Create a call room and invite others' },
    join: { label: 'Join a Call', description: 'Enter a code to join an existing call' },
  },
  chatroom: {
    title: 'Chat Room',
    create: { label: 'Create Room', description: 'Start a new chat room and invite others' },
    join: { label: 'Join Room', description: 'Enter a code to join an existing room' },
  },
  conference: {
    title: 'Video Conference',
    create: { label: 'Start a Meeting', description: 'Create a new conference room and invite participants' },
    join: { label: 'Join a Meeting', description: 'Enter a code to join an existing conference' },
  },
}

export function ModeEntryScreen({ mode, icon, onSelect }: ModeEntryScreenProps) {
  const config = modeConfig[mode]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto space-y-6 text-center"
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
        {icon}
      </div>

      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
        {config.title}
      </h2>

      {/* Cards */}
      <div className="grid gap-3">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => onSelect('create')}
          className="glass-card p-5 rounded-2xl text-left hover:bg-white/10 transition-all group cursor-pointer border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{config.create.label}</p>
              <p className="text-xs text-muted mt-0.5">{config.create.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onSelect('join')}
          className="glass-card p-5 rounded-2xl text-left hover:bg-white/10 transition-all group cursor-pointer border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
              <LogIn className="w-5 h-5 text-muted group-hover:text-foreground transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{config.join.label}</p>
              <p className="text-xs text-muted mt-0.5">{config.join.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </motion.button>
      </div>
    </motion.div>
  )
}
