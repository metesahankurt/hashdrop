import { create } from 'zustand'
import type { DataConnection, Peer } from 'peerjs'

export type TransferStatus = 'idle' | 'generating' | 'ready' | 'connecting' | 'connected' | 'transferring' | 'completed' | 'failed'
export type Mode = 'send' | 'receive' | 'text' | null

interface WarpState {
  myId: string | null
  peer: Peer | null
  conn: DataConnection | null
  status: TransferStatus
  mode: Mode
  file: File | null
  files: File[]  // Multiple files selected by user
  progress: number
  error: string | null
  isPeerReady: boolean
  readyToDownload: File | null  // Stores the completed file blob for manual download
  fileHash: string | null  // SHA-256 hash of sent/received file
  codeExpiry: number | null  // Unix timestamp when code expires
  textContent: string | null  // Text/link content for sharing
  transferStartTime: number | null  // Unix timestamp when transfer started
  transferSpeed: number  // Current transfer speed in MB/s
  transferredBytes: number  // Total bytes transferred

  setMyId: (id: string) => void
  setPeer: (peer: Peer | null) => void
  setConn: (conn: DataConnection) => void
  setStatus: (status: TransferStatus) => void
  setMode: (mode: Mode) => void
  setFile: (file: File | null) => void
  setFiles: (files: File[]) => void
  setProgress: (progress: number | ((prev: number) => number)) => void
  setError: (error: string | null) => void
  setIsPeerReady: (ready: boolean) => void
  setReadyToDownload: (file: File | null) => void
  setFileHash: (hash: string | null) => void
  setCodeExpiry: (expiry: number | null) => void
  setTextContent: (text: string | null) => void
  setTransferStartTime: (time: number | null) => void
  setTransferSpeed: (speed: number) => void
  setTransferredBytes: (bytes: number) => void
  reset: () => void
  fullReset: () => void
}

export const useWarpStore = create<WarpState>((set) => ({
  myId: null,
  peer: null,
  conn: null,
  status: 'idle',
  mode: null,
  file: null,
  files: [],
  progress: 0,
  error: null,
  isPeerReady: false,
  readyToDownload: null,
  fileHash: null,
  codeExpiry: null,
  textContent: null,
  transferStartTime: null,
  transferSpeed: 0,
  transferredBytes: 0,

  setMyId: (id) => set({ myId: id }),
  setPeer: (peer) => set({ peer }),
  setConn: (conn) => set({ conn }),
  setStatus: (status) => set({ status }),
  setMode: (mode) => set({ mode }),
  setFile: (file) => set({ file }),
  setFiles: (files) => set({ files }),
  setProgress: (progress) => set((state) => ({
    progress: typeof progress === 'function' ? progress(state.progress) : progress
  })),
  setIsPeerReady: (isPeerReady) => set({ isPeerReady }),
  setReadyToDownload: (file) => set({ readyToDownload: file }),
  setFileHash: (hash) => set({ fileHash: hash }),
  setCodeExpiry: (expiry) => set({ codeExpiry: expiry }),
  setTextContent: (text) => set({ textContent: text }),
  setTransferStartTime: (time) => set({ transferStartTime: time }),
  setTransferSpeed: (speed) => set({ transferSpeed: speed }),
  setTransferredBytes: (bytes) => set({ transferredBytes: bytes }),
  setError: (error) => set({ error }),
  reset: () => set({
    conn: null,
    status: 'idle',
    mode: null,
    file: null,
    files: [],
    progress: 0,
    error: null,
    isPeerReady: false,
    readyToDownload: null,
    fileHash: null,
    textContent: null,
    transferStartTime: null,
    transferSpeed: 0,
    transferredBytes: 0
    // We keep 'peer', 'myId', and 'codeExpiry' to avoid reconnecting
  }),
  fullReset: () => set({
    myId: null,
    peer: null,
    conn: null,
    status: 'idle',
    mode: null,
    file: null,
    files: [],
    progress: 0,
    error: null,
    isPeerReady: false,
    readyToDownload: null,
    fileHash: null,
    codeExpiry: null,
    textContent: null,
    transferStartTime: null,
    transferSpeed: 0,
    transferredBytes: 0
  })
}))
