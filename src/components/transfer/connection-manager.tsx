"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Peer, { type DataConnection } from 'peerjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, ArrowRight, Loader2, Check, Clock, RefreshCw, ChevronDown, QrCode, Share2, History, BarChart3, ScanLine } from 'lucide-react'
import { useWarpStore } from '@/store/use-warp-store'
import { useUsernameStore } from '@/store/use-username-store'
import { toast } from 'sonner'
import { generateSecureCode, codeToPeerId } from '@/lib/code-generator'
import { calculateFileHash, formatHashPreview } from '@/lib/file-hash'
import { notifyConnectionEstablished, notifyTextReceived } from '@/lib/notifications'
import { QRCodeDisplay } from './qr-code-display'
import { QrScanner } from './qr-scanner'
import { getPreferences } from '@/lib/preferences'
import { formatErrorForToast } from '@/lib/error-handler'
import { getIceServers, getIceTransportPolicy } from '@/lib/webrtc-ice'

// Type for file metadata received over the connection
interface FileMetaData {
  type: 'file-meta'
  name: string
  size: number
  fileType: string
  hash: string  // SHA-256 hash of the file
}

// Type guard to check if data is FileMetaData
function isFileMetaData(data: unknown): data is FileMetaData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data as FileMetaData).type === 'file-meta'
  )
}

const CODE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

// SECURITY: File size and chunk limits to prevent DoS attacks
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024 // 10GB max file size
const MAX_CHUNKS = 1000000 // Maximum number of chunks (10GB / 16KB ≈ 655,360 chunks)

interface ConnectionManagerProps {
  onOpenHistory?: () => void
  onOpenStats?: () => void
  initialAction?: 'create' | 'join'
  headless?: boolean
}

export function ConnectionManager({ onOpenHistory, onOpenStats, initialAction, headless }: ConnectionManagerProps = {}) {
  const {
    setMyId, peer, setPeer,
    setConn, setStatus, status,
    mode, setMode, setFile,
    setError, setProgress, setIsPeerReady, setReadyToDownload,
    codeExpiry, setCodeExpiry, setFileHash,
    setTransferStartTime, setTransferredBytes, addLog, resetPeerKeepFiles,
    displayCode, setDisplayCode, clientInputCode,
    relayFiles, setRelayFiles, relayCode, setRelayCode,
    files,
  } = useWarpStore()

  const searchParams = useSearchParams()
  const [inputCode, setInputCode] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [showReceive, setShowReceive] = useState(initialAction === 'join')
  const [showQR, setShowQR] = useState(false)
  const [autoConnected, setAutoConnected] = useState(false)
  const [canShare, setCanShare] = useState(false)
  const [hasActiveConnection, setHasActiveConnection] = useState(false)

  // Detect if we're in QR auto-connect mode (opened from QR code URL)
  // Use both searchParams hook AND window.location as fallback for reliability
  const isQRConnect = useMemo(() => {
    const fromHook = searchParams.get('code')
    if (fromHook) return true
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      return !!urlParams.get('code')
    }
    return false
  }, [searchParams])

  // Check if native share is available
  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share)
  }, [])

  // Refresh code function - must be defined before useEffect that uses it
  const refreshCode = useCallback(() => {
    // Generate new code
    const newDisplayCode = generateSecureCode()
    const newExpiry = Date.now() + CODE_EXPIRY_MS

    // Reset peer while keeping files
    addLog('Refreshing connection code...', 'info')
    resetPeerKeepFiles()

    // Set new code info
    setDisplayCode(newDisplayCode)
    setCodeExpiry(newExpiry)
    setShowQR(false)

    toast.success('New code generated! Peer connection reset.')
    addLog(`New code generated: ${newDisplayCode}`, 'success')
  }, [addLog, resetPeerKeepFiles, setCodeExpiry, setDisplayCode])

  // PC → Mobile relay: when sender has files and a code, poll for a mobile claim,
  // then upload files to relay so the mobile receiver can download them.
  useEffect(() => {
    if (!displayCode || files.length === 0 || mode !== 'send') return
    if (status === 'transferring' || status === 'completed') return

    let stopped = false

    const poll = setInterval(async () => {
      if (stopped) { clearInterval(poll); return }
      try {
        const res = await fetch(`/api/relay/${displayCode}/claim`)
        if (!res.ok) return
        const json = await res.json()
        if (!json.claimed) return

        // Mobile claimed the code — upload files to relay
        stopped = true
        clearInterval(poll)
        addLog('Mobile receiver detected — uploading to relay...', 'info')
        toast.info('Mobile receiver connected — uploading files...')

        const formData = new FormData()
        for (const f of files) {
          formData.append('file', f, f.name)
        }
        const uploadRes = await fetch(`/api/relay/${displayCode}`, { method: 'POST', body: formData })
        if (uploadRes.ok) {
          addLog('Files uploaded to relay for mobile receiver', 'success')
          toast.success('Files ready for mobile download!')
        } else {
          addLog('Relay upload failed', 'error')
          toast.error('Failed to upload files to relay')
        }
      } catch {
        // ignore transient errors
      }
    }, 2000)

    return () => { stopped = true; clearInterval(poll) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayCode, files.length, mode, status])

  // Generate code and set expiry on mount
  useEffect(() => {
    if (!displayCode && !headless) {
      const newDisplayCode = generateSecureCode()
      const expiry = Date.now() + CODE_EXPIRY_MS

      setDisplayCode(newDisplayCode)
      setCodeExpiry(expiry)

      // Auto-copy code if enabled
      const preferences = getPreferences()
      if (preferences.autoCopyCode) {
        navigator.clipboard.writeText(newDisplayCode).then(() => {
          toast.success('Code auto-copied to clipboard!', {
            description: newDisplayCode,
            duration: 2000
          })
        }).catch(() => {
          // Silent fail - user can still copy manually
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Countdown timer for code expiry
  useEffect(() => {
    if (!codeExpiry) return

    const interval = setInterval(() => {
      const remaining = codeExpiry - Date.now()
      if (remaining <= 0) {
        setTimeLeft(0)
        toast.error('Code expired! Generating new code...')
        addLog('Code expired, generating new code...', 'warning')
        // Generate new code using refresh function
        refreshCode()
      } else {
        setTimeLeft(Math.ceil(remaining / 1000)) // seconds
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [codeExpiry, setCodeExpiry, addLog, refreshCode])

  // For receivers in headless join mode, generate a random peer ID
  // They don't need a display code but need a Peer instance to connect outward
  const receiverPeerId = useMemo(() => {
    if (headless && initialAction === 'join' && !displayCode) {
      return `sr-warp-recv-${Math.random().toString(36).substring(2, 10)}`
    }
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headless, initialAction])

  const peerId = displayCode ? codeToPeerId(displayCode) : receiverPeerId

  // ... (Chunking constants and Data Handler remain same) ...

  // Centralized Data Handler
  const [receivedChunks, setReceivedChunks] = useState<Array<{index: number, blob: Blob}>>([])
  const [receivedSize, setReceivedSize] = useState(0)
  const [meta, setMeta] = useState<FileMetaData | null>(null)
  const verificationStartedRef = useRef(false)

  const handleReceiveData = useCallback((data: unknown) => {
    // 0. Handle Text Message
    if (
      data &&
      typeof data === 'object' &&
      'type' in data &&
      (data as Record<string, unknown>).type === 'text-message'
    ) {
      const textData = data as { type: 'text-message'; content: string; timestamp: number; hasFile?: boolean }
      console.log('[Receive] Got text message:', textData.content.substring(0, 50))

      // Store the text content
      useWarpStore.getState().setTextContent(textData.content)

      // If no file is coming, complete the transfer
      if (textData.hasFile === false) {
        setMode('receive')
        setStatus('completed')
        toast.success('Text received!')
        notifyTextReceived(textData.content)
        useWarpStore.getState().addLog(`Text message received (${textData.content.length} chars)`, 'success')
        return
      }

      // If file is coming (hasFile=true), just store text and wait for file
      if (textData.hasFile === true) {
        console.log('[Receive] Text stored, waiting for file...')
        toast.info('Text received, waiting for file...')
        useWarpStore.getState().addLog('Text message received, waiting for file...', 'info')
        // Don't return - continue to process file-meta
      }
    }

    // 1. Handle Meta (now includes hash)
    if (isFileMetaData(data)) {
      console.log('[Receive] Got metadata:', data.name, data.size, 'bytes')

      // SECURITY: Validate file size to prevent DoS
      if (data.size > MAX_FILE_SIZE) {
        toast.error('File too large!', {
          description: `Maximum file size is ${(MAX_FILE_SIZE / (1024 * 1024 * 1024)).toFixed(1)}GB. Received: ${(data.size / (1024 * 1024 * 1024)).toFixed(1)}GB`
        })
        setStatus('failed')
        setError('File size exceeds maximum allowed size')
        return
      }

      // SECURITY: Validate expected chunk count
      const CHUNK_SIZE = 16 * 1024
      const expectedChunks = Math.ceil(data.size / CHUNK_SIZE)
      if (expectedChunks > MAX_CHUNKS) {
        toast.error('File requires too many chunks', {
          description: 'This file exceeds the transfer complexity limit.'
        })
        setStatus('failed')
        setError('File chunk count exceeds limit')
        return
      }

      setMeta(data)
      setReceivedChunks([])
      setReceivedSize(0)
      verificationStartedRef.current = false

      setMode('receive')
      setFile({ name: data.name, size: data.size, type: data.fileType } as File)
      setFileHash(data.hash) // Store expected hash
      setProgress(0)
      setStatus('transferring')

      // Start transfer tracking
      setTransferStartTime(Date.now())
      setTransferredBytes(0)

      toast.info(`Receiving: ${data.name}\nHash: ${formatHashPreview(data.hash)}`)
      useWarpStore.getState().addLog(`Receiving file: ${data.name} (${(data.size / (1024 * 1024)).toFixed(2)} MB)`, 'info')
    }
    // 2. Handle Chunk
    else if (
        data &&
        typeof data === 'object' &&
        'type' in data &&
        (data as Record<string, unknown>).type === 'chunk'
    ) {
      const chunkData = (data as Record<string, unknown>).data
      const chunkIndex = (data as Record<string, unknown>).index as number

      // SECURITY: Check for duplicate chunks
      const isDuplicate = receivedChunks.some(chunk => chunk.index === chunkIndex)
      if (isDuplicate) {
        console.warn(`[HashDrop] Duplicate chunk detected: ${chunkIndex}`)
        return // Ignore duplicate chunks
      }

      // SECURITY: Check total chunks count to prevent memory exhaustion
      if (receivedChunks.length >= MAX_CHUNKS) {
        console.error('[HashDrop] Maximum chunk count exceeded')
        toast.error('Transfer aborted: Too many chunks', {
          description: 'Potential DoS attack detected.'
        })
        setStatus('failed')
        setError('Maximum chunk count exceeded')
        return
      }

      // Decode base64 string back to ArrayBuffer
      if (typeof chunkData === 'string') {
        try {
          const binaryString = atob(chunkData)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }

          const blob = new Blob([bytes])
          setReceivedChunks(prev => [...prev, { index: chunkIndex, blob }])
          setReceivedSize(prev => {
            const newSize = prev + bytes.byteLength
            setTransferredBytes(newSize) // Update transferred bytes for speed calculation
            return newSize
          })
        } catch (error) {
          console.error('[HashDrop] Chunk decode failed:', error)
        }
      } else {
        console.error('[HashDrop] Invalid chunk data type')
      }
    }
    // 3. Handle Completion Signal
    else if (
        data && 
        typeof data === 'object' && 
        'type' in data && 
        (data as Record<string, unknown>).type === 'transfer-complete'
    ) {
        console.log('[Receive] Transfer complete signal received')
        setStatus('completed')
    }
    // 4. Handle Handshake
    else if (
        data &&
        typeof data === 'object' &&
        'type' in data &&
        (data as Record<string, unknown>).type === 'ready'
    ) {
        console.log('[Receive] Peer is ready')
        setIsPeerReady(true)
        useWarpStore.getState().addLog('Peer is ready to transfer', 'success')
    }
  }, [receivedChunks, setMode, setFile, setMeta, setProgress, setStatus, setIsPeerReady, setFileHash, setTransferStartTime, setTransferredBytes, setError, setReceivedChunks, setReceivedSize])

  // Effect to track receiver progress and prepare file for download WITH HASH VERIFICATION
  useEffect(() => {
    if (status === 'transferring' && meta && meta.size > 0) {
      const percent = (receivedSize / meta.size) * 100
      setProgress(percent)
    }
    
    // When transfer completes, VERIFY HASH then prepare file
    // Guard: only run once and only after all bytes have arrived in state
    if (status === 'completed' && meta && receivedSize >= meta.size && receivedChunks.length > 0 && !verificationStartedRef.current) {
      verificationStartedRef.current = true
      const verifyAndPrepare = async () => {
        try {
          // Sort chunks by index before reconstruction
          const sortedChunks = [...receivedChunks].sort((a, b) => a.index - b.index)
          
          const fullBlob = new Blob(sortedChunks.map(c => c.blob), { type: meta.fileType })
          const file = new File([fullBlob], meta.name, { type: meta.fileType })
          
          // Verify file hash
          toast.info('Verifying file integrity...')
          
          const calculatedHash = await calculateFileHash(file)

          if (calculatedHash !== meta.hash) {
            console.error('[HashDrop] Hash mismatch detected')
            toast.error('File integrity check failed')
            toast.warning('File may be corrupted. Download with caution.')
            useWarpStore.getState().addLog('File integrity check failed - Hash mismatch', 'error')

            setReadyToDownload(file)
            setError('Hash verification failed')
          } else {
            console.log('[HashDrop] File verified')
            toast.success('File verified!')
            useWarpStore.getState().addLog('File integrity verified successfully', 'success')
            setReadyToDownload(file)
          }
          
          // Cleanup
          setTimeout(() => {
            setMeta(null)
            setReceivedChunks([])
            setReceivedSize(0)
          }, 1000)
        } catch (error) {
          console.error('[HashDrop] Verification error:', error)
          toast.error('Verification failed')
          setStatus('failed')
        }
      }
      
      verifyAndPrepare()
    }
  }, [receivedSize, meta, status, receivedChunks, setProgress, setReadyToDownload, setStatus, setError])


  // Centralized Connection Handler
  const handleConnection = useCallback((conn: DataConnection) => {
    setConn(conn)
    setStatus('connected')
    setHasActiveConnection(true)
    toast.success('Warp Link Established!')
    notifyConnectionEstablished()
    addLog('Connection established with peer', 'success')

    // Handshake: Announce we are ready to receive data
    // Both sides do this, ensuring the pipe is open
    conn.send({ type: 'ready' })

    conn.on('data', (data) => {
      handleReceiveData(data)
    })

    conn.on('close', () => {
      setStatus('idle')
      setHasActiveConnection(false)
      toast.info('Connection Closed')
      addLog('Connection closed', 'info')
      setReceivedChunks([])
      setReceivedSize(0)
      setIsPeerReady(false)
    })

    conn.on('error', (err) => {
        setStatus('failed')
        setHasActiveConnection(false)
        const errorInfo = formatErrorForToast(err, 'transfer-interrupted')
        toast.error(errorInfo.title, {
          description: errorInfo.description,
          duration: errorInfo.duration
        })
        addLog(`Connection error: ${errorInfo.title}`, 'error')
    })
  }, [setConn, setStatus, setHasActiveConnection, handleReceiveData, setIsPeerReady, addLog, setReceivedChunks, setReceivedSize])
  
  // Ref to always have the latest handleConnection without stale closures
  const handleConnectionRef = useRef(handleConnection)
  useEffect(() => {
    handleConnectionRef.current = handleConnection
  }, [handleConnection])

  // Initialize Peer WITH RETRY LOGIC
  useEffect(() => {
    if (!peerId || peer) return

    console.log('[Peer] Attempting to create peer with ID:', peerId)
    let retryCount = 0
    const MAX_RETRIES = 3 // Retry up to 3 times for reliability
    
    const createPeer = async () => {
      try {
        console.log('[FileTransfer] Creating peer with ID:', peerId)

        const peerHost = 'hashdrop.onrender.com'
        const peerPort = 443
        const peerPath = '/'
        const iceServers = await getIceServers()

        const newPeer = new Peer(peerId, {
          host: peerHost,
          port: peerPort,
          path: peerPath,
          secure: true,
          debug: 2,
          config: {
            iceServers,
            iceTransportPolicy: getIceTransportPolicy(),
          }
        })

        // Longer timeout - 30 seconds
        const connectionTimeout = setTimeout(() => {
          if (!newPeer.id) {
            console.error('[Peer] Connection timeout after 30s')
            newPeer.destroy()
            
            if (retryCount < MAX_RETRIES) {
              retryCount++
              const delay = 2000 * retryCount // Exponential: 2s, 4s, 6s
              console.log(`[Peer] Retry attempt ${retryCount}/${MAX_RETRIES} in ${delay}ms`)
              addLog(`Retrying connection (${retryCount}/${MAX_RETRIES})...`, 'warning')
              setTimeout(() => {
                void createPeer()
              }, delay)
            } else {
              // Only show error toast on final failure
              toast.error('Could not connect to network. Please refresh the page.')
              addLog('Network connection failed after all retries', 'error')
            }
          }
        }, 30000) // 30 second timeout

        newPeer.on('open', (id) => {
          console.log('[Peer] Connected! ID:', id)
          clearTimeout(connectionTimeout)
          setMyId(id)
          setPeer(newPeer)
          addLog('Network initialized successfully', 'success')
        })

        newPeer.on('connection', (conn) => {
          console.log('[Peer] Incoming connection...')

          // SECURITY: Only accept the first connection to prevent multiple recipients
          if (hasActiveConnection) {
            console.warn('[Peer] Rejecting connection - already have an active connection')
            toast.warning('Connection rejected: Already connected to a peer', {
              description: 'Only one recipient is allowed per transfer for security.'
            })
            conn.close()
            return
          }

          // Use ref to avoid stale closure - always calls the latest handler
          handleConnectionRef.current(conn)
        })

        newPeer.on('error', (err) => {
          console.error('[Peer] Error:', err)
          clearTimeout(connectionTimeout)

          if (err.type === 'unavailable-id') {
            toast.error('Code already in use. Generating new code...')
            addLog('Code already in use, generating new code', 'warning')
            // Use refreshCode to properly reset peer
            refreshCode()
          } else if (err.type === 'network') {
            // Don't show error toast immediately - let timeout handle it
            console.error('[Peer] Network error, will retry if needed')
            addLog('Network error detected, attempting retry', 'warning')
          } else {
            // Only show error for non-network issues
            if (retryCount >= MAX_RETRIES) {
              const errorInfo = formatErrorForToast(err, 'connection-failed')
              toast.error(errorInfo.title, {
                description: errorInfo.description,
                duration: errorInfo.duration
              })
              addLog(`Network initialization failed: ${errorInfo.title}`, 'error')
            }
          }

          newPeer.destroy()

          if (retryCount < MAX_RETRIES && err.type === 'network') {
            retryCount++
            const delay = 2000 * retryCount
            console.log(`[Peer] Network error retry ${retryCount}/${MAX_RETRIES} in ${delay}ms`)
            addLog(`Network retry (${retryCount}/${MAX_RETRIES})...`, 'warning')
            setTimeout(createPeer, delay)
          }
        })

      } catch (error) {
        console.error('[Peer] Creation failed:', error)

        if (retryCount < MAX_RETRIES) {
          retryCount++
          const delay = 2000 * retryCount
          setTimeout(createPeer, delay)
        } else {
          const errorInfo = formatErrorForToast(error, 'connection-failed')
          toast.error(errorInfo.title, {
            description: errorInfo.description,
            duration: errorInfo.duration
          })
        }
      }
    }

    void createPeer()
  }, [peerId, peer, handleConnection, setMyId, setPeer, addLog, hasActiveConnection, refreshCode])


  const connect = useCallback(async (targetCode: string) => {
    const normalized = targetCode.trim().toUpperCase()

    // 1. Check relay first (handles mobile → web transfers via HTTP relay)
    try {
      const res = await fetch(`/api/relay/${normalized}`)
      if (res.ok) {
        const json = await res.json()
        if (Array.isArray(json.files) && json.files.length > 0) {
          setRelayFiles(json.files)
          setRelayCode(normalized)
          setStatus('idle')
          addLog(`Relay transfer found: ${json.files.length} file(s)`, 'success')
          toast.success('Files ready to download!', { description: `${json.files.length} file(s) from mobile` })
          return
        }
      }
    } catch {
      // relay check failed silently — fall through to PeerJS
    }

    // 2. Fall back to PeerJS P2P
    if (!peer) {
      toast.error('Initializing connection... Please wait a moment.')
      addLog('Network not ready, please wait', 'warning')
      return
    }
    setStatus('connecting')
    addLog(`Connecting to peer: ${targetCode}`, 'info')

    // Normalize code input to ID
    const targetId = `sr-warp-${targetCode.trim().toLowerCase()}`

    const conn = peer.connect(targetId)

    let connectionTimeout: NodeJS.Timeout | null = null
    let hasConnected = false
    let relayPollInterval: NodeJS.Timeout | null = null
    let relayFound = false

    // Poll relay every 2s while P2P is connecting.
    // Handles the case where mobile uploads AFTER web started connecting.
    relayPollInterval = setInterval(async () => {
      if (hasConnected || relayFound) {
        clearInterval(relayPollInterval!)
        return
      }
      try {
        const res = await fetch(`/api/relay/${normalized}`)
        if (res.ok) {
          const json = await res.json()
          if (Array.isArray(json.files) && json.files.length > 0) {
            relayFound = true
            clearInterval(relayPollInterval!)
            if (connectionTimeout) clearTimeout(connectionTimeout)
            conn.close()
            setRelayFiles(json.files)
            setRelayCode(normalized)
            setStatus('idle')
            addLog(`Relay transfer found: ${json.files.length} file(s)`, 'success')
            toast.success('Files ready to download!', { description: `${json.files.length} file(s) from mobile` })
          }
        }
      } catch {
        // ignore poll errors
      }
    }, 2000)

    connectionTimeout = setTimeout(() => {
      clearInterval(relayPollInterval!)
      if (!hasConnected && !relayFound && conn.open === false) {
        conn.close()
        setStatus('failed')
        toast.error('Connection Timeout', {
          description: 'Could not reach the other peer. Make sure they are online and try again.',
          duration: 6000
        })
        addLog('Connection timeout - peer unreachable. Check that the sender has the app open.', 'error')
      }
    }, 60000) // 60 seconds — gives mobile time to tap "Upload & share"

    conn.on('open', () => {
        hasConnected = true
        clearInterval(relayPollInterval!)
        if (connectionTimeout) clearTimeout(connectionTimeout)
        handleConnection(conn)
    })

    conn.on('error', (err) => {
      clearInterval(relayPollInterval!)
      if (connectionTimeout) clearTimeout(connectionTimeout)
      if (relayFound) return // relay took over, suppress P2P error
      setStatus('failed')
      const errorInfo = formatErrorForToast(err, 'peer-unavailable')
      toast.error(errorInfo.title, {
        description: errorInfo.description,
        duration: errorInfo.duration
      })
      addLog(`Connection failed: ${errorInfo.title}`, 'error')
    })
  }, [peer, addLog, setStatus, handleConnection, setRelayFiles, setRelayCode])

  // Auto-connect from URL parameter (QR code scan)
  useEffect(() => {
    // Try searchParams hook first, fall back to window.location
    let code = searchParams.get('code')
    if (!code && typeof window !== 'undefined') {
      code = new URLSearchParams(window.location.search).get('code')
    }

    if (code && !autoConnected && peer && status === 'idle') {
      console.log('[QR] Auto-connecting with code:', code)
      setInputCode(code)
      setShowReceive(true)
      setAutoConnected(true)
      addLog(`QR code detected: ${code}`, 'info')

      // Auto-connect after a brief delay to ensure peer is ready
      setTimeout(() => {
        connect(code!)
      }, 500)
    }
  }, [searchParams, autoConnected, peer, status, connect, addLog])

  // Auto-connect from UnifiedTransferFlow (clientInputCode)
  useEffect(() => {
    if (clientInputCode && peer && status === 'connecting' && !hasActiveConnection) {
      console.log('[ConnectionManager] Auto-connecting from store state:', clientInputCode)
      connect(clientInputCode)
    }
  }, [clientInputCode, peer, status, hasActiveConnection, connect])
  
  const copyCode = () => {
    if (!displayCode) return
    navigator.clipboard.writeText(displayCode)
    setIsCopied(true)
    toast.success('Code Copied!')
    setTimeout(() => setIsCopied(false), 2000)
  }

  const shareCode = async () => {
    if (!navigator.share || !displayCode) return
    const { username } = useUsernameStore.getState()
    const fromParam = username ? `&from=${encodeURIComponent(username)}` : ''
    try {
      await navigator.share({
        title: 'HashDrop Transfer Code',
        text: `Join my file transfer with code: ${displayCode}`,
        url: `https://hashdrop.metesahankurt.cloud?code=${displayCode}${fromParam}`
      })
      toast.success('Code shared!')
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error)
      }
    }
  }

  const isJoinMode = initialAction === 'join'
  const isCreateMode = initialAction === 'create' || !initialAction
  const [showQRScanner, setShowQRScanner] = useState(false)

  if (headless) return null

  // Relay download panel — shown when mobile uploaded files via HTTP relay
  if (relayFiles && relayCode) {
    return (
      <div className="w-full flex flex-col items-center gap-4">
        <div className="glass-card w-full max-w-md p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider">Mobile Transfer</span>
          </div>
          <p className="text-sm text-muted">
            {relayFiles.length} file{relayFiles.length > 1 ? 's' : ''} ready from the mobile app.
          </p>
          <div className="flex flex-col gap-2">
            {relayFiles.map((f) => (
              <a
                key={f.index}
                href={`/api/relay/${relayCode}?index=${f.index}`}
                download={f.name}
                className="glass-btn-primary flex items-center justify-between gap-3 px-4 py-3 text-sm no-underline"
              >
                <span className="truncate font-medium">{f.name}</span>
                <span className="text-xs text-muted whitespace-nowrap">
                  {(f.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </a>
            ))}
          </div>
          <button
            onClick={async () => {
              await fetch(`/api/relay/${relayCode}`, { method: 'DELETE' })
              setRelayFiles(null)
              setRelayCode(null)
            }}
            className="text-xs text-muted hover:text-foreground transition-colors text-center mt-1"
          >
            Clear transfer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center gap-6 md:gap-8">

      {/* QR Auto-Connect View - Shown when page is opened from QR code scan */}
      {isQRConnect && !autoConnected && status === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-3 glass-card rounded-lg px-5 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Connecting to peer...</p>
              <p className="text-xs text-muted font-mono">{searchParams.get('code') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('code') : '')}</p>
            </div>
          </div>
          <p className="text-xs text-muted">Initializing secure connection</p>
        </motion.div>
      )}

      {/* Sender View - Compact Code Display (only when creating, not QR) */}
      {isCreateMode && !isQRConnect && (mode === 'send' || mode === 'text' || mode === null) && status === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-3"
        >
          <p className="text-sm text-muted">
            {mode === 'text' ? 'Share this code to send your text' : 'Share this code to send your file'}
          </p>

          {/* Compact Code Display with Glass Effect */}
          <div className="inline-flex items-center gap-2 glass-card rounded-lg px-3 py-2.5 glow-primary">
            <span className="font-mono text-xl md:text-2xl text-primary font-bold tracking-wide">
              {displayCode || '---'}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={copyCode}
                className="p-1.5 hover:bg-white/10 rounded-md transition-all"
                title="Copy code"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-muted hover:text-foreground" />
                )}
              </button>
              {canShare && (
                <button
                  onClick={shareCode}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-all"
                  title="Share code"
                >
                  <Share2 className="w-4 h-4 text-muted hover:text-foreground" />
                </button>
              )}
              <button
                onClick={() => setShowQR(!showQR)}
                className="p-1.5 hover:bg-white/10 rounded-md transition-all"
                title={showQR ? 'Hide QR code' : 'Show QR code'}
              >
                <QrCode className={`w-4 h-4 ${showQR ? 'text-primary' : 'text-muted hover:text-foreground'}`} />
              </button>
              <button
                onClick={refreshCode}
                className="p-1.5 hover:bg-white/10 rounded-md transition-all"
                title="Generate new code and reset connection"
              >
                <RefreshCw className="w-4 h-4 text-muted hover:text-foreground" />
              </button>
            </div>
          </div>

          {/* QR Code Display */}
          <AnimatePresence>
            {showQR && displayCode && (
              <QRCodeDisplay code={displayCode} size={180} />
            )}
          </AnimatePresence>

          {/* Code Expiry Timer */}
          {timeLeft !== null && timeLeft > 0 && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted">
              <Clock className="w-3 h-3" />
              <span>Expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* QR Connection Status - Active connecting state */}
      {isQRConnect && status === 'connecting' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-3 glass-card rounded-lg px-5 py-4 glow-primary">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Connecting...</p>
              <p className="text-xs text-muted font-mono">{inputCode}</p>
            </div>
          </div>
          <p className="text-xs text-muted">If using the mobile app, tap <strong>Upload &amp; share</strong> to send</p>
        </motion.div>
      )}

      {/* QR Connection Failed */}
      {isQRConnect && status === 'failed' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-4"
        >
          <div className="glass-card rounded-lg px-5 py-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Connection failed</p>
            <p className="text-xs text-muted">Make sure the sender is online and the code is still valid.</p>
            <button
              onClick={() => {
                setStatus('idle')
                setAutoConnected(false)
              }}
              className="glass-btn-primary px-4 py-2 text-sm flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* JOIN MODE: Clean standalone join card */}
      {isJoinMode && !isQRConnect && (status === 'idle' || status === 'connecting' || status === 'failed') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={peer ? 'Enter code (e.g. Cosmic-Falcon)' : 'Initializing...'}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputCode.trim() && peer && status !== 'connecting') {
                    connect(inputCode)
                  }
                }}
                className="glass-input flex-1 px-3 py-2.5 text-base font-mono text-center text-foreground placeholder:text-muted/50 focus:outline-none"
                disabled={status === 'connecting'}
                style={{ fontSize: '16px' }}
                autoFocus
              />
              <button
                onClick={() => setShowQRScanner(true)}
                className="glass-card px-3 rounded-xl text-muted hover:text-foreground hover:bg-white/10 transition-all"
                title="Scan QR"
              >
                <ScanLine className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => connect(inputCode)}
              disabled={!inputCode.trim() || status === 'connecting' || !peer}
              className="glass-btn-primary w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'connecting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Connect</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {status === 'failed' && (
              <p className="text-xs text-danger text-center">
                Connection failed. Check the code and try again.
              </p>
            )}

            {!peer && (
              <p className="text-xs text-muted text-center">
                Initializing secure connection...
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* CREATE MODE: Collapsible Receiver View (hidden in join mode and QR mode) */}
      {isCreateMode && !isQRConnect && mode === null && (status === 'idle' || status === 'connecting') && (
        <div className="w-full space-y-3">

          {/* Minimal Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-muted bg-background">or</span>
            </div>
          </div>

          {/* Compact Toggle Button */}
          <button
            onClick={() => setShowReceive(!showReceive)}
            className="w-full py-2 text-sm text-muted hover:text-foreground transition-all flex items-center justify-center gap-2"
          >
            <span>{showReceive ? 'Hide receiver' : 'Receive a file'}</span>
            <motion.div
              animate={{ rotate: showReceive ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>

          {/* View History & Statistics Links - Side by side */}
          <div className="grid grid-cols-2 gap-2">
            {onOpenHistory && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onOpenHistory}
                className="py-2 text-xs text-muted hover:text-primary transition-all flex items-center justify-center gap-1.5 group"
              >
                <History className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                <span>History</span>
              </motion.button>
            )}

            {onOpenStats && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 }}
                onClick={onOpenStats}
                className="py-2 text-xs text-muted hover:text-primary transition-all flex items-center justify-center gap-1.5 group"
              >
                <BarChart3 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Statistics</span>
              </motion.button>
            )}
          </div>

          {/* Collapsible Input Section */}
          <AnimatePresence>
            {showReceive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Enter sender&apos;s code
                  </h3>

                  <div className="flex flex-col gap-2.5">
                    <input
                      type="text"
                      placeholder={peer ? "Cosmic-Falcon" : "Initializing..."}
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && inputCode.trim() && peer && status !== 'connecting') {
                          connect(inputCode)
                        }
                      }}
                      className="glass-input w-full px-3 py-2.5 text-base font-mono text-center text-foreground placeholder:text-muted/50 focus:outline-none"
                      disabled={status === 'connecting'}
                    />

                    <button
                      onClick={() => connect(inputCode)}
                      disabled={!inputCode || status === 'connecting'}
                      title={!peer ? 'Initializing connection...' : ''}
                      className="glass-btn-primary w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {status === 'connecting' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <span>Connect</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {!peer && (
                      <p className="text-xs text-muted text-center">
                        Initializing secure connection...
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* QR Scanner modal */}
      {showQRScanner && (
        <QrScanner
          onCodeScanned={(code) => {
            setInputCode(code)
            setShowQRScanner(false)
            toast.success('QR code scanned!')
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  )
}
