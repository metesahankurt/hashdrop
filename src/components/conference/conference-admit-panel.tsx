'use client'

import { useState } from 'react'
import { UserCheck, UserX, Clock, Users } from 'lucide-react'
import { useConferenceStore } from '@/store/use-conference-store'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'

export function ConferenceAdmitPanel() {
  const { waitingParticipants, roomName, removeWaitingParticipant } = useConferenceStore()
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  if (waitingParticipants.length === 0) return null

  const admit = async (identity: string, username: string) => {
    setLoading((p) => ({ ...p, [identity]: true }))
    try {
      const res = await fetch('/api/conference/admit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, participantIdentity: identity, username }),
      })
      if (!res.ok) throw new Error()
      removeWaitingParticipant(identity)
      toast.success(`${username} was admitted to the meeting`)
    } catch {
      toast.error('Failed to admit participant')
      setLoading((p) => ({ ...p, [identity]: false }))
    }
  }

  const deny = async (identity: string, username: string) => {
    setLoading((p) => ({ ...p, [identity]: true }))
    try {
      const res = await fetch('/api/conference/deny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, participantIdentity: identity }),
      })
      if (!res.ok) throw new Error()
      removeWaitingParticipant(identity)
      toast(`${username} was denied`)
    } catch {
      toast.error('Operation failed')
      setLoading((p) => ({ ...p, [identity]: false }))
    }
  }

  const admitAll = async () => {
    for (const p of waitingParticipants) {
      await admit(p.identity, p.username)
    }
  }

  return (
    <div className="glass-card rounded-2xl border border-yellow-400/20 bg-yellow-400/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-yellow-400/15">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-yellow-400">
            Waiting Room ({waitingParticipants.length})
          </span>
        </div>
        {waitingParticipants.length > 1 && (
          <button
            onClick={admitAll}
            className="text-xs px-3 py-1 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors"
          >
            Admit All
          </button>
        )}
      </div>

      <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
        <AnimatePresence>
          {waitingParticipants.map((p) => (
            <motion.div
              key={p.identity}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-yellow-400">
                  {p.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{p.username}</p>
                <p className="text-[10px] text-muted">Wants to join</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => admit(p.identity, p.username)}
                  disabled={loading[p.identity]}
                  className="p-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                  title="Admit"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deny(p.identity, p.username)}
                  disabled={loading[p.identity]}
                  className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  title="Deny"
                >
                  <UserX className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
