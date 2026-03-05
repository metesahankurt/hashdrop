'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Copy, Check, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface QrScannerProps {
  onCodeScanned: (code: string) => void
  onClose: () => void
}

export function QrScanner({ onCodeScanned, onClose }: QrScannerProps) {
  const [status, setStatus] = useState<'loading' | 'scanning' | 'result' | 'error'>('loading')
  const [result, setResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const scannerRef = useRef<unknown>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scanner = scannerRef.current as any
        if (scanner.isScanning) {
          await scanner.stop()
        }
        scanner.clear()
      } catch {
        // ignore cleanup errors
      }
      scannerRef.current = null
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    const startScanner = async () => {
      try {
        // Dynamically import html5-qrcode to avoid SSR issues
        const { Html5Qrcode } = await import('html5-qrcode')
        if (!mountedRef.current || !containerRef.current) return

        const scannerId = 'qr-scanner-container'
        const scanner = new Html5Qrcode(scannerId)
        scannerRef.current = scanner

        setStatus('scanning')

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            if (!mountedRef.current) return
            stopScanner()
            setResult(decodedText)
            setStatus('result')

            // Extract call code from URL if present
            try {
              const url = new URL(decodedText)
              const code = url.searchParams.get('code')
              if (code) {
                onCodeScanned(code)
                return
              }
            } catch {
              // Not a URL — treat as raw code
            }

            // If it looks like a call code (words like Cosmic-Falcon)
            if (/^[A-Z][a-z]+-[A-Z][a-z]+$/.test(decodedText)) {
              onCodeScanned(decodedText)
            }
          },
          () => { /* ignore per-frame errors */ }
        )
      } catch (err) {
        console.error('[QrScanner] Start error:', err)
        if (mountedRef.current) setStatus('error')
      }
    }

    startScanner()

    return () => {
      mountedRef.current = false
      stopScanner()
    }
  }, [stopScanner, onCodeScanned])

  const handleClose = useCallback(() => {
    stopScanner()
    onClose()
  }, [stopScanner, onClose])

  const copyResult = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={handleClose}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-sm mx-4 glass-card rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">QR Tarayıcı</span>
            </div>
            <button onClick={handleClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
              <X className="w-4 h-4 text-muted" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {status === 'loading' && (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {status === 'scanning' && (
              <div className="relative">
                {/* Scanner container */}
                <div
                  id="qr-scanner-container"
                  ref={containerRef}
                  className="w-full rounded-xl overflow-hidden bg-black"
                  style={{ minHeight: 280 }}
                />
                {/* Viewfinder overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-52 h-52">
                    {/* Corners */}
                    {[
                      'top-0 left-0 border-t-2 border-l-2',
                      'top-0 right-0 border-t-2 border-r-2',
                      'bottom-0 left-0 border-b-2 border-l-2',
                      'bottom-0 right-0 border-b-2 border-r-2',
                    ].map((cls, i) => (
                      <div key={i} className={`absolute w-6 h-6 border-primary ${cls} rounded-sm`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted text-center mt-3">Kamerayı QR koda tutun</p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-10 space-y-3">
                <Camera className="w-10 h-10 text-danger mx-auto" />
                <p className="text-sm text-muted">Kamera erişimi sağlanamadı. Lütfen izin verin.</p>
                <button onClick={handleClose} className="glass-btn-primary px-4 py-2 text-sm rounded-xl">
                  Kapat
                </button>
              </div>
            )}

            {status === 'result' && result && (
              <div className="space-y-3">
                <div className="glass-card rounded-xl p-3">
                  <p className="text-xs text-muted mb-1">Taranan içerik</p>
                  <p className="text-sm text-foreground break-all font-mono">{result}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyResult} className="flex-1 glass-btn rounded-xl py-2 text-sm flex items-center justify-center gap-2">
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Kopyalandı' : 'Kopyala'}
                  </button>
                  {result.startsWith('http') && (
                    <a
                      href={result}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 glass-btn rounded-xl py-2 text-sm flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Aç
                    </a>
                  )}
                </div>
                <button onClick={handleClose} className="w-full glass-btn-primary py-2 rounded-xl text-sm">
                  Kapat
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
