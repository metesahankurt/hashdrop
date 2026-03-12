'use client'

import { Suspense } from 'react'
import { MessageSquare, Loader2 } from 'lucide-react'
import { MinimalHeader } from '@/components/layout/minimal-header'
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
        description="Instant encrypted messaging rooms. Up to 50 people."
        hint="You will appear in the chat room with this name"
        mode="chatroom"
      >
        {(username, action) => (
          <ChatRoomView initialUsername={username} initialAction={action} />
        )}
      </WithUsernameGate>
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
