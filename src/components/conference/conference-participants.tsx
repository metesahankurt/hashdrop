'use client'

import { useLocalParticipant, useParticipants } from '@livekit/components-react'
import { X, Mic, MicOff, Video, VideoOff, Crown } from 'lucide-react'
import { useConferenceStore } from '@/store/use-conference-store'

function getParticipantInfo(metadata?: string, identity?: string) {
  try {
    const m = JSON.parse(metadata || '{}')
    return { username: m.username || identity || 'Participant', role: m.role || 'participant' }
  } catch {
    return { username: identity || 'Participant', role: 'participant' }
  }
}

export function ConferenceParticipants({ onClose }: { onClose: () => void }) {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const { identity: localIdentity } = useConferenceStore()
  const currentLocalIdentity = localParticipant?.identity ?? localIdentity
  const allParticipants = [
    ...(localParticipant ? [localParticipant] : []),
    ...participants.filter((participant) => participant.identity !== localParticipant?.identity),
  ]

  return (
    <div className="glass-card rounded-2xl flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <span className="text-sm font-medium text-foreground">
          Participants <span className="text-muted text-xs ml-1">({allParticipants.length})</span>
        </span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {allParticipants.map((p) => {
          const { username, role } = getParticipantInfo(p.metadata, p.identity)
          const isLocal = p.identity === currentLocalIdentity
          const micOn = p.isMicrophoneEnabled
          const camOn = p.isCameraEnabled

          return (
            <div
              key={p.identity}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {role === 'host' && <Crown className="w-3 h-3 text-yellow-400 shrink-0" />}
                  <span className="text-sm text-foreground truncate">
                    {username}{isLocal ? ' (You)' : ''}
                  </span>
                </div>
                <span className="text-[10px] text-muted capitalize">{role === 'host' ? 'Host' : 'Participant'}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {micOn ? (
                  <Mic className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <MicOff className="w-3.5 h-3.5 text-red-400" />
                )}
                {camOn ? (
                  <Video className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <VideoOff className="w-3.5 h-3.5 text-muted" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
