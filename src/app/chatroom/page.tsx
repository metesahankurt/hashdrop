'use client'

import { Suspense } from 'react'
import { MessageSquare, Loader2 } from 'lucide-react'
import { MinimalHeader } from '@/components/layout/minimal-header'
import { SignatureBadge } from '@/components/ui/signature-badge'
import { WithUsernameGate } from '@/components/ui/username-gate'
import { ChatRoomView } from '@/components/chatroom/chat-room-view'

function ChatRoomPage() {
  return (
    <>
      <MinimalHeader />
      <WithUsernameGate
        icon={<MessageSquare className="w-7 h-7 text-primary" />}
        title="Chat"
        highlight="Room"
        description="Instant encrypted messaging rooms. Up to 5 people."
        hint="You will appear in the chat room with this name"
        mode="chatroom"
      >
        {(username, action) => (
          <ChatRoomView initialUsername={username} initialAction={action} />
        )}
      </WithUsernameGate>
      <footer className="fixed bottom-6 left-6 z-40 hidden md:block">
        <SignatureBadge />
      </footer>
    </>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      <ChatRoomPage />
    </Suspense>
  )
}
