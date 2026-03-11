'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { HamburgerMenu } from './hamburger-menu'
import { Send, Video, MessageSquare, Users } from 'lucide-react'
import Link from 'next/link'
import { useWarpStore } from '@/store/use-warp-store'
import { useVideoStore } from '@/store/use-video-store'
import { useChatRoomStore } from '@/store/use-chat-room-store'
import { useConferenceStore } from '@/store/use-conference-store'

export function MinimalHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { fullReset, peer, conn } = useWarpStore()
  const resetCall = useVideoStore((s) => s.resetCall)
  const conferenceStatus = useConferenceStore((s) => s.status)
  const router = useRouter()
  const pathname = usePathname()

  // ALL hooks must be called before any conditional return
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Hide navbar when conference is connecting or active (fullscreen UI)
  const isConferenceFullscreen =
    conferenceStatus === 'connecting' ||
    conferenceStatus === 'in-room' ||
    conferenceStatus === 'waiting'

  if (isConferenceFullscreen) return null

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (conn) conn.close()
    if (peer) peer.destroy()
    fullReset()
    resetCall()
    useChatRoomStore.getState().resetRoom()
    router.push('/')
  }

  const handleModeSwitch = (mode: 'transfer' | 'videocall' | 'chatroom' | 'conference') => {
    if (mode === 'transfer') {
      if (conn) conn.close()
      if (peer) peer.destroy()
      fullReset()
      router.push('/transfer')
      return
    }
    if (mode === 'videocall') {
      resetCall()
      router.push('/videocall')
      return
    }
    if (mode === 'chatroom') {
      useChatRoomStore.getState().resetRoom()
      router.push('/chatroom')
      return
    }
    if (mode === 'conference') {
      router.push('/conference')
      return
    }
  }

  const activeMode = pathname?.startsWith('/transfer')
    ? 'transfer'
    : pathname?.startsWith('/videocall')
    ? 'videocall'
    : pathname?.startsWith('/chatroom')
    ? 'chatroom'
    : pathname?.startsWith('/conference')
    ? 'conference'
    : null

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 h-20 px-4 md:px-8 transition-all duration-200 ${
        isScrolled
          ? 'bg-background/45 backdrop-blur-md border-b border-white/10'
          : 'bg-transparent backdrop-blur-0 border-b border-transparent'
      }`}
      style={{ isolation: 'isolate' }}
    >
      <div className="relative h-full flex items-center justify-between max-w-7xl mx-auto">
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

        {/* Center Navigation Tabs */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 sm:gap-1 glass-card rounded-lg px-1 py-1 z-10 w-max max-w-[70vw] sm:max-w-none justify-center">
          <button
            onClick={() => handleModeSwitch('transfer')}
            className={`flex items-center gap-2 px-2.5 lg:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeMode === 'transfer'
                ? 'bg-primary/15 text-primary'
                : 'text-muted hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Send className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">File Transfer</span>
          </button>
          <button
            onClick={() => handleModeSwitch('videocall')}
            className={`flex items-center gap-2 px-2.5 lg:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeMode === 'videocall'
                ? 'bg-primary/15 text-primary'
                : 'text-muted hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Video className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">Video Call</span>
          </button>
          <button
            onClick={() => handleModeSwitch('chatroom')}
            className={`flex items-center gap-2 px-2.5 lg:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeMode === 'chatroom'
                ? 'bg-primary/15 text-primary'
                : 'text-muted hover:text-foreground hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">Chat Room</span>
          </button>
          <button
            onClick={() => handleModeSwitch('conference')}
            className={`flex items-center gap-2 px-2.5 lg:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeMode === 'conference'
                ? 'bg-primary/15 text-primary'
                : 'text-muted hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">Conference</span>
          </button>
        </nav>

        {/* Right Side - Menu */}
        <div className="flex items-center gap-3 relative z-10">
          <HamburgerMenu />
        </div>
      </div>
    </header>
  )
}
