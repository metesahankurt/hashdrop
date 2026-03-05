'use client'

import { Video, Send, MessageSquare } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'

export function WelcomeScreen() {
  const setAppMode = useAppStore((s) => s.setAppMode)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-16 md:py-20 relative z-10">
      {/* Hero */}
      <div className="text-center space-y-4 md:space-y-5 mb-12 md:mb-16">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1]">
          Welcome to{' '}
          <span className="text-primary font-bold">HashDrop</span>
        </h1>
        <p className="text-lg md:text-xl text-muted max-w-lg mx-auto leading-relaxed">
          Secure peer-to-peer communication. No cloud. No limits.
        </p>
      </div>

      {/* Cards Grid — 3 cards in responsive layout */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {/* Video Call */}
        <button
          onClick={() => setAppMode('videocall')}
          className="glass-card-hover rounded-2xl p-6 md:p-7 text-left group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
            <Video className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Video Call</h2>
          <p className="text-sm text-muted leading-relaxed">
            Peer-to-peer video calls with end-to-end encryption. Up to 5 people.
          </p>
          <div className="mt-5 inline-flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Start call
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Chat Room */}
        <button
          onClick={() => setAppMode('chatroom')}
          className="glass-card-hover rounded-2xl p-6 md:p-7 text-left group cursor-pointer relative"
        >
          {/* NEW badge */}
          <div className="absolute top-3 right-3 bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
            YENİ
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Sohbet Odası</h2>
          <p className="text-sm text-muted leading-relaxed">
            Şifresiz veya şifreli anlık sohbet odaları. 5 kişiye kadar. Kamera yok, sadece yazışma.
          </p>
          <div className="mt-5 inline-flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Odaya gir
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* File Transfer */}
        <button
          onClick={() => setAppMode('transfer')}
          className="glass-card-hover rounded-2xl p-6 md:p-7 text-left group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
            <Send className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">File Transfer</h2>
          <p className="text-sm text-muted leading-relaxed">
            Send files at lightspeed with direct peer-to-peer transfer.
          </p>
          <div className="mt-5 inline-flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Transfer files
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  )
}
