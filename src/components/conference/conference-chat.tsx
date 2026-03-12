'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocalParticipant } from '@livekit/components-react'
import { Send, X, Paperclip, Loader2 } from 'lucide-react'
import { useConferenceStore } from '@/store/use-conference-store'
import { toast } from 'sonner'
import { clsx } from 'clsx'

export function ConferenceChat({ onClose }: { onClose: () => void }) {
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { localParticipant } = useLocalParticipant()
  const { chatMessages, username, addChatMessage } = useConferenceStore()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const send = async () => {
    const text = draft.trim()
    if (!text || !localParticipant) return
    setDraft('')
    try {
      const data = new TextEncoder().encode(JSON.stringify({ type: 'chat', text }))
      await localParticipant.publishData(data, { reliable: true })
      addChatMessage({
        id: `${Date.now()}-local`,
        from: 'local',
        fromLabel: username || 'You',
        text,
        timestamp: Date.now(),
      })
    } catch { /* ignore */ }
  }

  const sendFile = async (file: File) => {
    if (!localParticipant) return
    const MAX = 5 * 1024 * 1024
    if (file.size > MAX) {
      toast.error('File too large (max 5MB)')
      return
    }
    setIsSending(true)
    const fileId = crypto.randomUUID()
    const CHUNK_BYTES = 9000
    const totalChunks = Math.ceil(file.size / CHUNK_BYTES)

    const enc = (obj: unknown) => new TextEncoder().encode(JSON.stringify(obj))

    try {
      await localParticipant.publishData(
        enc({ type: 'file-start', fileId, filename: file.name, mimeType: file.type || 'application/octet-stream', totalChunks, totalSize: file.size, sender: username || 'You' }),
        { reliable: true }
      )

      for (let i = 0; i < totalChunks; i++) {
        const slice = file.slice(i * CHUNK_BYTES, (i + 1) * CHUNK_BYTES)
        const ab = await slice.arrayBuffer()
        const bytes = new Uint8Array(ab)
        let binary = ''
        for (let j = 0; j < bytes.byteLength; j++) binary += String.fromCharCode(bytes[j])
        const b64 = btoa(binary)
        await localParticipant.publishData(enc({ type: 'file-chunk', fileId, index: i, data: b64 }), { reliable: true })
      }

      await localParticipant.publishData(enc({ type: 'file-end', fileId }), { reliable: true })

      const reader = new FileReader()
      reader.onload = () => {
        addChatMessage({
          id: `file-${fileId}-local`,
          from: 'local',
          fromLabel: username || 'You',
          text: `📎 ${file.name}`,
          timestamp: Date.now(),
          fileUrl: reader.result as string,
          fileName: file.name,
          fileMime: file.type || 'application/octet-stream',
        })
      }
      reader.readAsDataURL(file)
    } catch {
      // silent
    } finally {
      setIsSending(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const fmt = (ts: number) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="glass-card rounded-2xl flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <span className="text-sm font-medium text-foreground">Chat</span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {chatMessages.length === 0 && (
          <p className="text-center text-xs text-muted py-6">No messages yet</p>
        )}
        {chatMessages.map((msg) => (
          <div key={msg.id} className={clsx('flex flex-col gap-0.5', msg.from === 'local' ? 'items-end' : 'items-start')}>
            <span className="text-[10px] text-muted">{msg.fromLabel} · {fmt(msg.timestamp)}</span>
            <div
              className={clsx(
                'max-w-[85%] text-sm px-3 py-2 rounded-xl',
                msg.from === 'local'
                  ? 'bg-primary/20 text-foreground border border-primary/30'
                  : 'bg-white/8 text-foreground border border-white/10'
              )}
            >
              {msg.text}
              {msg.fileUrl && msg.fileMime?.startsWith('image/') && (
                <img
                  src={msg.fileUrl}
                  alt={msg.fileName}
                  className="mt-1 max-w-[200px] max-h-[200px] rounded-lg object-contain cursor-pointer"
                  onClick={() => window.open(msg.fileUrl, '_blank')}
                />
              )}
              {msg.fileUrl && !msg.fileMime?.startsWith('image/') && (
                <a
                  href={msg.fileUrl}
                  download={msg.fileName}
                  className="mt-1 flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Paperclip className="w-3 h-3" />{msg.fileName}
                </a>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-3 border-t border-white/8 flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.zip,.txt"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) sendFile(f)
            e.target.value = ''
          }}
        />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50"
          style={{ fontSize: '16px' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-muted hover:text-foreground hover:bg-white/10 transition-colors disabled:opacity-40"
          title="Attach file"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </button>
        <button
          onClick={send}
          disabled={!draft.trim()}
          className="p-2 rounded-xl bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
