'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { MinimalHeader } from '@/components/layout/minimal-header'
import { WithUsernameGate } from '@/components/ui/username-gate'
import { ConferenceView } from '@/components/conference/conference-view'
import { Video } from 'lucide-react'

function ConferenceContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const mode = searchParams.get('mode')
  const isMobileEmbed = searchParams.get('mobile') === '1'
  const autoEnter = searchParams.get('autoEnter') === '1'

  return (
    <>
      {!isMobileEmbed && <MinimalHeader />}
      <WithUsernameGate
        icon={<Video className="w-7 h-7 text-primary" />}
        title="Video"
        highlight="Conference"
        description="Secure video conferencing for up to 50 participants. Waiting room and presentation mode supported."
        hint="Your username will be shown to other participants"
        mode="conference"
        skipEntry={!!code || mode === 'create'}
        skipToJoin={mode === 'join' && !!code}
      >
        {() => (
          <ConferenceView
            initialCode={code}
            initialMode={mode === 'create' ? 'create' : mode === 'join' ? 'join' : undefined}
            isMobileEmbed={isMobileEmbed}
            autoEnter={autoEnter}
          />
        )}
      </WithUsernameGate>
    </>
  )
}

export default function ConferencePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted">Loading...</div>
        </div>
      }
    >
      <ConferenceContent />
    </Suspense>
  )
}
