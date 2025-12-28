/**
 * Better error handling for P2P connections
 * Provides actionable error messages to users
 */

import { notifyError } from './notifications'
import { getPreferences } from './preferences'

export type ErrorType =
  | 'peer-unavailable'
  | 'connection-failed'
  | 'network-error'
  | 'transfer-interrupted'
  | 'browser-incompatible'
  | 'peer-disconnected'
  | 'hash-mismatch'
  | 'file-too-large'
  | 'unknown'

export interface ErrorDetails {
  type: ErrorType
  title: string
  message: string
  actionable: string
  duration?: number
}

export function getErrorDetails(error: unknown, context?: string): ErrorDetails {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorName = error instanceof Error ? error.name : ''

  // Peer unavailable (most common)
  if (errorMessage.includes('Could not connect to peer') ||
      errorMessage.includes('peer unavailable') ||
      errorName === 'unavailable-id') {
    return {
      type: 'peer-unavailable',
      title: 'Peer Not Found',
      message: 'The other person is not online or the code has expired',
      actionable: 'Ask them to refresh and share a new code',
      duration: 5000
    }
  }

  // Network/firewall issues
  if (errorMessage.includes('network') ||
      errorMessage.includes('ice') ||
      errorMessage.includes('failed to connect')) {
    return {
      type: 'connection-failed',
      title: 'Connection Failed',
      message: 'Unable to establish peer connection',
      actionable: 'Check your firewall settings or try a different network',
      duration: 6000
    }
  }

  // Peer disconnected mid-transfer
  if (errorMessage.includes('disconnected') ||
      errorMessage.includes('closed') ||
      context === 'transfer-interrupted') {
    return {
      type: 'peer-disconnected',
      title: 'Connection Lost',
      message: 'The other peer disconnected',
      actionable: 'Ask them to reconnect and try again',
      duration: 5000
    }
  }

  // Browser compatibility
  if (errorMessage.includes('not supported') ||
      errorMessage.includes('PeerJS')) {
    return {
      type: 'browser-incompatible',
      title: 'Browser Not Supported',
      message: 'Your browser doesn\'t support P2P connections',
      actionable: 'Try using Chrome, Firefox, or Edge',
      duration: 7000
    }
  }

  // Hash verification failed
  if (context === 'hash-mismatch') {
    return {
      type: 'hash-mismatch',
      title: 'File Verification Failed',
      message: 'The received file is corrupted or tampered',
      actionable: 'Do not use this file. Request sender to resend',
      duration: Infinity // Requires user dismissal
    }
  }

  // File too large
  if (context === 'file-too-large') {
    return {
      type: 'file-too-large',
      title: 'File Too Large',
      message: 'This file may be too large for browser memory',
      actionable: 'Try files under 2GB for best results',
      duration: 6000
    }
  }

  // Generic fallback
  return {
    type: 'unknown',
    title: 'Transfer Failed',
    message: errorMessage || 'An unexpected error occurred',
    actionable: 'Please try again or refresh the page',
    duration: 5000
  }
}

export function formatErrorForToast(error: unknown, context?: string): {
  title: string
  description: string
  duration: number
} {
  const details = getErrorDetails(error, context)
  const prefs = getPreferences()

  // Send browser notification for critical errors (if enabled)
  const isCritical = details.type === 'hash-mismatch' || details.type === 'peer-disconnected'
  if (isCritical && prefs.errorNotifications) {
    notifyError(
      details.title,
      details.message,
      details.actionable,
      details.duration === Infinity
    )
  }

  return {
    title: details.title,
    description: `${details.message}\n💡 ${details.actionable}`,
    duration: details.duration || 5000
  }
}

// Helper to show both toast and notification
export function showError(error: unknown, context?: string) {
  const details = getErrorDetails(error, context)
  const prefs = getPreferences()

  // Send browser notification for errors (if enabled)
  if (prefs.errorNotifications) {
    notifyError(
      details.title,
      details.message,
      details.actionable,
      details.duration === Infinity
    )
  }

  // Return toast info
  return formatErrorForToast(error, context)
}

// Connection quality thresholds
export const CONNECTION_QUALITY = {
  EXCELLENT: { rtt: 50, packetLoss: 0.01 },
  GOOD: { rtt: 150, packetLoss: 0.05 },
  FAIR: { rtt: 300, packetLoss: 0.1 },
  POOR: { rtt: 500, packetLoss: 0.2 }
} as const

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'

export function getConnectionQuality(rtt: number, packetLoss: number): ConnectionQuality {
  if (rtt <= CONNECTION_QUALITY.EXCELLENT.rtt && packetLoss <= CONNECTION_QUALITY.EXCELLENT.packetLoss) {
    return 'excellent'
  }
  if (rtt <= CONNECTION_QUALITY.GOOD.rtt && packetLoss <= CONNECTION_QUALITY.GOOD.packetLoss) {
    return 'good'
  }
  if (rtt <= CONNECTION_QUALITY.FAIR.rtt && packetLoss <= CONNECTION_QUALITY.FAIR.packetLoss) {
    return 'fair'
  }
  if (rtt <= CONNECTION_QUALITY.POOR.rtt && packetLoss <= CONNECTION_QUALITY.POOR.packetLoss) {
    return 'poor'
  }
  return 'poor'
}

export function getQualityColor(quality: ConnectionQuality): string {
  switch (quality) {
    case 'excellent':
      return 'text-green-500'
    case 'good':
      return 'text-green-400'
    case 'fair':
      return 'text-yellow-500'
    case 'poor':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

export function getQualityLabel(quality: ConnectionQuality): string {
  switch (quality) {
    case 'excellent':
      return 'Excellent'
    case 'good':
      return 'Good'
    case 'fair':
      return 'Fair'
    case 'poor':
      return 'Poor'
    default:
      return 'Unknown'
  }
}
