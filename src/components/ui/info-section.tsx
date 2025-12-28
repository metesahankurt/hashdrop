'use client'

import { motion } from 'framer-motion'
import { Shield, Zap, Lock, FileCheck, Users, Server, Eye, CloudOff } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Direct peer-to-peer transfer with no intermediary servers'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Files never touch our servers or the cloud'
  },
  {
    icon: Lock,
    title: 'End-to-End Encrypted',
    description: 'WebRTC provides automatic DTLS/SRTP encryption'
  },
  {
    icon: FileCheck,
    title: 'Integrity Verified',
    description: 'SHA-256 hashing ensures file authenticity'
  }
]

const securityFeatures = [
  {
    icon: Users,
    title: 'Only You & Recipient',
    description: 'Only the person with the unique code can access your file. No third-party can intercept the transfer.'
  },
  {
    icon: CloudOff,
    title: 'No Cloud Storage',
    description: 'Your files are never uploaded to any server. They go directly from your device to the recipient.'
  },
  {
    icon: Eye,
    title: 'No Tracking',
    description: "We don't log, track, or store any information about your transfers. Complete anonymity guaranteed."
  },
  {
    icon: Server,
    title: 'Serverless Transfer',
    description: "Files travel through encrypted WebRTC data channels. Even we can't see what you're sharing."
  }
]

export function InfoSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-16 md:py-20">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 md:mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
          Why HashDrop?
        </h2>
        <p className="text-base md:text-lg text-muted max-w-2xl mx-auto">
          Built on modern web technologies for secure, private file sharing
        </p>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="glass-card-hover p-5 rounded-xl"
          >
            <div className="flex flex-col items-center text-center gap-3">
              {/* Icon */}
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-12 md:mt-16 text-center glass-card p-6 md:p-8 rounded-xl"
      >
        <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
          How It Works
        </h3>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-sm text-muted">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs">
              1
            </div>
            <span>Choose your file</span>
          </div>
          <div className="hidden md:block w-8 h-px bg-border"></div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs">
              2
            </div>
            <span>Share the code</span>
          </div>
          <div className="hidden md:block w-8 h-px bg-border"></div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs">
              3
            </div>
            <span>Transfer complete!</span>
          </div>
        </div>
      </motion.div>

      {/* Privacy & Security Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-16 md:mt-20"
      >
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
            Your Privacy Matters
          </h2>
          <p className="text-base text-muted max-w-2xl mx-auto">
            HashDrop is designed with privacy and security at its core. Here&apos;s how we protect your files.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
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
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* How We Do It Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-12 md:mt-16 glass-card p-6 md:p-8 rounded-xl"
      >
        <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-5 text-center">
          How Does It Work?
        </h3>

        <div className="space-y-4 text-sm md:text-base text-muted">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs shrink-0 mt-0.5">
              1
            </div>
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">Peer-to-Peer Connection:</span> When you upload a file, we create a unique code. This code is the only way to access your file - no one else can join the transfer.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs shrink-0 mt-0.5">
              2
            </div>
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">Direct Transfer:</span> Your file travels directly from your device to the recipient's device using WebRTC technology. It never passes through our servers or any cloud storage.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs shrink-0 mt-0.5">
              3
            </div>
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">Encrypted Channels:</span> All data is automatically encrypted using WebRTC&apos;s built-in DTLS/SRTP encryption. Even if someone intercepts the connection, they cannot read the data.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs shrink-0 mt-0.5">
              4
            </div>
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">File Verification:</span> We calculate a SHA-256 hash of your file before and after transfer. This ensures the file has not been tampered with or corrupted during transmission.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold text-xs shrink-0 mt-0.5">
              5
            </div>
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">Zero Data Retention:</span> Once the transfer is complete, no trace remains. We do not store files, metadata, or transfer logs. It&apos;s as if the transfer never happened.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-warning/5 border border-warning/20">
          <p className="text-sm text-foreground/80 leading-relaxed text-center">
            <span className="font-semibold text-warning">Important:</span> Keep your transfer code private! Anyone with the code can access the file. Share it only through secure channels (WhatsApp, Signal, email, etc.) with the intended recipient.
          </p>
        </div>
      </motion.div>

      {/* Tech Stack */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="mt-8 text-center"
      >
        <p className="text-xs text-muted mb-2">Powered by</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="text-xs px-2.5 py-1 glass-card rounded-md text-foreground">WebRTC</span>
          <span className="text-xs px-2.5 py-1 glass-card rounded-md text-foreground">PeerJS</span>
          <span className="text-xs px-2.5 py-1 glass-card rounded-md text-foreground">Next.js</span>
          <span className="text-xs px-2.5 py-1 glass-card rounded-md text-foreground">TypeScript</span>
        </div>
      </motion.div>
    </section>
  )
}
