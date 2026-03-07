# HashDrop Transfer Flow - Quick Reference Guide

## Files You Need to Know

### Core Transfer Components
- **`src/components/transfer/transfer-view.tsx`** - Main container (140 lines)
- **`src/components/transfer/connection-manager.tsx`** - P2P logic (987 lines) ⭐ MOST COMPLEX
- **`src/components/transfer/transfer-status.tsx`** - Progress & actions (538 lines)
- **`src/components/transfer/warp-dropzone.tsx`** - File selection (255 lines)
- **`src/components/transfer/text-share.tsx`** - Text messaging (225 lines)

### State Management
- **`src/store/use-warp-store.ts`** - Zustand store (173 lines) ⭐ CENTRAL STATE

### Utilities
- **`src/lib/code-generator.ts`** - Code generation (94 lines)
- **`src/lib/animations.ts`** - Animation variants (63 lines)
- **`src/lib/file-hash.ts`** - SHA-256 hashing
- **`src/lib/zip-utils.ts`** - Multi-file compression
- **`src/lib/notifications.ts`** - Browser notifications

---

## State Machine: 8 Status Values

```
'idle'        → Initial state, waiting for action
'generating'  → Creating transfer (rare, short-lived)
'ready'       → Code generated, waiting for peer
'connecting'  → Attempting to establish P2P connection
'connected'   → Handshake complete, ready to send/receive
'transferring'→ Files actively being sent/received
'completed'   → Transfer successful, ready for download
'failed'      → Error occurred, needs retry
```

---

## User Flow at a Glance

### Sender (5 Steps)
1. **Select Files** → Drag/drop in WarpDropzone
2. **Share Code** → Copy/QR code shown in ConnectionManager
3. **Wait for Connection** → Status shows "idle" → "connecting" → "connected"
4. **Send File** → Click "Send Now" button in TransferStatus
5. **Done** → Click "Send Another" to repeat

### Receiver (4 Steps)
1. **Enter Code** → Type sender's code or scan QR
2. **Connect** → Status "connecting" → "connected"
3. **Receive File** → Chunks arrive, progress bar fills
4. **Download** → Click "Download File" button

---

## Key Data Structures

### Transfer Message Protocol
```javascript
// 1. Text (optional)
{ type: 'text-message', content: string, hasFile: boolean }

// 2. File metadata
{ type: 'file-meta', name, size, fileType, hash }

// 3. File chunks (repeated)
{ type: 'chunk', data: base64String, index: number }

// 4. Completion
{ type: 'transfer-complete' }

// 5. Handshake
{ type: 'ready' }
```

### Store State Overview
```typescript
// Connection
myId: string | null              // My PeerJS ID
peer: Peer | null                // Peer instance
conn: DataConnection | null       // Active connection
status: TransferStatus            // Current state
mode: 'send' | 'receive' | 'text' // What am I doing?

// Files
files: File[]                     // Selected files
progress: number                  // 0-100
fileHash: string | null           // SHA-256

// Metrics
transferStartTime: number | null
transferredBytes: number
transferSpeed: number             // MB/s

// Logs
consoleLogs: ConsoleLog[]         // Last 10 events
```

---

## Component Communication Flow

```
User Action
    ↓
UI Component (WarpDropzone, ConnectionManager, etc)
    ↓
Call store function: setFiles(), setStatus(), etc
    ↓
Zustand Store Updates (use-warp-store.ts)
    ↓
Other components re-render (via useWarpStore hook)
    ↓
DOM updates, animations trigger
```

---

## Animation Timings

- **Fast interactions**: 0.15s (file list, chunk items)
- **Standard transitions**: 0.2-0.3s (modals, status changes)
- **Hero animations**: 0.4s (page intro)
- **Progress bar**: 0.2s easing

All use Material Design ease curve: `[0.4, 0, 0.2, 1]`

---

## Mobile Breakpoints (Tailwind)

```
base (0px)    → Mobile defaults
sm: 640px     → Small screens
md: 768px     → Tablets
lg: 1024px    → Desktops
```

Most components use `md:` variants for scaling up.

---

## Security Quick Facts

- **Code entropy**: 80 adjectives × 80 nouns = 6,400 combinations
- **Max file size**: 10GB
- **Max chunks**: 1,000,000
- **Chunk size**: 16KB
- **Hash algorithm**: SHA-256
- **Encoding**: Base64 (binary → JSON safe)
- **Connection**: WebRTC (encrypted)
- **Servers**: STUN + TURN (for NAT traversal)

---

## Common Operations

### Start File Transfer
```typescript
const { setFiles, setMode } = useWarpStore()
// User drops files
setFiles(acceptedFiles)  // Store files
setMode('send')          // Set to send mode
```

### Generate New Code
```typescript
const { setCodeExpiry } = useWarpStore()
const newCode = generateSecureCode()  // "Cosmic-Falcon"
const peerId = codeToPeerId(newCode)  // "sr-warp-cosmic-falcon"
const expiry = Date.now() + 5*60*1000 // 5 minutes
setCodeExpiry(expiry)
```

### Update Progress
```typescript
const { setProgress, setTransferredBytes, setTransferSpeed } = useWarpStore()
setProgress((i + 1) / totalChunks * 100)
setTransferredBytes(totalSent)
// Speed calculated every 500ms in useEffect
```

### Handle Completion
```typescript
const { setStatus, setReadyToDownload } = useWarpStore()
setStatus('completed')
setReadyToDownload(file)  // Makes download button appear
```

---

## Debugging Tips

### Check Store State
```typescript
// In browser console
import { useWarpStore } from '@/store/use-warp-store'
useWarpStore.getState()  // See all current state
```

### Monitor Connection
```javascript
// Connection manager logs all P2P events
// Check browser console for [Peer], [Send], [Receive] logs
// Also check ConsoleDisplay component UI for high-level status
```

### Test File Transfer
```typescript
// Create small 1MB test file:
const blob = new Blob([new ArrayBuffer(1024*1024)], {type: 'application/octet-stream'})
const testFile = new File([blob], 'test.bin')
```

---

## Performance Characteristics

### Transfer Speed Factors
- **Network**: Most important (peer latency, bandwidth)
- **Device**: CPU for base64 encoding/decoding
- **File Type**: No difference (binary agnostic)
- **Chunk Size**: 16KB is optimal (tested)

### Memory Usage
- **Sender**: One file in memory (entire file)
- **Receiver**: Chunks stored as Blobs (efficient)
- **Cleanup**: Comprehensive on completion/error

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Code unavailable-id" error | Code already in use | Click refresh button for new code |
| 20s connection timeout | Peer unreachable | Verify code, check if sender is online |
| Hash mismatch warning | Network corruption (rare) | Retry or contact support |
| Mobile keyboard obscures input | Browser behavior | Code handles with font-size workaround |
| Large file slow | Network limited | Expected, shows speed in UI |
| QR scanner permission denied | Browser permission | Grant camera access |

---

## File Locations Summary

```
src/
├── components/transfer/
│   ├── transfer-view.tsx          ← Root component
│   ├── connection-manager.tsx     ← Most complex (P2P logic)
│   ├── transfer-status.tsx        ← Progress display
│   ├── warp-dropzone.tsx          ← File selection
│   ├── text-share.tsx             ← Text messaging
│   ├── qr-code-display.tsx        ← QR display
│   └── qr-scanner.tsx             ← QR reading
│
├── store/
│   └── use-warp-store.ts          ← Central state (173 lines)
│
├── lib/
│   ├── code-generator.ts          ← Secure codes
│   ├── animations.ts              ← Motion variants
│   ├── file-hash.ts               ← SHA-256
│   ├── zip-utils.ts               ← Compression
│   ├── notifications.ts           ← Alerts
│   └── ...
│
└── app/
    ├── page.tsx                   ← Main entry
    └── globals.css                ← Styling
```

---

## Testing Checklist

- [ ] Upload single file → download → verify hash matches
- [ ] Upload multiple files → download as zip → extract → verify
- [ ] Send text only → receive text
- [ ] Send text + file → receive both
- [ ] Cancel mid-transfer → error handling works
- [ ] Network interruption → timeout occurs → can retry
- [ ] Mobile sender to desktop receiver
- [ ] Desktop sender to mobile receiver
- [ ] Large file (500MB+) → speed tracking works
- [ ] QR code scan → auto-connect
- [ ] Code expiry after 5 minutes → new code generated

