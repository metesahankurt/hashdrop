"use client"

import { useEffect, useState } from 'react'
import { useWarpStore } from '@/store/use-warp-store'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { calculateFileHash, formatHashPreview } from '@/lib/file-hash'
import { requestNotificationPermission, notifyTransferComplete, notifyTransferFailed } from '@/lib/notifications'
import { addTransferRecord } from '@/lib/storage'
import { createZipFromFiles, shouldZipFiles } from '@/lib/zip-utils'
import { isImageFile, createImagePreviewUrl } from '@/lib/file-utils'
import { ImagePreviewModal } from '@/components/ui/image-preview-modal'
import { formatErrorForToast } from '@/lib/error-handler'
import { getPreferences } from '@/lib/preferences'

export function TransferStatus() {
  const {
    status, conn, file, files, progress, setProgress, setStatus, isPeerReady, mode,
    readyToDownload, setReadyToDownload, setFile, setFileHash, fileHash, error,
    transferStartTime, transferredBytes, transferSpeed, setTransferSpeed,
    setTransferStartTime, setTransferredBytes, textContent
  } = useWarpStore()

  const [eta, setEta] = useState<number | null>(null)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  // Calculate transfer speed and ETA
  useEffect(() => {
    if (status !== 'transferring' || !transferStartTime || !file) {
      setTransferSpeed(0)
      setEta(null)
      return
    }

    const interval = setInterval(() => {
      const elapsedSeconds = (Date.now() - transferStartTime) / 1000
      if (elapsedSeconds > 0) {
        // Speed in MB/s
        const speed = (transferredBytes / (1024 * 1024)) / elapsedSeconds
        setTransferSpeed(speed)

        // Calculate ETA
        if (speed > 0) {
          const remainingBytes = file.size - transferredBytes
          const remainingSeconds = remainingBytes / (speed * 1024 * 1024)
          setEta(remainingSeconds)
        }
      }
    }, 500) // Update every 500ms

    return () => clearInterval(interval)
  }, [status, transferStartTime, transferredBytes, file, setTransferSpeed])

  // Request notification permission on first transfer
  useEffect(() => {
    if (status === 'transferring') {
      requestNotificationPermission()
    }
  }, [status])

  // Auto-download when file is ready and preference is enabled
  useEffect(() => {
    if (readyToDownload && mode === 'receive' && status === 'completed') {
      const prefs = getPreferences()
      if (prefs.autoDownload) {
        // Small delay to ensure UI updates first
        setTimeout(() => {
          handleDownload()
          toast.info('File downloaded automatically')
        }, 500)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToDownload, mode, status])

  // Notify and track on transfer complete or failed
  useEffect(() => {
    if (status === 'completed' && file && fileHash) {
      notifyTransferComplete(file.name, mode === 'send')

      // Add to history
      addTransferRecord({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        direction: mode === 'send' ? 'sent' : 'received',
        hashPreview: formatHashPreview(fileHash),
        success: error === null
      })
    } else if (status === 'failed' && file) {
      notifyTransferFailed(file.name)

      // Add failed transfer to history
      if (fileHash) {
        addTransferRecord({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          direction: mode === 'send' ? 'sent' : 'received',
          hashPreview: formatHashPreview(fileHash),
          success: false
        })
      }
    }
  }, [status, file, mode, fileHash, error])

  // Manual send function with SHA-256 hashing
  const handleSendFile = async () => {
    if (!conn) return
    if (!file && files.length === 0) return

    try {
      setStatus('transferring')

      // If multiple files, zip them first
      // If single file, use files[0] if file is not set
      let fileToSend = file || (files.length === 1 ? files[0] : null)

      if (shouldZipFiles(files) && files.length > 0) {
        toast.info(`Zipping ${files.length} files...`)
        fileToSend = await createZipFromFiles(files)
        setFile(fileToSend) // Update store with zipped file
        toast.success('Files zipped successfully!')
      }

      if (!fileToSend) {
        toast.error('No file to send')
        setStatus('failed')
        return
      }

      // CRITICAL: Calculate file hash BEFORE sending
      toast.info('Calculating file hash...')
      const fileHash = await calculateFileHash(fileToSend)
      setFileHash(fileHash)

      // Start transfer tracking
      setTransferStartTime(Date.now())
      setTransferredBytes(0)

      // 1. Send Text First (if present)
      if (textContent) {
        conn.send({
          type: 'text-message',
          content: textContent,
          timestamp: Date.now(),
          hasFile: true  // Flag: file is coming after this text
        })
        console.log('[Send] Text message sent along with file')
      }

      // 2. Send Meta WITH HASH
      conn.send({
        type: 'file-meta',
        name: fileToSend.name,
        size: fileToSend.size,
        fileType: fileToSend.type,
        hash: fileHash,  // SHA-256 hash for integrity verification
        hasText: !!textContent  // Flag to indicate text was sent
      })

      console.log('[Send] Metadata sent:', fileToSend.name, fileToSend.size, 'bytes')
      if (textContent) {
        toast.success('Sending text and file...')
      } else {
        toast.success('Hash verified. Starting transfer...')
      }

      // 2. Chunk & Send - Convert ArrayBuffer to base64 to avoid PeerJS serialization issues
      const CHUNK_SIZE = 16 * 1024 // 16KB
      const totalChunks = Math.ceil(fileToSend.size / CHUNK_SIZE)
      let offset = 0
      let totalSent = 0

      for (let i = 0; i < totalChunks; i++) {
         const slice = fileToSend.slice(offset, offset + CHUNK_SIZE)
         const buffer = await slice.arrayBuffer()

         // Convert ArrayBuffer to Uint8Array then to base64
         const uint8 = new Uint8Array(buffer)
         const base64 = btoa(String.fromCharCode(...uint8))

         conn.send({
           type: 'chunk',
           data: base64,  // Send as base64 string
           index: i
         })

         console.log(`[Send] Chunk ${i + 1}/${totalChunks} sent:`, buffer.byteLength, 'bytes')

         totalSent += buffer.byteLength
         setTransferredBytes(totalSent) // Update for speed calculation

         offset += CHUNK_SIZE
         const percent = Math.min(((i + 1) / totalChunks) * 100, 99)
         setProgress(percent)

         if (i % 50 === 0) await new Promise(r => setTimeout(r, 0))
      }
      
      // 3. Complete Signal
      conn.send({ type: 'transfer-complete' })
      console.log('[Send] Transfer complete signal sent')
      
      setProgress(100)
      setStatus('completed')
      toast.success('Transfer Complete!')
      
    } catch (err) {
      console.error('[Send] Error:', err)
      setStatus('failed')
      const errorInfo = formatErrorForToast(err, 'transfer-interrupted')
      toast.error(errorInfo.title, {
        description: errorInfo.description,
        duration: errorInfo.duration
      })
    }
  }

  // Manual download function
  const handleDownload = () => {
    if (!readyToDownload) return
    
    const url = URL.createObjectURL(readyToDownload)
    const a = document.createElement('a')
    a.href = url
    a.download = readyToDownload.name
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Download Started!')
    
    // Reset after download
    setTimeout(() => {
      setReadyToDownload(null)
      setFile(null)
      setStatus('idle')
    }, 1000)
  }


  if (status === 'idle' || status === 'ready') return null

  // Show "Send Now" button for sender when connected and peer is ready
  const showSendButton = status === 'connected' && isPeerReady && (file || files.length > 0) && mode === 'send'

  // Show "Download" button for receiver when file is ready
  const showDownloadButton = status === 'completed' && readyToDownload && mode === 'receive'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full glass-card p-4 rounded-xl"
    >
      {/* Compact Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <StatusIcon status={status} size="default" />
          <div className="flex-1 min-w-0 space-y-0.5">
            <h3 className="text-base font-semibold text-foreground">
              {getStatusText(status)}
            </h3>
            <p className="text-sm text-muted break-all overflow-hidden">
              {file ? file.name : (status === 'connected' ? 'Waiting for file...' : 'Connecting...')}
            </p>
          </div>
        </div>

        {/* Compact Percentage Display */}
        <span className="font-mono text-xl text-primary font-bold tracking-tight ml-2 shrink-0">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Sleek Progress Bar */}
      <div className="h-1.5 w-full rounded-full overflow-hidden mb-2" style={{background: 'rgba(148, 163, 184, 0.1)'}}>
        <motion.div
          className="h-full progress-gradient"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* Speed and ETA Indicator */}
      {status === 'transferring' && transferSpeed > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between text-xs text-muted mb-3"
        >
          <span className="font-mono">
            {transferSpeed < 1
              ? `${(transferSpeed * 1024).toFixed(1)} KB/s`
              : `${transferSpeed.toFixed(2)} MB/s`
            }
          </span>
          {eta !== null && eta > 0 && (
            <span>
              ETA: {eta < 60
                ? `${Math.ceil(eta)}s`
                : `${Math.floor(eta / 60)}m ${Math.ceil(eta % 60)}s`
              }
            </span>
          )}
        </motion.div>
      )}

      {/* Compact Step Indicators */}
      {status === 'transferring' && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <StepIndicator active={progress > 0} label="Preparing" />
          <div className="w-6 h-px bg-border/50" />
          <StepIndicator active={progress > 30} label="Sending" />
          <div className="w-6 h-px bg-border/50" />
          <StepIndicator active={progress > 90} label="Verifying" />
        </div>
      )}

      {/* Compact Send Button */}
      {showSendButton && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          onClick={handleSendFile}
          className="glass-btn-primary w-full mt-3 py-2.5 text-sm"
        >
          Send Now
        </motion.button>
      )}

      {/* Download & Preview Buttons */}
      {showDownloadButton && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex gap-2 mt-3"
        >
          {/* Preview Button (only for images) */}
          {readyToDownload && isImageFile(readyToDownload) && (
            <button
              onClick={() => {
                const url = createImagePreviewUrl(readyToDownload)
                setPreviewUrl(url)
                setShowImagePreview(true)
              }}
              className="glass-card px-4 py-2.5 text-sm border border-border hover:border-primary/30 transition-colors flex items-center justify-center gap-2 rounded-lg"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="glass-btn-primary flex-1 py-2.5 text-sm glow-success"
          >
            Download File
          </button>
        </motion.div>
      )}

      {status === 'connected' && !showSendButton && !showDownloadButton && (
        <p className="text-center text-sm text-muted mt-3">
          {isPeerReady ? 'Ready to transfer...' : 'Establishing secure handshake...'}
        </p>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={showImagePreview}
        onClose={() => {
          setShowImagePreview(false)
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl('')
          }
        }}
        imageUrl={previewUrl}
        fileName={readyToDownload?.name || ''}
        fileSize={readyToDownload?.size}
      />
    </motion.div>
  )
}

function StatusIcon({ status, size = 'default' }: { status: string; size?: 'default' | 'large' }) {
  const iconSize = size === 'large' ? 'w-7 h-7' : 'w-5 h-5'

  switch (status) {
    case 'connecting':
    case 'transferring':
      return <Loader2 className={`${iconSize} text-primary animate-spin`} />
    case 'completed':
      return <CheckCircle2 className={`${iconSize} text-success`} />
    case 'failed':
      return <XCircle className={`${iconSize} text-danger`} />
    default:
      return <div className={`${iconSize} rounded-full border-2 border-muted`} />
  }
}

function StepIndicator({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          active
            ? 'bg-primary border-primary'
            : 'bg-transparent border-border/50'
        }`}
        animate={active ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.4 }}
      >
        {active && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-1.5 h-1.5 rounded-full bg-background"
          />
        )}
      </motion.div>
      <span className={`text-[10px] font-medium transition-colors ${
        active ? 'text-foreground' : 'text-muted'
      }`}>
        {label}
      </span>
    </div>
  )
}

function getStatusText(status: string) {
  switch (status) {
    case 'connecting': return 'Establishing Connection...'
    case 'connected': return 'Connection Active'
    case 'transferring': return 'Transferring Data...'
    case 'completed': return 'Transfer Successful'
    case 'failed': return 'Transfer Failed'
    default: return status
  }
}
