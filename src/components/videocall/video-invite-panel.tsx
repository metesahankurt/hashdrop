'use client'

import { useState } from 'react'
import { Copy, Check, QrCode, Share2, X, Link2 } from 'lucide-react'
import { useVideoStore } from '@/store/use-video-store'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'

interface VideoInvitePanelProps {
  onClose: () => void
}

export function VideoInvitePanel({ onClose }: VideoInvitePanelProps) {
  const { callInviteUrl } = useVideoStore()
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [canShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share)

  // Extract just the code from the URL for display
  const code = callInviteUrl
    ? new URLSearchParams(callInviteUrl.split('?')[1] || '').get('code')
    : null

  const copyLink = () => {
    if (!callInviteUrl) return
    navigator.clipboard.writeText(callInviteUrl)
    setCopied(true)
    toast.success('Invite link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = async () => {
    if (!callInviteUrl || !navigator.share) return
    try {
      await navigator.share({
        title: 'HashDrop Video Call',
        text: `Join my video call with code: ${code}`,
        url: callInviteUrl,
      })
    } catch { /* ignore */ }
  }

  return (
    <div className="w-80 h-full flex flex-col glass-card rounded-2xl overflow-hidden">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Call Code */}
        {code && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted font-medium">Call Code</p>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <span className="flex-1 font-mono text-lg font-bold text-primary tracking-widest">
                {code}
              </span>
            </div>
          </div>
        )}

        {/* Invite Link */}
        <div className="space-y-2">
          <p className="text-xs text-muted font-medium">Invite Link</p>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <p className="text-xs text-primary truncate">{callInviteUrl || 'Generating...'}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              disabled={!callInviteUrl}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl glass-btn text-xs transition-colors disabled:opacity-40"
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
                disabled={!callInviteUrl}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl glass-btn text-xs transition-colors disabled:opacity-40"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            )}
          </div>
        </div>

        {/* QR Code toggle */}
        {callInviteUrl && (
          <>
            <button
              onClick={() => setShowQr(!showQr)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl glass-btn text-xs text-muted hover:text-foreground transition-colors"
            >
              <QrCode className={`w-4 h-4 ${showQr ? 'text-primary' : ''}`} />
              <span>{showQr ? 'Hide QR Code' : 'Show QR Code'}</span>
            </button>

            {showQr && (
              <div className="flex justify-center p-4 bg-white rounded-2xl">
                <QRCodeSVG value={callInviteUrl} size={180} />
              </div>
            )}
          </>
        )}

        <p className="text-[11px] text-muted text-center">
          Share this link so others can join your call.
        </p>
      </div>
    </div>
  )
}
