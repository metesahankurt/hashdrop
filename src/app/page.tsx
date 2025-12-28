"use client"

import { Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MinimalHeader } from '@/components/layout/minimal-header'
import { SignatureBadge } from '@/components/ui/signature-badge'
import { WarpDropzone } from '@/components/transfer/warp-dropzone'
import { ConnectionManager } from '@/components/transfer/connection-manager'
import { TransferStatus } from '@/components/transfer/transfer-status'
import { TextShare } from '@/components/transfer/text-share'
import { InfoSection } from '@/components/ui/info-section'
import { useWarpStore } from '@/store/use-warp-store'
import { heroVariants } from '@/lib/animations'

export default function Home() {
  const { status, file } = useWarpStore()

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-16 md:py-20 relative z-10">
        {/* Fixed Minimal Header */}
        <MinimalHeader />

        {/* Centered Main Content */}
        <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center gap-12 md:gap-16">

          {/* Hero Section - Clean & Minimal */}
          <AnimatePresence mode="wait">
            {status === 'idle' && !file && (
              <motion.div
                key="hero"
                variants={heroVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="text-center space-y-4 md:space-y-5"
              >
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1]">
                  Share files at{' '}
                  <span className="text-primary font-bold">lightspeed</span>
                </h1>
                <p className="text-lg md:text-xl text-muted max-w-lg mx-auto leading-relaxed">
                  Secure peer-to-peer transfer. No cloud. No limits.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Components - Clean Spacing */}
          <div className="w-full space-y-4">
            <WarpDropzone />
            <TextShare />
            <Suspense fallback={<div className="text-center text-muted text-sm py-4">Loading...</div>}>
              <ConnectionManager />
            </Suspense>
            <TransferStatus />
          </div>
        </div>
      </div>

      {/* Informational Section */}
      <InfoSection />

      {/* Fixed Footer - Bottom Left */}
      <footer className="fixed bottom-6 left-6 z-40">
        <SignatureBadge />
      </footer>
    </>
  )
}
