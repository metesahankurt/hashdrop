'use client'

import { motion } from 'framer-motion'
import { Send, Video, MessageSquare, Check, X, User, ArrowRight } from 'lucide-react'

interface IncomingRequestScreenProps {
  mode: 'transfer' | 'videocall' | 'chatroom'
  from: string | null
  code: string
  onAccept: () => void
  onDecline: () => void
}

const modeConfig = {
  transfer: {
    icon: Send,
    label: 'Dosya Transferi',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    actionText: 'Dosyayı Al',
    description: 'sizi bir dosya transferine davet ediyor.',
  },
  videocall: {
    icon: Video,
    label: 'Görüntülü Görüşme',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    actionText: 'Görüşmeye Katıl',
    description: 'sizi görüntülü görüşmeye davet ediyor.',
  },
  chatroom: {
    icon: MessageSquare,
    label: 'Sohbet Odası',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    actionText: 'Odaya Katıl',
    description: 'sizi sohbet odasına davet ediyor.',
  },
}

export function IncomingRequestScreen({ mode, from, code, onAccept, onDecline }: IncomingRequestScreenProps) {
  const cfg = modeConfig[mode]
  const Icon = cfg.icon
  const senderName = from || 'Birisi'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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

          {/* Mode pill */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${cfg.bgColor} border ${cfg.borderColor}`}>
            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
            <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
          </div>

          {/* Code display */}
          <div className="glass-card rounded-xl px-4 py-2.5 inline-flex items-center gap-2">
            <span className="text-xs text-muted">Kod:</span>
            <span className="font-mono text-sm text-primary font-bold tracking-wide">{code}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {/* Decline */}
          <button
            onClick={onDecline}
            className="flex-1 py-3 rounded-xl glass-card text-sm font-medium text-muted hover:text-foreground hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Reddet
          </button>

          {/* Accept */}
          <button
            onClick={onAccept}
            className="flex-1 py-3 rounded-xl glass-btn-primary text-sm font-medium transition-all flex items-center justify-center gap-2 group"
          >
            <Check className="w-4 h-4" />
            {cfg.actionText}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <p className="text-xs text-muted/60">
          Güvenli uçtan uca şifreli bağlantı
        </p>
      </motion.div>
    </div>
  )
}
