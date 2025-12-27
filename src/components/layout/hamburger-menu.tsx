'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)

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
            {/* Simple Backdrop - No Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 z-40"
            />

            {/* Optimized Menu Panel - Solid Black Background */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed top-0 right-0 h-screen w-full max-w-sm md:w-80 bg-black border-l border-border z-50 p-6 md:p-7"
              style={{ willChange: 'transform' }}
            >
              <div className="flex flex-col gap-5 mt-16">

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
