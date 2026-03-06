'use client'

import { motion } from 'framer-motion'
import { HamburgerMenu } from './hamburger-menu'
import { useEffect, useState } from 'react'
import { Send, Video, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useWarpStore } from '@/store/use-warp-store'
import { useVideoStore } from '@/store/use-video-store'
import { useChatRoomStore } from '@/store/use-chat-room-store'
import { useAppStore, type AppMode } from '@/store/use-app-store'

export function MinimalHeader() {
  const [scrollY, setScrollY] = useState(0)
  const { fullReset, peer, conn } = useWarpStore()
  const resetCall = useVideoStore((s) => s.resetCall)
  const { appMode, setAppMode } = useAppStore()

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()

    // Close file transfer connection if active
    if (conn) conn.close()
    if (peer) peer.destroy()
    fullReset()

    // Reset video call if active
    resetCall()
    // Reset chat room if active
    useChatRoomStore.getState().resetRoom()

    // Go back to welcome
    setAppMode('welcome')
  }

  const handleModeSwitch = (mode: AppMode) => {
    if (mode === appMode) return

    // Clean up current mode before switching
    if (appMode === 'videocall') {
      resetCall()
    }
    if (appMode === 'transfer') {
      if (conn) conn.close()
      if (peer) peer.destroy()
      fullReset()
    }
    if (appMode === 'chatroom') {
      useChatRoomStore.getState().resetRoom()
    }

    setAppMode(mode)
  }

  const maxScroll = 200
  const scrollProgress = Math.min(scrollY / maxScroll, 1)
  const blurAmount = scrollProgress * 12

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
      <div className="relative flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo - Left */}
        <div className="flex items-center relative z-10">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="text-xl md:text-2xl font-bold text-foreground tracking-tight hover:text-primary transition-colors cursor-pointer"
            style={{ filter: 'none', textShadow: 'none' }}
          >
            HashDrop
          </Link>
        </div>

        {/* Center Navigation Tabs - Absolute centered */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 sm:gap-1 glass-card rounded-lg px-1 py-1 z-10 w-max max-w-[50vw] sm:max-w-none justify-center">
          <button
            onClick={() => handleModeSwitch('transfer')}
            className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all ${
              appMode === 'transfer'
                ? 'bg-primary/15 text-primary'
                : 'text-muted hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Send className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">File Transfer</span>
          </button>
          <button
            onClick={() => handleModeSwitch('videocall')}
            className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all ${
              appMode === 'videocall'
                ? 'bg-primary/15 text-primary'
                : 'text-muted hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Video className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">Video Call</span>
          </button>
          <button
            onClick={() => handleModeSwitch('chatroom')}
            className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all ${
              appMode === 'chatroom'
                ? 'bg-primary/15 text-primary'
                : 'text-muted hover:text-foreground hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">Chat Room</span>
          </button>
        </nav>

        {/* Right Side - Menu */}
        <div className="flex items-center gap-3 relative z-10">
          <HamburgerMenu />
        </div>
      </div>
    </motion.header>
  )
}
