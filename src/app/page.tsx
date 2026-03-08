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
      router.replace(`/transfer?code=${code}`)
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
