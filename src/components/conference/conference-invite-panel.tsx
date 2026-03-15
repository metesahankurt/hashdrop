'use client'

import { useState } from 'react'
import { Copy, Check, QrCode, Share2, X, Link2 } from 'lucide-react'
import { useConferenceStore } from '@/store/use-conference-store'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'

interface ConferenceInvitePanelProps {
  onClose: () => void
}

export function ConferenceInvitePanel({ onClose }: ConferenceInvitePanelProps) {
  const { roomName } = useConferenceStore()
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [canShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share)

  const inviteUrl = roomName
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/conference?code=${roomName}`
    : ''

  const copyLink = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success('Invite link copied!', { duration: 3000 })
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = async () => {
    if (!inviteUrl || !navigator.share) return
    try {
      await navigator.share({
        title: 'HashDrop Conference',
        text: `Join my conference with code: ${roomName}`,
        url: inviteUrl,
      })
    } catch { /* ignore */ }
  }

  return (
    <div className="glass-card rounded-2xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Meeting Info</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Room Code */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted font-medium">Meeting Code</p>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <span className="flex-1 font-mono text-lg font-bold text-primary tracking-widest">
              {roomName || '---'}
            </span>
          </div>
        </div>

        {/* Invite Link */}
        <div className="space-y-2">
          <p className="text-xs text-muted font-medium">Invite Link</p>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <p className="text-xs text-primary truncate">{inviteUrl}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl glass-btn text-xs transition-colors"
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5 text-primary" /><span className="text-primary">Copied!</span></>
              ) : (
                <><Copy className="w-3.5 h-3.5" /><span>Copy Link</span></>
              )}
            </button>
            {canShare && (
              <button
                onClick={shareLink}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl glass-btn text-xs transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            )}
          </div>
        </div>

        {/* QR Code toggle */}
        <button
          onClick={() => setShowQr(!showQr)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl glass-btn text-xs text-muted hover:text-foreground transition-colors"
        >
          <QrCode className={`w-4 h-4 ${showQr ? 'text-primary' : ''}`} />
          <span>{showQr ? 'Hide QR Code' : 'Show QR Code'}</span>
        </button>

        {showQr && inviteUrl && (
          <div className="flex justify-center p-4 bg-white rounded-2xl">
            <QRCodeSVG value={inviteUrl} size={180} />
          </div>
        )}

        <p className="text-[11px] text-muted text-center">
          Share this code or link so others can join your meeting.
        </p>
      </div>
    </div>
  )
}
