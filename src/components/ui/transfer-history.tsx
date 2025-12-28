"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, ArrowUpRight, ArrowDownLeft, Trash2, X } from 'lucide-react'
import { getTransferHistory, clearTransferHistory, type TransferRecord } from '@/lib/storage'
import { toast } from 'sonner'

interface TransferHistoryProps {
  isOpen: boolean
  onClose: () => void
}

export function TransferHistory({ isOpen, onClose }: TransferHistoryProps) {
  const [history, setHistory] = useState<TransferRecord[]>([])

  useEffect(() => {
    if (isOpen) {
      setHistory(getTransferHistory())
    }
  }, [isOpen])

  const handleClear = () => {
    if (confirm('Clear all transfer history? This cannot be undone.')) {
      clearTransferHistory()
      setHistory([])
      toast.success('History cleared')
    }
  }

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
              className="w-full max-w-2xl max-h-[85vh] glass-card border border-border z-[70] p-4 md:p-6 overflow-y-auto rounded-xl md:rounded-2xl"
            >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <h2 className="text-lg md:text-xl font-semibold">Transfer History</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <History className="w-10 h-10 md:w-12 md:h-12 text-muted mx-auto mb-2 md:mb-3 opacity-50" />
                <p className="text-sm md:text-base text-muted">No transfers yet</p>
                <p className="text-xs text-muted mt-1">
                  Your transfer history will appear here
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 md:space-y-3 mb-4">
                  {history.map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-2.5 md:p-3 rounded-lg"
                    >
                      <div className="flex items-start gap-2 md:gap-3">
                        <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${
                          record.direction === 'sent'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {record.direction === 'sent'
                            ? <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            : <ArrowDownLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          }
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs md:text-sm font-semibold truncate">
                            {record.fileName}
                          </h3>
                          <p className="text-[10px] md:text-xs text-muted">
                            {(record.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <p className="text-[10px] md:text-xs text-muted font-mono truncate">
                            {record.hashPreview}
                          </p>
                          <p className="text-[10px] md:text-xs text-muted">
                            {new Date(record.timestamp).toLocaleDateString()} at{' '}
                            {new Date(record.timestamp).toLocaleTimeString()}
                          </p>
                        </div>

                        <div className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded flex-shrink-0 ${
                          record.success
                            ? 'bg-success/10 text-success'
                            : 'bg-danger/10 text-danger'
                        }`}>
                          {record.success ? 'Success' : 'Failed'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={handleClear}
                  className="w-full py-2 md:py-2.5 text-xs md:text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors flex items-center justify-center gap-1.5 md:gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Clear History
                </button>

                <p className="text-[10px] md:text-xs text-muted text-center mt-3 md:mt-4">
                  Privacy-first: Only metadata stored locally
                </p>
              </>
            )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
