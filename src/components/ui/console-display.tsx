"use client"

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useWarpStore } from '@/store/use-warp-store'
import { cn } from '@/lib/utils'

export function ConsoleDisplay() {
  const { consoleLogs } = useWarpStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs appear
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is updated
    const scrollToBottom = () => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
      // Fallback: also set scrollTop
      if (scrollRef.current) {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }
        })
      }
    }

    scrollToBottom()
  }, [consoleLogs])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full glass-card rounded-xl p-4 mb-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">System Status</h3>
        {consoleLogs.length > 0 && (
          <span className="ml-auto text-[10px] text-muted/50 font-mono">
            {consoleLogs.length} event{consoleLogs.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Console Log Display */}
      {consoleLogs.length === 0 ? (
        <div className="flex items-center justify-center py-4 text-xs text-muted/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
            <span>Waiting for activity...</span>
          </div>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
        >
        <AnimatePresence initial={false}>
          {consoleLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={cn(
                "flex items-start gap-2 text-xs px-2 py-1.5 rounded-md",
                "border border-transparent transition-all",
                log.type === 'success' && "bg-success/10 border-success/20",
                log.type === 'error' && "bg-danger/10 border-danger/20",
                log.type === 'warning' && "bg-warning/10 border-warning/20",
                log.type === 'info' && "bg-primary/5 border-primary/10"
              )}
            >
              {/* Icon */}
              <LogIcon type={log.type} />

              {/* Message */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-mono break-words",
                  log.type === 'success' && "text-success",
                  log.type === 'error' && "text-danger",
                  log.type === 'warning' && "text-warning",
                  log.type === 'info' && "text-muted"
                )}>
                  {log.message}
                </p>
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-muted/50 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {/* Invisible element to scroll to */}
        <div ref={bottomRef} />
        </div>
      )}

      {/* Helpful hint for errors */}
      {consoleLogs.some(log => log.type === 'error') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-border/30"
        >
          <p className="text-xs text-muted flex items-center gap-2">
            <Info className="w-3 h-3" />
            <span>If you encounter connection issues, try refreshing the page</span>
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

function LogIcon({ type }: { type: 'info' | 'success' | 'warning' | 'error' }) {
  const iconClass = "w-3.5 h-3.5 shrink-0"

  switch (type) {
    case 'success':
      return <CheckCircle2 className={`${iconClass} text-success`} />
    case 'error':
      return <AlertCircle className={`${iconClass} text-danger`} />
    case 'warning':
      return <AlertTriangle className={`${iconClass} text-warning`} />
    case 'info':
    default:
      return <Info className={`${iconClass} text-primary`} />
  }
}
