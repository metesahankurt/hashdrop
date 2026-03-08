"use client"

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Send, ArrowRight, QrCode, ScanLine,
  Copy, Check, Clock, RefreshCw, AlertCircle,
  FileUp, Users, Zap
} from 'lucide-react'
import { useWarpStore } from '@/store/use-warp-store'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { generateSecureCode, isValidCode } from '@/lib/code-generator'
import { getPreferences } from '@/lib/preferences'
import { QRCodeDisplay } from './qr-code-display'
import { ErrorRecoveryModal } from '@/components/ui/error-recovery-modal'

type FlowStep = 'select-mode' | 'upload' | 'share-code' | 'enter-code' | 'connecting' | 'transferring'
type ShareMode = 'file' | 'text'
type ErrorType = 'network' | 'peer' | 'timeout' | 'ice' | 'general' | null

interface UnifiedTransferFlowProps {
  initialAction?: 'create' | 'join'
  onFilesSelected?: (files: File[]) => void
  onModeChange?: (mode: 'send' | 'receive') => void
}

const CODE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

export function UnifiedTransferFlow({ initialAction, onFilesSelected, onModeChange }: UnifiedTransferFlowProps) {
  const { files, setFiles, status, setMode, setCodeExpiry, codeExpiry, addLog, textContent, setTextContent, error } = useWarpStore()

  // Derive initial step from initialAction (skip select-mode if already chosen)
  const initialStep: FlowStep = initialAction === 'create'
    ? 'upload'
    : initialAction === 'join'
    ? 'enter-code'
    : 'select-mode'

  const [currentStep, setCurrentStep] = useState<FlowStep>(initialStep)
  const [isCopied, setIsCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string>('')
  const [inputCode, setInputCode] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [shareMode, setShareMode] = useState<ShareMode>('file')
  const [textInput, setTextInput] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorType, setErrorType] = useState<ErrorType>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  // One-time initialization: set store mode based on initialAction (skips select-mode)
  const initializedRef = useState(() => {
    if (initialAction === 'create') {
      setTimeout(() => setMode('send'), 0)
    } else if (initialAction === 'join') {
      setTimeout(() => setMode('receive'), 0)
    }
    return true
  })[0]
  void initializedRef // used only for initialization side-effect

  // Generate code when files are uploaded
  const generateAndSetCode = useCallback(() => {
    const newCode = generateSecureCode()
    const expiry = Date.now() + CODE_EXPIRY_MS

    setGeneratedCode(newCode)
    setCodeExpiry(expiry)

    // Auto-copy if enabled
    const preferences = getPreferences()
    if (preferences.autoCopyCode) {
      navigator.clipboard.writeText(newCode).then(() => {
        toast.success('Code copied to clipboard!', { duration: 2000 })
      }).catch(() => {
        // Silent fail
      })
    }

    addLog(`Generated transfer code: ${newCode}`, 'success')
    return newCode
  }, [setCodeExpiry, addLog])

  // File drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    // Validate file sizes
    const largeFiles = acceptedFiles.filter(f => f.size > 2 * 1024 * 1024 * 1024) // 2GB
    if (largeFiles.length > 0) {
      toast.error('File Too Large', {
        description: 'Files over 2GB may fail to transfer. Please use smaller files.',
        duration: 5000
      })
      return
    }

    setFiles(acceptedFiles)
    setMode('send')
    generateAndSetCode()
    setCurrentStep('share-code')
    onFilesSelected?.(acceptedFiles)

    const totalSize = acceptedFiles.reduce((sum, f) => sum + f.size, 0)
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2)
    toast.success(`${acceptedFiles.length} file(s) ready (${sizeInMB} MB)`)
  }, [setFiles, setMode, onFilesSelected, generateAndSetCode])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    noClick: currentStep !== 'upload',
    disabled: status !== 'idle' && status !== 'ready'
  })

  // Countdown timer for code expiry
  useEffect(() => {
    if (!codeExpiry) return

    const interval = setInterval(() => {
      const remaining = codeExpiry - Date.now()
      if (remaining <= 0) {
        setTimeLeft(0)
        toast.error('Code expired! Generate a new code.')
        addLog('Transfer code expired', 'warning')
      } else {
        setTimeLeft(Math.ceil(remaining / 1000)) // seconds
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [codeExpiry, addLog])

  // Monitor errors from store and show recovery modal
  useEffect(() => {
    if (!error) return

    // Determine error type based on error message
    const errorLower = error.toLowerCase()

    let detectedType: ErrorType = 'general'
    const customMessage = error

    if (errorLower.includes('network') || errorLower.includes('connection lost')) {
      detectedType = 'network'
    } else if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
      detectedType = 'timeout'
    } else if (errorLower.includes('peer') || errorLower.includes('unavailable-id') || errorLower.includes('already in use')) {
      detectedType = 'peer'
    } else if (errorLower.includes('ice') || errorLower.includes('failed to establish')) {
      detectedType = 'ice'
    }

    setTimeout(() => {
      setErrorType(detectedType)
      setErrorMessage(customMessage)
      setShowErrorModal(true)
    }, 0)

    addLog(`Error detected: ${error}`, 'error')
  }, [error, addLog])

  // Handle error recovery
  const handleRetry = useCallback(() => {
    setShowErrorModal(false)
    setErrorType(null)
    setErrorMessage('')

    // Refresh the page for network errors
    if (errorType === 'network') {
      addLog('Retrying connection...', 'info')
      window.location.reload()
    } else {
      // For other errors, reset to initial state
      addLog('Resetting connection...', 'info')
      setCurrentStep('select-mode')
      setMode(null)
      setFiles([])
      setGeneratedCode('')
      toast.info('Ready to try again')
    }
  }, [errorType, addLog, setMode, setFiles])

  const handleCloseError = useCallback(() => {
    setShowErrorModal(false)
    // Don't clear error from store, just hide modal
  }, [])

  // Handle text/link share
  const handleTextShare = () => {
    if (!textInput.trim()) {
      toast.error('Please enter text or a link')
      return
    }

    setTextContent(textInput)
    setMode('send')
    generateAndSetCode()
    setCurrentStep('share-code')
    addLog(`Text content ready to share (${textInput.length} chars)`, 'success')
    toast.success('Text ready to share!')
  }

  // Handle mode selection
  const handleSendMode = () => {
    setMode('send')
    setCurrentStep('upload')
    onModeChange?.('send')
    addLog('Send mode selected', 'info')
  }

  const handleReceiveMode = () => {
    setMode('receive')
    setCurrentStep('enter-code')
    onModeChange?.('receive')
    addLog('Receive mode selected', 'info')
  }

  const handleBack = () => {
    if (currentStep === 'upload' || currentStep === 'enter-code') {
      setCurrentStep('select-mode')
      setMode(null)
      setFiles([])
      addLog('Returned to mode selection', 'info')
    } else if (currentStep === 'share-code') {
      setCurrentStep('upload')
      setFiles([])
      addLog('Returned to file selection', 'info')
    }
  }

  // Copy code handler
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true)
      toast.success('Code copied!')
      addLog('Transfer code copied to clipboard', 'info')
      setTimeout(() => setIsCopied(false), 2000)
    }).catch(() => {
      toast.error('Failed to copy code')
    })
  }

  // Refresh code handler
  const handleRefreshCode = () => {
    generateAndSetCode()
    setIsCopied(false)
    toast.success('New code generated!')
  }

  // Handle code input and validation
  const handleConnectWithCode = () => {
    const trimmedCode = inputCode.trim()

    if (!trimmedCode) {
      toast.error('Please enter a transfer code')
      return
    }

    if (!isValidCode(trimmedCode)) {
      toast.error('Invalid code format', {
        description: 'Code should be in format: ADJECTIVE-NOUN (e.g., COSMIC-FALCON)'
      })
      return
    }

    addLog(`Attempting to connect with code: ${trimmedCode}`, 'info')
    setCurrentStep('connecting')
    // Connection logic will be handled by parent component
  }

  // Update step based on status
  useEffect(() => {
    if (status === 'connecting') setTimeout(() => setCurrentStep('connecting'), 0)
    if (status === 'transferring') setTimeout(() => setCurrentStep('transferring'), 0)
  }, [status])

  // Format time left
  const formatTimeLeft = (seconds: number | null): string => {
    if (seconds === null) return '5:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {/* Step 1: Select Mode */}
        {currentStep === 'select-mode' && (
          <motion.div
            key="select-mode"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Send Option */}
            <button
              onClick={handleSendMode}
              className="w-full glass-card-hover rounded-2xl p-5 md:p-8 text-left group touch-manipulation active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Send className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                      Send Files
                    </h3>
                    <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm md:text-base text-muted leading-relaxed">
                    Upload files and share a secure code with your recipient
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted bg-white/5 px-2.5 py-1 rounded-full">
                      <Zap className="w-3 h-3" />
                      No size limits
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted bg-white/5 px-2.5 py-1 rounded-full">
                      <FileUp className="w-3 h-3" />
                      Multiple files
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {/* Receive Option */}
            <button
              onClick={handleReceiveMode}
              className="w-full glass-card-hover rounded-2xl p-5 md:p-8 text-left group touch-manipulation active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                      Receive Files
                    </h3>
                    <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm md:text-base text-muted leading-relaxed">
                    Enter the sender&apos;s code or scan their QR code
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted bg-white/5 px-2.5 py-1 rounded-full">
                      <QrCode className="w-3 h-3" />
                      QR support
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted bg-white/5 px-2.5 py-1 rounded-full">
                      <Zap className="w-3 h-3" />
                      Instant connect
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        )}

        {/* Step 2: Upload Files or Text */}
        {currentStep === 'upload' && (
          <motion.div
            key="upload"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Back button */}
            <button
              onClick={handleBack}
              className="text-sm text-muted hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to options
            </button>

            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 glass-card rounded-xl">
              <button
                onClick={() => setShareMode('file')}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                  shareMode === 'file'
                    ? 'bg-primary text-background'
                    : 'text-muted hover:text-foreground'
                )}
              >
                <FileUp className="w-4 h-4 inline mr-2" />
                Files
              </button>
              <button
                onClick={() => setShareMode('text')}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                  shareMode === 'text'
                    ? 'bg-primary text-background'
                    : 'text-muted hover:text-foreground'
                )}
              >
                <Send className="w-4 h-4 inline mr-2" />
                Text/Link
              </button>
            </div>

            {/* File Upload */}
            {shareMode === 'file' && (
              <div
                {...getRootProps()}
                className={cn(
                  "relative group cursor-pointer rounded-2xl glass-card-hover",
                  "p-8 md:p-12 text-center",
                  "border-2 border-dashed transition-all",
                  isDragActive && "border-primary/50 bg-primary/5"
                )}
              >
                <input {...getInputProps()} />

                <div className="space-y-4">
                  {/* Icon */}
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Upload className={cn(
                      "w-8 h-8 md:w-10 md:h-10 text-primary transition-transform",
                      isDragActive && "scale-110"
                    )} />
                  </div>

                  {/* Text */}
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                      {isDragActive ? "Drop files here" : "Choose files to send"}
                    </h3>
                    <p className="text-sm md:text-base text-muted max-w-md mx-auto">
                      Click to browse or drag and drop • Multiple files & folders supported
                    </p>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    <span className="text-xs text-muted bg-white/5 px-3 py-1.5 rounded-full">
                      Up to 10GB per file
                    </span>
                    <span className="text-xs text-muted bg-white/5 px-3 py-1.5 rounded-full">
                      Unlimited files
                    </span>
                    <span className="text-xs text-muted bg-white/5 px-3 py-1.5 rounded-full">
                      All file types
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Text/Link Share */}
            {shareMode === 'text' && (
              <div className="glass-card rounded-2xl p-6 md:p-8 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                    Share text or link
                  </h3>
                  <p className="text-sm md:text-base text-muted">
                    Send a message, note, or URL instantly
                  </p>
                </div>

                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste your text, note, or link here..."
                  className="glass-input w-full min-h-[160px] resize-none"
                  autoFocus
                />

                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{textInput.length} characters</span>
                  {textInput.length > 10000 && (
                    <span className="text-yellow-500">Large text may be slow</span>
                  )}
                </div>

                <button
                  onClick={handleTextShare}
                  disabled={!textInput.trim()}
                  className="glass-btn-primary w-full flex items-center justify-center gap-2 py-3 md:py-4 touch-manipulation active:scale-95 transition-transform disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Continue
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Share Code (after upload) */}
        {currentStep === 'share-code' && (
          <motion.div
            key="share-code"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Content summary */}
            <div className="glass-card rounded-xl p-4 border-primary/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Ready to send</p>
                  {files.length > 0 ? (
                    <p className="text-base font-semibold text-foreground">
                      {files.length} file{files.length !== 1 ? 's' : ''} • {
                        ((files.reduce((sum, f) => sum + f.size, 0)) / (1024 * 1024)).toFixed(2)
                      } MB
                    </p>
                  ) : textContent ? (
                    <p className="text-base font-semibold text-foreground">
                      Text message • {textContent.length} characters
                    </p>
                  ) : (
                    <p className="text-base font-semibold text-foreground">
                      Content ready
                    </p>
                  )}
                </div>
                <button
                  onClick={handleBack}
                  className="text-xs text-muted hover:text-foreground transition-colors"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Share code card */}
            <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
              {/* Title */}
              <div className="text-center space-y-2">
                <h3 className="text-2xl md:text-3xl font-semibold text-foreground">
                  Share this code
                </h3>
                <p className="text-sm md:text-base text-muted">
                  Send this code to your recipient via chat or message
                </p>
              </div>

              {/* Code display */}
              <div className="relative">
                <div className="glass-card rounded-xl p-6 text-center border-primary/30 bg-primary/5">
                  <div className="text-3xl md:text-4xl font-bold text-primary tracking-wider font-mono uppercase">
                    {generatedCode || 'LOADING...'}
                  </div>
                </div>

                {/* Timer */}
                <div className={cn(
                  "absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-3 py-1 rounded-full border flex items-center gap-1.5",
                  timeLeft !== null && timeLeft < 60 ? 'border-danger text-danger' : 'border-border'
                )}>
                  <Clock className="w-3 h-3" />
                  <span className="text-xs font-medium">{formatTimeLeft(timeLeft)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCopyCode(generatedCode)}
                  disabled={!generatedCode}
                  className="glass-btn-primary flex items-center justify-center gap-2 disabled:opacity-50 py-3 md:py-4 touch-manipulation active:scale-95 transition-transform"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowQR(true)}
                  disabled={!generatedCode}
                  className="glass-btn flex items-center justify-center gap-2 disabled:opacity-50 py-3 md:py-4 touch-manipulation active:scale-95 transition-transform"
                >
                  <QrCode className="w-4 h-4" />
                  Show QR
                </button>
              </div>

              {/* Refresh code */}
              <button
                onClick={handleRefreshCode}
                disabled={!generatedCode}
                className="w-full text-sm text-muted hover:text-foreground transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Generate new code
              </button>

              {/* Status */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted pt-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                Waiting for recipient to connect...
              </div>
            </div>

            {/* QR Code Modal */}
            <AnimatePresence>
              {showQR && generatedCode && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setShowQR(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="glass-card rounded-2xl p-6 md:p-8 max-w-md w-full space-y-4"
                  >
                    <div className="text-center space-y-2">
                      <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                        Scan QR Code
                      </h3>
                      <p className="text-sm text-muted">
                        Recipient can scan this to connect instantly
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <QRCodeDisplay
                        code={generatedCode}
                        size={240}
                        url={`${typeof window !== 'undefined' ? window.location.origin : 'https://hashdrop.metesahankurt.cloud'}?code=${generatedCode}&mode=transfer`}
                      />
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-mono text-primary font-semibold">
                        {generatedCode}
                      </p>
                    </div>

                    <button
                      onClick={() => setShowQR(false)}
                      className="glass-btn w-full py-3 touch-manipulation"
                    >
                      Close
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Step 4: Enter Code (Receive) */}
        {currentStep === 'enter-code' && (
          <motion.div
            key="enter-code"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Back button */}
            <button
              onClick={handleBack}
              className="text-sm text-muted hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to options
            </button>

            {/* Enter code card */}
            <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
              {/* Title */}
              <div className="text-center space-y-2">
                <h3 className="text-2xl md:text-3xl font-semibold text-foreground">
                  Enter transfer code
                </h3>
                <p className="text-sm md:text-base text-muted">
                  Type the code shared by the sender
                </p>
              </div>

              {/* Input */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="e.g. COSMIC-FALCON"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnectWithCode()}
                  className="glass-input w-full text-center text-base md:text-lg lg:text-xl font-mono uppercase tracking-wider px-3 py-3 md:py-4"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck="false"
                  inputMode="text"
                />

                <button
                  className="glass-btn-primary w-full flex items-center justify-center gap-2 py-3 md:py-4"
                  onClick={handleConnectWithCode}
                  disabled={!inputCode.trim()}
                >
                  <Send className="w-4 h-4" />
                  Connect
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted">or</span>
                </div>
              </div>

              {/* QR Scan */}
              <button
                className="glass-btn w-full flex items-center justify-center gap-2 py-3 md:py-4 touch-manipulation active:scale-95 transition-transform"
                onClick={() => toast.info('QR Scanner opening...')}
              >
                <ScanLine className="w-4 h-4" />
                Scan QR Code
              </button>

              {/* Info */}
              <div className="flex items-start gap-2 text-xs text-muted bg-white/5 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  The sender must be ready and waiting for your connection. Codes expire after 5 minutes.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5: Connecting */}
        {currentStep === 'connecting' && (
          <motion.div
            key="connecting"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="glass-card rounded-2xl p-8 md:p-12 text-center space-y-6"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-foreground">
                Establishing connection...
              </h3>
              <p className="text-sm text-muted max-w-md mx-auto">
                Setting up secure peer-to-peer link. This may take a few seconds.
              </p>
            </div>

            <div className="text-xs text-muted">
              Using WebRTC with end-to-end encryption
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Recovery Modal */}
      <ErrorRecoveryModal
        isOpen={showErrorModal}
        errorType={errorType || 'general'}
        errorMessage={errorMessage}
        onRetry={handleRetry}
        onClose={handleCloseError}
        autoRetrySeconds={errorType === 'network' ? 5 : 0}
      />
    </div>
  )
}
