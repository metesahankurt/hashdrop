"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, X, TrendingUp, ArrowUpRight, ArrowDownLeft, FileText, Calendar, Download } from 'lucide-react'
import { getAdvancedAnalytics, exportStatisticsAsJSON, type TransferAnalytics } from '@/lib/storage'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'

interface StatisticsDashboardProps {
  isOpen: boolean
  onClose: () => void
}

const COLORS = ['#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#34d399', '#fbbf24', '#ef4444', '#8b5cf6']

export function StatisticsDashboard({ isOpen, onClose }: StatisticsDashboardProps) {
  const [analytics, setAnalytics] = useState<TransferAnalytics | null>(null)

  useEffect(() => {
    if (isOpen) {
      setAnalytics(getAdvancedAnalytics())
    }
  }, [isOpen])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatFileType = (type: string): string => {
    if (!type || type === 'unknown') return 'Unknown'
    const parts = type.split('/')
    return parts[parts.length - 1].toUpperCase()
  }

  if (!analytics) return null

  const hasData = analytics.totalTransfers > 0

  // Prepare chart data
  const fileTypeChartData = analytics.fileTypes.slice(0, 6).map(ft => ({
    name: formatFileType(ft.type),
    value: ft.count,
    size: ft.totalSize
  }))

  const directionData = [
    { name: 'Sent', value: analytics.sentCount, color: '#60a5fa' },
    { name: 'Received', value: analytics.receivedCount, color: '#a78bfa' }
  ]

  const dailyChartData = analytics.dailyStats.slice(-14).map(stat => ({
    date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sent: stat.sent,
    received: stat.received,
    total: stat.sent + stat.received
  }))

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
              className="w-full max-w-5xl max-h-[90vh] glass-card border border-border z-[70] p-4 md:p-6 overflow-y-auto rounded-xl md:rounded-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <h2 className="text-lg md:text-xl font-semibold">Transfer Statistics</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              {!hasData ? (
                <div className="text-center py-8 md:py-12">
                  <BarChart3 className="w-10 h-10 md:w-12 md:h-12 text-muted mx-auto mb-2 md:mb-3 opacity-50" />
                  <p className="text-sm md:text-base text-muted">No data yet</p>
                  <p className="text-xs text-muted mt-1">
                    Start transferring files to see statistics
                  </p>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="glass-card p-3 md:p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1 md:mb-2">
                        <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                        <span className="text-[10px] md:text-xs text-muted">Total Transfers</span>
                      </div>
                      <p className="text-lg md:text-2xl font-bold">{analytics.totalTransfers}</p>
                      <p className="text-[10px] md:text-xs text-muted mt-0.5 md:mt-1">
                        {analytics.last7Days} in last 7 days
                      </p>
                    </div>

                    <div className="glass-card p-3 md:p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1 md:mb-2">
                        <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
                        <span className="text-[10px] md:text-xs text-muted">Data Transferred</span>
                      </div>
                      <p className="text-lg md:text-2xl font-bold">
                        {formatBytes(analytics.totalDataTransferred)}
                      </p>
                      <p className="text-[10px] md:text-xs text-muted mt-0.5 md:mt-1">
                        Avg: {formatBytes(analytics.averageFileSize)}
                      </p>
                    </div>

                    <div className="glass-card p-3 md:p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1 md:mb-2">
                        <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                        <span className="text-[10px] md:text-xs text-muted">Sent</span>
                      </div>
                      <p className="text-lg md:text-2xl font-bold">{analytics.sentCount}</p>
                      <p className="text-[10px] md:text-xs text-muted mt-0.5 md:mt-1">
                        {formatBytes(analytics.sentData)}
                      </p>
                    </div>

                    <div className="glass-card p-3 md:p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1 md:mb-2">
                        <ArrowDownLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
                        <span className="text-[10px] md:text-xs text-muted">Received</span>
                      </div>
                      <p className="text-lg md:text-2xl font-bold">{analytics.receivedCount}</p>
                      <p className="text-[10px] md:text-xs text-muted mt-0.5 md:mt-1">
                        {formatBytes(analytics.receivedData)}
                      </p>
                    </div>
                  </div>

                  {/* Success Rate */}
                  <div className="glass-card p-3 md:p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm font-semibold">Success Rate</span>
                      <span className="text-xs md:text-sm font-bold text-success">
                        {analytics.successRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-success to-primary rounded-full transition-all duration-500"
                        style={{ width: `${analytics.successRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Transfer Trend */}
                    {dailyChartData.length > 0 && (
                      <div className="glass-card p-3 md:p-4 rounded-lg">
                        <h3 className="text-xs md:text-sm font-semibold mb-3 md:mb-4 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          Transfer Trend (Last 14 Days)
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={dailyChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                              dataKey="date"
                              stroke="rgba(255,255,255,0.5)"
                              style={{ fontSize: '10px' }}
                            />
                            <YAxis
                              stroke="rgba(255,255,255,0.5)"
                              style={{ fontSize: '10px' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}
                            />
                            <Legend
                              wrapperStyle={{ fontSize: '11px' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="sent"
                              stroke="#60a5fa"
                              strokeWidth={2}
                              name="Sent"
                              dot={{ fill: '#60a5fa', r: 3 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="received"
                              stroke="#a78bfa"
                              strokeWidth={2}
                              name="Received"
                              dot={{ fill: '#a78bfa', r: 3 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* File Types */}
                    {fileTypeChartData.length > 0 && (
                      <div className="glass-card p-3 md:p-4 rounded-lg">
                        <h3 className="text-xs md:text-sm font-semibold mb-3 md:mb-4 flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          File Types
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={fileTypeChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) =>
                                `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                              }
                              outerRadius={70}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {fileTypeChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Top Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    {analytics.largestTransfer && (
                      <div className="glass-card p-3 md:p-4 rounded-lg">
                        <span className="text-[10px] md:text-xs text-muted">Largest Transfer</span>
                        <p className="text-xs md:text-sm font-semibold mt-1 truncate">
                          {analytics.largestTransfer.fileName}
                        </p>
                        <p className="text-xs md:text-sm text-primary font-bold">
                          {formatBytes(analytics.largestTransfer.size)}
                        </p>
                      </div>
                    )}

                    {analytics.peakDay && (
                      <div className="glass-card p-3 md:p-4 rounded-lg">
                        <span className="text-[10px] md:text-xs text-muted">Most Active Day</span>
                        <p className="text-xs md:text-sm font-semibold mt-1">
                          {new Date(analytics.peakDay).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs md:text-sm text-primary font-bold">
                          {(() => {
                            const peakDayData = analytics.dailyStats.find(d => d.date === analytics.peakDay)
                            return ((peakDayData?.sent || 0) + (peakDayData?.received || 0))
                          })()} transfers
                        </p>
                      </div>
                    )}

                    <div className="glass-card p-3 md:p-4 rounded-lg">
                      <span className="text-[10px] md:text-xs text-muted">This Week</span>
                      <p className="text-xs md:text-sm font-semibold mt-1">
                        {analytics.thisWeek} transfers
                      </p>
                      <p className="text-xs md:text-sm text-muted">
                        This month: {analytics.thisMonth}
                      </p>
                    </div>
                  </div>

                  {/* Export Button */}
                  <button
                    onClick={() => {
                      exportStatisticsAsJSON()
                      toast.success('Statistics exported as JSON')
                    }}
                    className="w-full py-2 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Statistics
                  </button>

                  {/* Footer */}
                  <p className="text-[10px] md:text-xs text-muted text-center pt-2 border-t border-white/10">
                    All statistics are calculated from local transfer history
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
