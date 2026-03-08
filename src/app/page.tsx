'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WelcomeScreen } from '@/components/welcome/welcome-screen'
import { InfoSection } from '@/components/ui/info-section'
import { SignatureBadge } from '@/components/ui/signature-badge'

function HomeRedirect() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      const mode = searchParams.get('mode')
      const from = searchParams.get('from')
      const fromParam = from ? `&from=${encodeURIComponent(from)}` : ''

      if (mode === 'videocall') {
        router.replace(`/videocall?code=${code}${fromParam}`)
      } else if (mode === 'chatroom') {
        router.replace(`/chatroom?code=${code}${fromParam}`)
      } else {
        router.replace(`/transfer?code=${code}${fromParam}`)
      }
    }
  }, [searchParams, router])
  
  return null
}

function HomeContent() {
  return (
    <>
      <HomeRedirect />
      <WelcomeScreen />
      <InfoSection />
      <footer className="fixed bottom-6 left-6 z-40 hidden md:block">
        <SignatureBadge />
      </footer>
    </>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted">Loading...</div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
