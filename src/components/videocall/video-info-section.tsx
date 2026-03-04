'use client'

import { Shield, Zap, Lock, Video, Users, Server, Eye, CloudOff } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Zero Latency',
    description: 'Direct peer-to-peer connection for real-time video without delay'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your video and audio never pass through any server'
  },
  {
    icon: Lock,
    title: 'End-to-End Encrypted',
    description: 'WebRTC provides automatic DTLS/SRTP encryption for all media'
  },
  {
    icon: Video,
    title: 'HD Quality',
    description: 'Up to 720p video with echo cancellation and noise suppression'
  }
]

const securityFeatures = [
  {
    icon: Users,
    title: 'Only You & The Other Person',
    description: 'Only the person with the unique code can join your call. No third-party can listen in.'
  },
  {
    icon: CloudOff,
    title: 'No Recording',
    description: 'Your calls are never recorded or stored on any server. Everything stays between you and the other person.'
  },
  {
    icon: Eye,
    title: 'No Tracking',
    description: "We don't log, track, or store any information about your calls. Complete anonymity guaranteed."
  },
  {
    icon: Server,
    title: 'Serverless Calls',
    description: "Video and audio travel through encrypted WebRTC media channels. Even we can't see or hear your conversation."
  }
]

export function VideoInfoSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-16 md:py-20">
      {/* Section Header */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
          Why HashDrop Video?
        </h2>
        <p className="text-base md:text-lg text-muted max-w-2xl mx-auto">
          Built on WebRTC for secure, private peer-to-peer video calls
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="glass-card-hover p-5 rounded-xl"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className="mt-12 md:mt-16 text-center glass-card p-6 md:p-8 rounded-xl">
        <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
          How It Works
        </h3>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-sm text-muted">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs">
              1
            </div>
            <span>Get your code</span>
          </div>
          <div className="hidden md:block w-8 h-px bg-border"></div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs">
              2
            </div>
            <span>Share with the other person</span>
          </div>
          <div className="hidden md:block w-8 h-px bg-border"></div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs">
              3
            </div>
            <span>Start talking!</span>
          </div>
        </div>
      </div>

      {/* Privacy & Security Section */}
      <div className="mt-16 md:mt-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
            Your Privacy Matters
          </h2>
          <p className="text-base text-muted max-w-2xl mx-auto">
            HashDrop Video is designed with privacy and security at its core. Here&apos;s how we protect your calls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {securityFeatures.map((feature) => (
            <div
              key={feature.title}
              className="glass-card-hover p-5 rounded-xl"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-success/10 border border-success/20 shrink-0">
                  <feature.icon className="w-5 h-5 text-success" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How Does It Work - Detailed */}
      <div className="mt-12 md:mt-16 glass-card p-6 md:p-8 rounded-xl">
        <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-5 text-center">
          How Does It Work?
        </h3>

        <div className="space-y-4 text-sm md:text-base text-muted">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs shrink-0 mt-0.5">
              1
            </div>
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">Peer-to-Peer Connection:</span> When you start a call, we generate a unique code. This code is the only way to join your call - no one else can connect.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs shrink-0 mt-0.5">
              2
            </div>
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">Direct Media Stream:</span> Your video and audio travel directly from your device to the other person&apos;s device using WebRTC technology. It never passes through our servers.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs shrink-0 mt-0.5">
              3
            </div>
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">Encrypted Channels:</span> All media is automatically encrypted using WebRTC&apos;s built-in DTLS/SRTP encryption. Even if someone intercepts the connection, they cannot see or hear anything.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs shrink-0 mt-0.5">
              4
            </div>
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">Zero Data Retention:</span> Once the call ends, no trace remains. We do not record, store, or log any audio or video data. It&apos;s as if the call never happened.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-warning/5 border border-warning/20">
          <p className="text-sm text-foreground/80 leading-relaxed text-center">
            <span className="font-semibold text-warning">Important:</span> Keep your call code private! Anyone with the code can join your call. Share it only through secure channels with the intended person.
          </p>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted mb-2">Powered by</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="text-xs px-2.5 py-1 glass-card rounded-md text-foreground">WebRTC</span>
          <span className="text-xs px-2.5 py-1 glass-card rounded-md text-foreground">PeerJS</span>
          <span className="text-xs px-2.5 py-1 glass-card rounded-md text-foreground">Next.js</span>
          <span className="text-xs px-2.5 py-1 glass-card rounded-md text-foreground">TypeScript</span>
        </div>
      </div>
    </section>
  )
}
