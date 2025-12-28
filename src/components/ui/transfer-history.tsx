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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full max-w-md glass-card border-l border-border z-50 p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Transfer History</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-muted mx-auto mb-3 opacity-50" />
                <p className="text-muted">No transfers yet</p>
                <p className="text-xs text-muted mt-1">
                  Your transfer history will appear here
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {history.map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-3 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          record.direction === 'sent'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {record.direction === 'sent'
                            ? <ArrowUpRight className="w-4 h-4" />
                            : <ArrowDownLeft className="w-4 h-4" />
                          }
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate">
                            {record.fileName}
                          </h3>
                          <p className="text-xs text-muted">
                            {(record.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <p className="text-xs text-muted font-mono">
                            {record.hashPreview}
                          </p>
                          <p className="text-xs text-muted">
                            {new Date(record.timestamp).toLocaleDateString()} at{' '}
                            {new Date(record.timestamp).toLocaleTimeString()}
                          </p>
                        </div>

                        <div className={`text-xs px-2 py-1 rounded ${
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
                  className="w-full py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear History
                </button>

                <p className="text-xs text-muted text-center mt-4">
                  Privacy-first: Only metadata stored locally
                </p>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
