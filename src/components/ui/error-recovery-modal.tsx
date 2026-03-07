"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, RefreshCw, X, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ErrorRecoveryModalProps {
  isOpen: boolean
  errorType: 'network' | 'peer' | 'timeout' | 'ice' | 'general'
  errorMessage?: string
  onRetry?: () => void
  onClose?: () => void
  autoRetrySeconds?: number
}

const errorConfig = {
  network: {
    icon: WifiOff,
    title: 'Network Connection Lost',
    description: 'Unable to connect to the peer network. Please check your internet connection.',
    color: 'text-danger',
    canRetry: true,
    autoRetry: true
  },
  peer: {
    icon: AlertTriangle,
    title: 'Peer Connection Failed',
    description: 'Could not establish connection with the peer. The code may be invalid or expired.',
    color: 'text-yellow-500',
    canRetry: true,
    autoRetry: false
  },
  timeout: {
    icon: AlertTriangle,
    title: 'Connection Timeout',
    description: 'Connection attempt timed out. The other party may not be online.',
    color: 'text-yellow-500',
    canRetry: true,
    autoRetry: false
  },
  ice: {
    icon: Wifi,
    title: 'Connection Error',
    description: 'Failed to establish peer-to-peer connection. This may be due to firewall or network restrictions.',
    color: 'text-yellow-500',
    canRetry: true,
    autoRetry: false
  },
  general: {
    icon: AlertTriangle,
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again.',
    color: 'text-danger',
    canRetry: true,
    autoRetry: false
  }
}

export function ErrorRecoveryModal({
  isOpen,
  errorType,
  errorMessage,
  onRetry,
  onClose,
  autoRetrySeconds = 5
}: ErrorRecoveryModalProps) {
  const [countdown, setCountdown] = useState(autoRetrySeconds)
  const config = errorConfig[errorType]
  const Icon = config.icon

  // Auto-retry countdown
  useEffect(() => {
    if (!isOpen || !config.autoRetry) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onRetry?.()
          return autoRetrySeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, config.autoRetry, onRetry, autoRetrySeconds])

  // Reset countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setCountdown(autoRetrySeconds)
    }
  }, [isOpen, autoRetrySeconds])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="glass-card rounded-2xl p-6 md:p-8 max-w-md w-full space-y-6 relative"
          >
            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-danger/10 border-2 border-danger/20 flex items-center justify-center">
                <Icon className={`w-8 h-8 ${config.color}`} />
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-2">
              <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                {config.title}
              </h3>
              <p className="text-sm md:text-base text-muted leading-relaxed">
                {errorMessage || config.description}
              </p>
            </div>

            {/* Technical details (if any) */}
            {errorMessage && errorMessage !== config.description && (
              <div className="glass-card rounded-lg p-3 bg-white/5">
                <p className="text-xs text-muted font-mono break-words">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Actions */}
            {config.canRetry && (
              <div className="space-y-3">
                {/* Auto-retry indicator */}
                {config.autoRetry && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Retrying in {countdown} seconds...</span>
                  </div>
                )}

                {/* Manual retry button */}
                <button
                  onClick={onRetry}
                  className="glass-btn-primary w-full flex items-center justify-center gap-2 py-3 md:py-4 touch-manipulation active:scale-95 transition-transform"
                >
                  <RefreshCw className="w-4 h-4" />
                  {config.autoRetry ? 'Retry Now' : 'Try Again'}
                </button>

                {/* Alternative action */}
                {onClose && (
                  <button
                    onClick={onClose}
                    className="glass-btn w-full py-3 touch-manipulation"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}

            {/* Help text */}
            <div className="text-center">
              <p className="text-xs text-muted">
                If the problem persists, try refreshing the page or check your network connection
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
