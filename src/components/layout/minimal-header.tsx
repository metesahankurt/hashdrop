'use client'

import { motion } from 'framer-motion'
import { HamburgerMenu } from './hamburger-menu'
import { useEffect, useState } from 'react'
import { HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { useWarpStore } from '@/store/use-warp-store'
import { useRouter } from 'next/navigation'

interface MinimalHeaderProps {
  onOpenShortcuts?: () => void
}

export function MinimalHeader({ onOpenShortcuts }: MinimalHeaderProps = {}) {
  const [scrollY, setScrollY] = useState(0)
  const { reset, fullReset, peer, conn } = useWarpStore()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()

    // Close connection if active
    if (conn) {
      conn.close()
    }

    // Destroy peer if exists
    if (peer) {
      peer.destroy()
    }

    // Full reset (including peer and myId)
    fullReset()

    // Navigate to home and force reload
    router.push('/')
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  // Scroll miktarına göre blur hesapla
  // 0-200px arası artacak, 200px'de maksimum değere ulaşacak
  const maxScroll = 200
  const scrollProgress = Math.min(scrollY / maxScroll, 1)
  const blurAmount = scrollProgress * 12 // 0'dan 12px'e kadar blur

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-30 px-4 md:px-8 py-5 transition-all duration-300"
      style={{
        backdropFilter: `blur(${blurAmount}px)`,
        WebkitBackdropFilter: `blur(${blurAmount}px)`,
        isolation: 'isolate'
      }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Clean Logo - Text Only (Clickable) */}
        <div className="flex items-center relative z-10">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="text-xl md:text-2xl font-bold text-foreground tracking-tight hover:text-primary transition-colors cursor-pointer"
            style={{
              filter: 'none',
              textShadow: 'none'
            }}
          >
            HashDrop
          </Link>
        </div>

        {/* Right Side - Help Button & Menu */}
        <div className="flex items-center gap-3">
          {/* Keyboard Shortcuts Button */}
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="fixed top-4 right-16 md:right-20 z-[60] p-2.5 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors group"
              aria-label="Keyboard Shortcuts"
              title="Keyboard Shortcuts (CMD/Ctrl + ?)"
            >
              <HelpCircle className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
            </button>
          )}

          {/* Hamburger Menu */}
          <HamburgerMenu />
        </div>
      </div>
    </motion.header>
  )
}
