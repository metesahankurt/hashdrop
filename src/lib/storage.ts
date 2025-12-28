/**
 * LocalStorage utilities for transfer history
 * Privacy-first: Stores METADATA only, NOT file contents
 */

export interface TransferRecord {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  direction: 'sent' | 'received'
  timestamp: number
  hashPreview: string
  success: boolean
}

const STORAGE_KEY = 'hashdrop_transfer_history'
const MAX_HISTORY = 100

export function getTransferHistory(): TransferRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to read transfer history:', error)
    return []
  }
}

export function addTransferRecord(record: Omit<TransferRecord, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return

  try {
    const history = getTransferHistory()
    const newRecord: TransferRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }

    const updated = [newRecord, ...history].slice(0, MAX_HISTORY)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save transfer history:', error)
  }
}

export function clearTransferHistory(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear transfer history:', error)
  }
}

export function exportHistoryAsCSV(): void {
  const history = getTransferHistory()
  if (history.length === 0) return

  // CSV headers
  const headers = ['Date', 'Time', 'Filename', 'Size (MB)', 'Type', 'Direction', 'Status', 'Hash Preview']

  // CSV rows
  const rows = history.map(record => {
    const date = new Date(record.timestamp)
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      record.fileName,
      (record.fileSize / (1024 * 1024)).toFixed(2),
      record.fileType,
      record.direction,
      record.success ? 'Success' : 'Failed',
      record.hashPreview
    ]
  })

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `hashdrop-history-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportHistoryAsJSON(): void {
  const history = getTransferHistory()
  if (history.length === 0) return

  const jsonContent = JSON.stringify(history, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `hashdrop-history-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportStatisticsAsJSON(): void {
  const analytics = getAdvancedAnalytics()
  const jsonContent = JSON.stringify(analytics, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `hashdrop-statistics-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function getTransferStats() {
  const history = getTransferHistory()

  return {
    totalTransfers: history.length,
    totalDataTransferred: history.reduce((sum, r) => sum + r.fileSize, 0),
    successRate: history.length > 0
      ? (history.filter(r => r.success).length / history.length) * 100
      : 0,
    lastTransfer: history[0]?.timestamp || null
  }
}

// Advanced analytics interfaces
export interface FileTypeStats {
  type: string
  count: number
  totalSize: number
  percentage: number
}

export interface DailyTransferStats {
  date: string
  sent: number
  received: number
  totalSize: number
}

export interface TransferAnalytics {
  // Basic stats
  totalTransfers: number
  totalDataTransferred: number
  successRate: number
  failureRate: number

  // Breakdown by direction
  sentCount: number
  receivedCount: number
  sentData: number
  receivedData: number

  // File type analysis
  fileTypes: FileTypeStats[]

  // Size metrics
  averageFileSize: number
  largestTransfer: { fileName: string; size: number } | null
  smallestTransfer: { fileName: string; size: number } | null

  // Time-based metrics
  dailyStats: DailyTransferStats[]
  peakDay: string | null

  // Recent activity
  last7Days: number
  last30Days: number
  thisWeek: number
  thisMonth: number
}

export function getAdvancedAnalytics(): TransferAnalytics {
  const history = getTransferHistory()

  if (history.length === 0) {
    return {
      totalTransfers: 0,
      totalDataTransferred: 0,
      successRate: 0,
      failureRate: 0,
      sentCount: 0,
      receivedCount: 0,
      sentData: 0,
      receivedData: 0,
      fileTypes: [],
      averageFileSize: 0,
      largestTransfer: null,
      smallestTransfer: null,
      dailyStats: [],
      peakDay: null,
      last7Days: 0,
      last30Days: 0,
      thisWeek: 0,
      thisMonth: 0
    }
  }

  // Basic stats
  const totalTransfers = history.length
  const successfulTransfers = history.filter(r => r.success)
  const totalDataTransferred = history.reduce((sum, r) => sum + r.fileSize, 0)
  const successRate = (successfulTransfers.length / totalTransfers) * 100
  const failureRate = 100 - successRate

  // Direction breakdown
  const sent = history.filter(r => r.direction === 'sent')
  const received = history.filter(r => r.direction === 'received')
  const sentCount = sent.length
  const receivedCount = received.length
  const sentData = sent.reduce((sum, r) => sum + r.fileSize, 0)
  const receivedData = received.reduce((sum, r) => sum + r.fileSize, 0)

  // File type analysis
  const typeMap = new Map<string, { count: number; totalSize: number }>()
  history.forEach(record => {
    const type = record.fileType || 'unknown'
    const existing = typeMap.get(type) || { count: 0, totalSize: 0 }
    typeMap.set(type, {
      count: existing.count + 1,
      totalSize: existing.totalSize + record.fileSize
    })
  })

  const fileTypes: FileTypeStats[] = Array.from(typeMap.entries())
    .map(([type, stats]) => ({
      type,
      count: stats.count,
      totalSize: stats.totalSize,
      percentage: (stats.count / totalTransfers) * 100
    }))
    .sort((a, b) => b.count - a.count)

  // Size metrics
  const averageFileSize = totalDataTransferred / totalTransfers
  const sortedBySize = [...history].sort((a, b) => b.fileSize - a.fileSize)
  const largestTransfer = sortedBySize[0] ? {
    fileName: sortedBySize[0].fileName,
    size: sortedBySize[0].fileSize
  } : null
  const smallestTransfer = sortedBySize[sortedBySize.length - 1] ? {
    fileName: sortedBySize[sortedBySize.length - 1].fileName,
    size: sortedBySize[sortedBySize.length - 1].fileSize
  } : null

  // Daily stats
  const dailyMap = new Map<string, { sent: number; received: number; totalSize: number }>()
  history.forEach(record => {
    const date = new Date(record.timestamp).toISOString().split('T')[0]
    const existing = dailyMap.get(date) || { sent: 0, received: 0, totalSize: 0 }
    dailyMap.set(date, {
      sent: existing.sent + (record.direction === 'sent' ? 1 : 0),
      received: existing.received + (record.direction === 'received' ? 1 : 0),
      totalSize: existing.totalSize + record.fileSize
    })
  })

  const dailyStats: DailyTransferStats[] = Array.from(dailyMap.entries())
    .map(([date, stats]) => ({
      date,
      sent: stats.sent,
      received: stats.received,
      totalSize: stats.totalSize
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Peak day
  const peakDay = dailyStats.length > 0
    ? dailyStats.reduce((max, day) =>
        (day.sent + day.received) > (max.sent + max.received) ? day : max
      ).date
    : null

  // Time-based metrics
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const last7Days = history.filter(r => now - r.timestamp <= 7 * day).length
  const last30Days = history.filter(r => now - r.timestamp <= 30 * day).length

  // Week and month calculations
  const startOfWeek = new Date()
  startOfWeek.setHours(0, 0, 0, 0)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const thisWeek = history.filter(r => r.timestamp >= startOfWeek.getTime()).length

  const startOfMonth = new Date()
  startOfMonth.setHours(0, 0, 0, 0)
  startOfMonth.setDate(1)
  const thisMonth = history.filter(r => r.timestamp >= startOfMonth.getTime()).length

  return {
    totalTransfers,
    totalDataTransferred,
    successRate,
    failureRate,
    sentCount,
    receivedCount,
    sentData,
    receivedData,
    fileTypes,
    averageFileSize,
    largestTransfer,
    smallestTransfer,
    dailyStats,
    peakDay,
    last7Days,
    last30Days,
    thisWeek,
    thisMonth
  }
}
