'use client'

import { Suspense } from 'react'
import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageSquare, Loader2 } from 'lucide-react'
import { MinimalHeader } from '@/components/layout/minimal-header'
import { SignatureBadge } from '@/components/ui/signature-badge'
import { WithUsernameGate } from '@/components/ui/username-gate'
import { IncomingRequestScreen } from '@/components/ui/incoming-request-screen'
import { ChatRoomView } from '@/components/chatroom/chat-room-view'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PageProps {
  params: Promise<{ code: string }>
}

function JoinRoomContent({ code }: { code: string }) {
  const searchParams = useSearchParams()
  const hasPassword = searchParams.get('pwd') === '1'
  const from = searchParams.get('from')
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)

  if (!accepted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative z-10">
        <IncomingRequestScreen
          mode="chatroom"
          from={from}
          code={code}
          hasPassword={hasPassword}
          onAccept={() => setAccepted(true)}
          onDecline={() => router.push('/')}
        />
      </div>
    )
  }

  return (
    <WithUsernameGate
      icon={<MessageSquare className="w-7 h-7 text-primary" />}
      title="Chat"
      highlight="Room"
      description="Instant encrypted messaging rooms. Up to 5 people."
      hint="You will appear in the chat room with this name"
      mode="chatroom"
      skipEntry
      skipToJoin
    >
      {(username) => (
        <ChatRoomView
          initialUsername={username}
          initialAction="join"
          incomingCode={code}
          incomingHasPassword={hasPassword}
        />
      )}
    </WithUsernameGate>
  )
}

function JoinRoomPage({ params }: PageProps) {
  const { code } = use(params)
  const decodedCode = decodeURIComponent(code)

  return (
    <>
      <MinimalHeader />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      }>
        <JoinRoomContent code={decodedCode} />
      </Suspense>
      <footer className="fixed bottom-6 left-6 z-40 hidden md:block">
        <SignatureBadge />
      </footer>
    </>
  )
}

export default function Page({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      <JoinRoomPage params={params} />
    </Suspense>
  )
}
