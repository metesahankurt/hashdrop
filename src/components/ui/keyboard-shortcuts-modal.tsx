"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { X, Command, Keyboard } from 'lucide-react'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Shortcut {
  keys: string[]
  description: string
  category: string
}

const shortcuts: Shortcut[] = [
  {
    keys: ['CMD/Ctrl', 'K'],
    description: 'Open Transfer History',
    category: 'Navigation'
  },
  {
    keys: ['CMD/Ctrl', '?'],
    description: 'Show Keyboard Shortcuts',
    category: 'Navigation'
  },
  {
    keys: ['Esc'],
    description: 'Close Modal',
    category: 'Navigation'
  },
  {
    keys: ['CMD/Ctrl', 'V'],
    description: 'Paste File/Text',
    category: 'Actions'
  }
]

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Centered Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl glass-card border border-border z-[70] p-4 md:p-6 rounded-xl md:rounded-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <h2 className="text-lg md:text-xl font-semibold">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              {/* Shortcuts List */}
              <div className="space-y-4">
                {/* Navigation Section */}
                <div>
                  <h3 className="text-xs md:text-sm font-semibold text-muted mb-2 uppercase tracking-wider">
                    Navigation
                  </h3>
                  <div className="space-y-2">
                    {shortcuts
                      .filter(s => s.category === 'Navigation')
                      .map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between glass-card p-2.5 md:p-3 rounded-lg"
                        >
                          <span className="text-xs md:text-sm text-foreground">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, i) => (
                              <span key={i} className="flex items-center gap-1">
                                <kbd className="px-2 py-1 text-xs font-mono bg-background/50 border border-border rounded">
                                  {key}
                                </kbd>
                                {i < shortcut.keys.length - 1 && (
                                  <span className="text-muted text-xs">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Actions Section */}
                <div>
                  <h3 className="text-xs md:text-sm font-semibold text-muted mb-2 uppercase tracking-wider">
                    Actions
                  </h3>
                  <div className="space-y-2">
                    {shortcuts
                      .filter(s => s.category === 'Actions')
                      .map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between glass-card p-2.5 md:p-3 rounded-lg"
                        >
                          <span className="text-xs md:text-sm text-foreground">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, i) => (
                              <span key={i} className="flex items-center gap-1">
                                <kbd className="px-2 py-1 text-xs font-mono bg-background/50 border border-border rounded">
                                  {key}
                                </kbd>
                                {i < shortcut.keys.length - 1 && (
                                  <span className="text-muted text-xs">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Footer Tip */}
              <div className="mt-4 md:mt-6 pt-4 border-t border-border/30">
                <p className="text-[10px] md:text-xs text-muted text-center">
                  Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background/50 border border-border rounded">Esc</kbd> to close this dialog
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
