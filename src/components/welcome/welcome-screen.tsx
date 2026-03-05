'use client'

import { Video, Send, MessageSquare, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'

interface CardProps {
  icon: React.ReactNode
  title: string
  description: string
  cta: string
  badge?: string
  onClick: () => void
}

function FeatureCard({ icon, title, description, cta, badge, onClick }: CardProps) {
  return (
    <button
      onClick={onClick}
      className="glass-card-hover rounded-2xl p-6 md:p-7 text-left group cursor-pointer relative flex flex-col"
    >
      {badge && (
        <span className="absolute top-3.5 right-3.5 bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">
          {badge}
        </span>
      )}

      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors shrink-0">
        {icon}
      </div>

      {/* Text */}
      <h2 className="text-base font-semibold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted leading-relaxed flex-1">{description}</p>

      {/* CTA arrow */}
      <div className="mt-5 inline-flex items-center gap-1 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        {cta}
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  )
}

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
          Secure end-to-end communication. No cloud. No limits.
        </p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <FeatureCard
          icon={<Send className="w-6 h-6 text-primary" />}
          title="File Transfer"
          description="Blazing-fast, direct device-to-device file transfer. No cloud, no limits."
          cta="Start transfer"
          onClick={() => setAppMode('transfer')}
        />

        <FeatureCard
          icon={<Video className="w-6 h-6 text-primary" />}
          title="Video Call"
          description="End-to-end encrypted video calls. Supports up to 5 participants."
          cta="Start a call"
          badge="NEW"
          onClick={() => setAppMode('videocall')}
        />

        <FeatureCard
          icon={<MessageSquare className="w-6 h-6 text-primary" />}
          title="Chat Room"
          description="Encrypted instant messaging rooms. Up to 5 people. No camera, text only."
          cta="Enter room"
          badge="NEW"
          onClick={() => setAppMode('chatroom')}
        />
      </div>
    </div>
  )
}
