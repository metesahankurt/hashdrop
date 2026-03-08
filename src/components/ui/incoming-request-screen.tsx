'use client'

import { motion } from 'framer-motion'
import { Send, Video, MessageSquare, Check, X, User, ArrowRight, Lock } from 'lucide-react'

interface IncomingRequestScreenProps {
  mode: 'transfer' | 'videocall' | 'chatroom'
  from: string | null
  code: string
  hasPassword?: boolean
  onAccept: () => void
  onDecline: () => void
}

const modeConfig = {
  transfer: {
    icon: Send,
    label: 'File Transfer',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    actionText: 'Receive File',
    description: 'is inviting you to a file transfer.',
  },
  videocall: {
    icon: Video,
    label: 'Video Call',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    actionText: 'Join Call',
    description: 'is inviting you to a video call.',
  },
  chatroom: {
    icon: MessageSquare,
    label: 'Chat Room',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    actionText: 'Join Room',
    description: 'is inviting you to a chat room.',
  },
}

export function IncomingRequestScreen({ mode, from, code, hasPassword, onAccept, onDecline }: IncomingRequestScreenProps) {
  const cfg = modeConfig[mode]
  const Icon = cfg.icon
  const senderName = from || 'Someone'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm mx-auto text-center space-y-6"
      >
        {/* Sender avatar + icon stack */}
        <div className="relative inline-flex">
          {/* Large sender avatar */}
          <div className="w-20 h-20 rounded-full bg-white/5 border border-border flex items-center justify-center">
            <User className="w-9 h-9 text-muted" />
          </div>

          {/* Mode icon badge */}
          <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full ${cfg.bgColor} border ${cfg.borderColor} flex items-center justify-center shadow-lg`}>
            <Icon className={`w-4 h-4 ${cfg.color}`} />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-1">
              <span className="text-primary font-bold">{senderName}</span>
            </h2>
            <p className="text-muted text-sm">{cfg.description}</p>
          </div>

          {/* Mode & Code badges */}
          <div className="flex flex-col items-center gap-3">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${cfg.bgColor} border ${cfg.borderColor}`}>
              <Icon className={`w-4 h-4 ${cfg.color}`} />
              <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
            </div>

            <div className="glass-card rounded-xl px-5 py-3 inline-flex items-center gap-2.5">
              <span className="text-sm text-muted">Code:</span>
              <span className="font-mono text-base md:text-lg text-primary font-bold tracking-wide">{code}</span>
            </div>
          </div>

          {/* Password warning */}
          {hasPassword && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <Lock className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-400">Şifreli oda — katılmak için şifre gerekecek</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 w-full mt-6">
          {/* Decline */}
          <button
            onClick={onDecline}
            className="w-full sm:flex-1 py-3.5 sm:py-3 rounded-xl glass-card text-sm font-medium text-muted hover:text-foreground hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Decline
          </button>

          {/* Accept */}
          <button
            onClick={onAccept}
            className="w-full sm:flex-1 py-3.5 sm:py-3 rounded-xl glass-btn-primary text-sm font-medium transition-all flex items-center justify-center gap-2 group shadow-xl shadow-primary/20"
          >
            <Check className="w-4 h-4" />
            {cfg.actionText}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <p className="text-xs text-muted/60">
          Secure end-to-end encrypted connection
        </p>
      </motion.div>
    </div>
  )
}
