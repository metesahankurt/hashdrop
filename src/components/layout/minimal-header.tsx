'use client'

import { motion } from 'framer-motion'
import { HamburgerMenu } from './hamburger-menu'
import { useEffect, useState } from 'react'

export function MinimalHeader() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
        {/* Clean Logo - Text Only */}
        <div className="flex items-center relative z-10">
          <span
            className="text-xl md:text-2xl font-bold text-foreground tracking-tight"
            style={{
              filter: 'none',
              textShadow: 'none'
            }}
          >
            HashDrop
          </span>
        </div>

        {/* Menu */}
        <HamburgerMenu />
      </div>
    </motion.header>
  )
}
