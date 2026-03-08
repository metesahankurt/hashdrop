'use client'

import { Suspense, useState, useEffect } from 'react'
import { UnifiedTransferFlow } from '@/components/transfer/unified-transfer-flow'
import { TransferStatus } from '@/components/transfer/transfer-status'
import { ConnectionManager } from '@/components/transfer/connection-manager'
import { TransferHistory } from '@/components/ui/transfer-history'
import { KeyboardShortcutsModal } from '@/components/ui/keyboard-shortcuts-modal'
import { StatisticsDashboard } from '@/components/ui/statistics-dashboard'
import { ConsoleDisplay } from '@/components/ui/console-display'
import { useWarpStore } from '@/store/use-warp-store'
import { useSearchParams } from 'next/navigation'

export function TransferViewNew({ initialAction }: { initialAction?: 'create' | 'join' }) {
  const searchParams = useSearchParams()
  const transferCode = searchParams.get('code')
  const { addLog, mode } = useWarpStore()
  const [showHistory, setShowHistory] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showStats, setShowStats] = useState(false)

  // Update OG meta tags dynamically when transfer code is present
  useEffect(() => {
    if (transferCode) {
      const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement
      if (ogImage) ogImage.content = `/api/og?code=${transferCode}`

      const twitterImage = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement
      if (twitterImage) twitterImage.content = `/api/og?code=${transferCode}`

      const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement
      if (ogTitle) ogTitle.content = `Join Transfer: ${transferCode} | HashDrop`

      const twitterTitle = document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement
      if (twitterTitle) twitterTitle.content = `Join Transfer: ${transferCode} | HashDrop`

      const ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement
      if (ogDesc) ogDesc.content = `Click to join this secure P2P file transfer. Code: ${transferCode}`

      const twitterDesc = document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement
      if (twitterDesc) twitterDesc.content = `Click to join this secure P2P file transfer. Code: ${transferCode}`
    }
  }, [transferCode])

  // Add initial log message on mount
  useEffect(() => {
    addLog('HashDrop initialized - Ready to transfer files', 'success')
  }, [addLog])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowHistory((prev) => !prev)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        setShowStats((prev) => !prev)
      }
      if ((e.metaKey || e.ctrlKey || e.shiftKey) && e.key === '?') {
        e.preventDefault()
        setShowShortcuts((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setShowHistory(false)
        setShowShortcuts(false)
        setShowStats(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-16 md:py-20 relative z-10">
        {/* Centered Main Content */}
        <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center gap-8 md:gap-12">
          {/* Console Display - Show when active */}
          {mode && <ConsoleDisplay />}

          {/* Main Transfer Flow */}
          <Suspense
            fallback={
              <div className="text-center text-muted text-sm py-4">
                Loading...
              </div>
            }
          >
            <UnifiedTransferFlow
              initialAction={initialAction}
              onFilesSelected={(files) => {
                addLog(`Files selected: ${files.map(f => f.name).join(', ')}`, 'info')
              }}
              onModeChange={(mode) => {
                addLog(`Mode changed to: ${mode}`, 'info')
              }}
            />
            <ConnectionManager headless={true} initialAction={initialAction} />
          </Suspense>

          {/* Transfer Status - Show when transferring */}
          <TransferStatus />
        </div>
      </div>

      {/* Transfer History Modal */}
      <TransferHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      {/* Statistics Dashboard Modal */}
      <StatisticsDashboard
        isOpen={showStats}
        onClose={() => setShowStats(false)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </>
  )
}
