'use client'

import { motion } from 'framer-motion'
import { HamburgerMenu } from './hamburger-menu'
import { useEffect, useState } from 'react'

export function MinimalHeader() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-5 transition-all duration-300 ${
        isScrolled
          ? 'bg-black/90 backdrop-blur-md border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Clean Logo - Text Only */}
        <div className="flex items-center">
          <span className="text-xl md:text-2xl font-bold text-foreground tracking-tight">HashDrop</span>
        </div>

        {/* Menu */}
        <HamburgerMenu />
      </div>
    </motion.header>
  )
}
