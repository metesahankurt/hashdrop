'use client'

import { useState } from 'react'
import { Menu, X, ChevronDown, Zap, Shield, Video, ArrowRight, Cpu, Lock } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { getPreferences, toggleAutoCopyCode, toggleAutoDownload, toggleErrorNotifications } from '@/lib/preferences'
import { toast } from 'sonner'

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [autoCopyEnabled, setAutoCopyEnabled] = useState(() => getPreferences().autoCopyCode)
  const [autoDownloadEnabled, setAutoDownloadEnabled] = useState(() => getPreferences().autoDownload)
  const [errorNotificationsEnabled, setErrorNotificationsEnabled] = useState(() => getPreferences().errorNotifications)

  return (
    <>
      {/* Hamburger Button - No Glass Effect for Performance */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-[60] p-2.5 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-foreground" />
        ) : (
          <Menu className="w-5 h-5 text-foreground" />
        )}
      </button>

      {/* Menu Overlay */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop with Blur and Semi-Transparent Background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/30"
              style={{
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
            />

            {/* Menu Panel with Blur and Semi-Transparent Background */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed top-0 right-0 h-screen w-full max-w-sm md:w-80 border-l border-border z-50 p-6 md:p-7 bg-background/95"
              style={{
                willChange: 'transform',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              <div className="flex flex-col gap-5 mt-16">

                {/* Settings Section */}
                <div className="space-y-3">
                  <p className="text-xs text-muted uppercase tracking-wider">Settings</p>

                  {/* Auto-copy Code Toggle */}
                  <button
                    onClick={async () => {
                      const newValue = toggleAutoCopyCode()
                      setAutoCopyEnabled(newValue)

                      // Request clipboard permission when enabling
                      if (newValue && typeof navigator !== 'undefined' && navigator.clipboard) {
                        try {
                          // Test clipboard access
                          await navigator.clipboard.writeText('')
                          toast.success('✅ Auto-copy enabled', { duration: 1500 })
                        } catch {
                          toast.warning('⚠️ Auto-copy enabled, but clipboard permission denied', {
                            duration: 2500
                          })
                        }
                      } else {
                        toast.success('❌ Auto-copy disabled', { duration: 1500 })
                      }
                    }}
                    className="w-full flex items-center justify-between text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm text-foreground">Auto-copy Code</span>
                    <div className={`relative w-11 h-6 rounded-full transition-colors ${
                      autoCopyEnabled ? 'bg-primary' : 'bg-border'
                    }`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        autoCopyEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </div>
                  </button>

                  {/* Auto-download Files Toggle */}
                  <button
                    onClick={() => {
                      const newValue = toggleAutoDownload()
                      setAutoDownloadEnabled(newValue)
                      toast.success(
                        newValue ? '✅ Auto-download enabled' : '❌ Auto-download disabled',
                        { duration: 1500 }
                      )
                    }}
                    className="w-full flex items-center justify-between text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm text-foreground">Auto-download Files</span>
                    <div className={`relative w-11 h-6 rounded-full transition-colors ${
                      autoDownloadEnabled ? 'bg-primary' : 'bg-border'
                    }`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        autoDownloadEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </div>
                  </button>

                  {/* Error Notifications Toggle */}
                  <button
                    onClick={() => {
                      const newValue = toggleErrorNotifications()
                      setErrorNotificationsEnabled(newValue)
                      toast.success(
                        newValue ? '🔔 Error notifications enabled' : '🔕 Error notifications disabled',
                        { duration: 1500 }
                      )
                    }}
                    className="w-full flex items-center justify-between text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm text-foreground">Error Notifications</span>
                    <div className={`relative w-11 h-6 rounded-full transition-colors ${
                      errorNotificationsEnabled ? 'bg-primary' : 'bg-border'
                    }`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        errorNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </div>
                  </button>
                </div>

                <div className="border-t border-border/30 pt-5" />

                <div className="space-y-2">
                  <button
                    onClick={() => setAboutOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm text-foreground">About HashDrop</span>
                    <ChevronDown className={`w-4 h-4 text-muted transition-transform ${aboutOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {aboutOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="glass-card rounded-xl p-3 space-y-4">
                          <div className="space-y-2">
                            <p className="text-[11px] text-muted uppercase tracking-wider">Features</p>
                            <div className="space-y-2">
                              <div className="flex items-start gap-2 text-xs text-muted">
                                <Zap className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                <span>Direct P2P transfer and calls with low latency.</span>
                              </div>
                              <div className="flex items-start gap-2 text-xs text-muted">
                                <Shield className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                <span>No cloud storage, no server-side file retention.</span>
                              </div>
                              <div className="flex items-start gap-2 text-xs text-muted">
                                <Video className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                <span>Video conferences with waiting room and screen sharing.</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[11px] text-muted uppercase tracking-wider">How It Works</p>
                            <div className="space-y-1.5 text-xs text-muted">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 text-primary flex items-center justify-center text-[10px] font-semibold">1</span>
                                <span>Create a transfer or call code</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 text-primary flex items-center justify-center text-[10px] font-semibold">2</span>
                                <span>Share the code with your peer</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 text-primary flex items-center justify-center text-[10px] font-semibold">3</span>
                                <span>Connect directly and start instantly</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[11px] text-muted uppercase tracking-wider">Tech Stack</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-white/5 border border-border text-foreground/90">
                                <Cpu className="w-3 h-3" /> WebRTC
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-white/5 border border-border text-foreground/90">
                                <Lock className="w-3 h-3" /> E2E Crypto
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border-t border-border/30 pt-5" />

                <Link
                  href="/privacy"
                  onClick={() => setIsOpen(false)}
                  className="text-base text-foreground hover:text-primary py-1"
                >
                  Privacy Policy
                </Link>

                <Link
                  href="/terms"
                  onClick={() => setIsOpen(false)}
                  className="text-base text-foreground hover:text-primary py-1"
                >
                  Terms of Service
                </Link>

                <div className="border-t border-border/30 pt-5 mt-5">
                  <p className="text-xs text-muted mb-3">Contact & Source</p>
                  <a
                    href="https://github.com/metesahankurt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline block mb-2"
                  >
                    GitHub: @metesahankurt
                  </a>
                  <a
                    href="https://www.linkedin.com/in/mete-sahan-kurt/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline block"
                  >
                    LinkedIn: @mete-sahan-kurt
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
