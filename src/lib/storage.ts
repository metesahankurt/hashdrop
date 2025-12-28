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
