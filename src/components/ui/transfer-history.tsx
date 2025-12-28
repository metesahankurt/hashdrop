"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, ArrowUpRight, ArrowDownLeft, Trash2, X, Search, Filter, Download } from 'lucide-react'
import { getTransferHistory, clearTransferHistory, exportHistoryAsCSV, exportHistoryAsJSON, type TransferRecord } from '@/lib/storage'
import { toast } from 'sonner'

interface TransferHistoryProps {
  isOpen: boolean
  onClose: () => void
}

type DirectionFilter = 'all' | 'sent' | 'received'
type StatusFilter = 'all' | 'success' | 'failed'
type SortOption = 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc' | 'name-asc' | 'name-desc'

export function TransferHistory({ isOpen, onClose }: TransferHistoryProps) {
  const [history, setHistory] = useState<TransferRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setHistory(getTransferHistory())
    }
  }, [isOpen])

  // Filter and sort history
  const filteredHistory = useMemo(() => {
    let filtered = [...history]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(record =>
        record.fileName.toLowerCase().includes(query) ||
        record.hashPreview.toLowerCase().includes(query)
      )
    }

    // Direction filter
    if (directionFilter !== 'all') {
      filtered = filtered.filter(record => record.direction === directionFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isSuccess = statusFilter === 'success'
      filtered = filtered.filter(record => record.success === isSuccess)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.timestamp - a.timestamp
        case 'date-asc':
          return a.timestamp - b.timestamp
        case 'size-desc':
          return b.fileSize - a.fileSize
        case 'size-asc':
          return a.fileSize - b.fileSize
        case 'name-asc':
          return a.fileName.localeCompare(b.fileName)
        case 'name-desc':
          return b.fileName.localeCompare(a.fileName)
        default:
          return 0
      }
    })

    return filtered
  }, [history, searchQuery, directionFilter, statusFilter, sortBy])

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
                {filteredHistory.length !== history.length && (
                  <span className="text-xs text-muted">
                    ({filteredHistory.length}/{history.length})
                  </span>
                )}
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
                {/* Search and Filter Controls */}
                <div className="mb-4 space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      placeholder="Search by filename or hash..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>

                  {/* Filter Button and Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        showFilters ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted hover:bg-white/10'
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>Filters</span>
                    </button>

                    {/* Quick Sort Buttons */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="px-3 py-1.5 text-xs bg-white/5 border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      <option value="date-desc">Newest First</option>
                      <option value="date-asc">Oldest First</option>
                      <option value="size-desc">Largest First</option>
                      <option value="size-asc">Smallest First</option>
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                    </select>
                  </div>

                  {/* Filter Options (Collapsible) */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="glass-card p-3 rounded-lg space-y-3">
                          {/* Direction Filter */}
                          <div>
                            <label className="text-xs text-muted mb-1.5 block">Direction</label>
                            <div className="flex gap-2">
                              {(['all', 'sent', 'received'] as DirectionFilter[]).map((dir) => (
                                <button
                                  key={dir}
                                  onClick={() => setDirectionFilter(dir)}
                                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors capitalize ${
                                    directionFilter === dir
                                      ? 'bg-primary text-white'
                                      : 'bg-white/5 text-muted hover:bg-white/10'
                                  }`}
                                >
                                  {dir}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Status Filter */}
                          <div>
                            <label className="text-xs text-muted mb-1.5 block">Status</label>
                            <div className="flex gap-2">
                              {(['all', 'success', 'failed'] as StatusFilter[]).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => setStatusFilter(status)}
                                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors capitalize ${
                                    statusFilter === status
                                      ? 'bg-primary text-white'
                                      : 'bg-white/5 text-muted hover:bg-white/10'
                                  }`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Reset Filters Button */}
                          {(directionFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
                            <button
                              onClick={() => {
                                setDirectionFilter('all')
                                setStatusFilter('all')
                                setSearchQuery('')
                              }}
                              className="w-full py-1.5 text-xs text-muted hover:text-primary transition-colors"
                            >
                              Reset Filters
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Results */}
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="w-10 h-10 text-muted mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted">No transfers found</p>
                    <p className="text-xs text-muted mt-1">
                      Try adjusting your filters
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3 mb-4">
                    {filteredHistory.map((record) => (
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
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  {/* Export Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        exportHistoryAsCSV()
                        toast.success('History exported as CSV')
                      }}
                      className="py-2 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        exportHistoryAsJSON()
                        toast.success('History exported as JSON')
                      }}
                      className="py-2 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export JSON
                    </button>
                  </div>

                  {/* Clear Button */}
                  <button
                    onClick={handleClear}
                    className="w-full py-2 md:py-2.5 text-xs md:text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors flex items-center justify-center gap-1.5 md:gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Clear History
                  </button>
                </div>

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
