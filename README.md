# HashDrop 🚀

A **secure, peer-to-peer file transfer application** built with Next.js and WebRTC. Share files directly between devices at lightspeed. **No cloud, no limits, no tracking.**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

<img width="1582" height="960" alt="Screenshot 2026-01-10 at 17 23 39" src="https://github.com/user-attachments/assets/b9e1b76d-7ffa-4854-8d49-c4c197cd06ab" />

## ✨ Features

### 🔒 **Security & Privacy**
- **End-to-End Encryption**: WebRTC DTLS/SRTP encryption (same as Zoom, Google Meet)
- **SHA-256 File Verification**: Cryptographic hashing ensures file integrity
- **No Cloud Storage**: Files never touch our servers or any cloud storage
- **Zero Data Retention**: No logs, no tracking, no metadata storage
- **Code-Based Access Control**: Only the person with the unique code can access files
- **Single Connection Limit**: Prevents unauthorized access even if code is leaked
- **5-Minute Code Expiry**: Transfer codes automatically expire for security

### ⚡ **Performance & Reliability**
- **Direct P2P Transfer**: Files stream directly between devices via WebRTC
- **Real-time Progress**: Live progress tracking with speed and ETA
- **Automatic Download**: Files download automatically when transfer completes
- **Duplicate Chunk Protection**: Ensures data integrity during transfer
- **File Size Validation**: Supports files up to 10GB with built-in DoS protection
- **Resumable Transfers**: Robust chunk-based transfer system

### 🎨 **User Experience**
- **Human-Readable Codes**: Easy-to-share transfer codes (e.g., "Cosmic-Falcon")
- **QR Code Sharing**: Instant connection via QR code scanning
- **Dynamic OG Images**: Beautiful link previews with transfer codes for Discord, Twitter, etc.
- **Auto-Copy Toggle**: Optional clipboard auto-copy (privacy-first)
- **Transfer History**: Track your recent transfers with statistics
- **Image Preview**: Preview images before downloading
- **Keyboard Shortcuts**: Fast navigation with keyboard commands
- **Responsive Design**: Works seamlessly on desktop and mobile

### 🌐 **Zero Friction**
- **No Account Required**: Completely anonymous, no signup
- **No Installation**: Works directly in the browser
- **Cross-Platform**: Works on any device with a modern browser
- **Text Sharing**: Share text and links instantly

---

## 🛡️ Security Enhancements (Latest)

### **Critical Security Fixes**
✅ **Multi-Connection Prevention**: Only the first peer can connect, preventing unauthorized access
✅ **Enhanced Code Entropy**: 6,400 possible combinations (80×80) vs previous 1,600
✅ **Duplicate Chunk Detection**: Protects against data corruption attacks
✅ **File Size Limits**: 10GB maximum file size to prevent DoS
✅ **Chunk Count Limits**: Maximum 1M chunks to prevent memory exhaustion
✅ **Input Validation**: All user inputs sanitized and validated (XSS protection)
✅ **OG Image Security**: Transfer code parameters validated in Open Graph images

### **Privacy-First Design**
✅ **Auto-Copy Disabled by Default**: Clipboard permission only requested when user enables it
✅ **Transparent Security**: Detailed "How Does It Work?" section educates users
✅ **Warning Messages**: Clear warnings about code sharing best practices

---

## 🚀 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **P2P** | PeerJS 1.5.4 (WebRTC wrapper) |
| **State** | Zustand 5.0.2 |
| **Styling** | Tailwind CSS v4.1 |
| **Animations** | Framer Motion 12.23 |
| **UI Components** | Lucide React (icons), Sonner (toasts) |
| **File Handling** | JSZip, React Dropzone |
| **Charts** | Recharts 3.6 |
| **Testing** | Jest 29, React Testing Library 16 |

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/metesahankurt/hashdrop.git
   cd hashdrop
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   - Go to [http://localhost:3000](http://localhost:3000)
   - Open in **two different browsers** (e.g., Chrome and Firefox) to test file transfer locally

### Build for Production

```bash
npm run build
npm run start
```

---

## 🧪 Testing

Run unit tests:
```bash
npm run test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

---

## 📁 Project Structure

```
hashdrop/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # Root layout with metadata
│   │   ├── page.tsx                 # Home page
│   │   ├── api/
│   │   │   └── og/                  # Open Graph image generation
│   │   ├── privacy/                 # Privacy policy page
│   │   └── terms/                   # Terms of service page
│   │
│   ├── components/
│   │   ├── layout/                  # Layout components
│   │   │   ├── minimal-header.tsx   # Header with logo
│   │   │   └── hamburger-menu.tsx   # Settings menu
│   │   │
│   │   ├── transfer/                # Core transfer logic
│   │   │   ├── connection-manager.tsx   # P2P connection & codes (730 lines)
│   │   │   ├── transfer-status.tsx      # Progress tracking (430 lines)
│   │   │   ├── warp-dropzone.tsx        # File upload
│   │   │   ├── text-share.tsx           # Text/link sharing
│   │   │   └── qr-code-display.tsx      # QR code generation
│   │   │
│   │   └── ui/                      # UI components
│   │       ├── transfer-history.tsx     # Transfer history modal
│   │       ├── statistics-dashboard.tsx # Statistics panel
│   │       ├── image-preview-modal.tsx  # Image preview
│   │       ├── info-section.tsx         # Informational content
│   │       └── keyboard-shortcuts-modal.tsx
│   │
│   ├── lib/                         # Utilities
│   │   ├── code-generator.ts        # Secure code generation
│   │   ├── file-hash.ts             # SHA-256 hashing
│   │   ├── file-utils.ts            # File helpers
│   │   ├── storage.ts               # LocalStorage management
│   │   ├── preferences.ts           # User preferences
│   │   ├── notifications.ts         # Browser notifications
│   │   ├── error-handler.ts         # Error handling
│   │   ├── animations.ts            # Framer Motion configs
│   │   └── zip-utils.ts             # Multi-file compression
│   │
│   └── store/
│       └── use-warp-store.ts        # Zustand global state
│
├── __tests__/                       # Jest unit tests
├── public/                          # Static assets
└── package.json
```

---

## 🔐 How It Works

### Transfer Flow

```
1. SENDER
   ↓
   Drops file → Generates unique code (e.g., "Cosmic-Falcon")
   ↓
   Code displayed with QR code
   ↓
   Shares code via secure channel (WhatsApp, Signal, email)
   ↓
   Waits for receiver to connect

2. RECEIVER
   ↓
   Enters code or scans QR code
   ↓
   Clicks "Connect"

3. PEER CONNECTION (via PeerJS)
   ↓
   Both peers connect to signaling server (only for discovery)
   ↓
   WebRTC establishes direct encrypted connection (DTLS/SRTP)
   ↓
   Signaling server no longer involved

4. FILE TRANSFER
   ↓
   Sender calculates SHA-256 hash
   ↓
   Sends metadata (filename, size, hash)
   ↓
   File split into 16KB chunks (base64 encoded)
   ↓
   Chunks sent with index numbers
   ↓
   Receiver reassembles chunks in order
   ↓
   Receiver calculates SHA-256 hash
   ↓
   Hash verification (match = success ✅)
   ↓
   Auto-download triggers (if enabled)
```

### Security Layers

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Transport** | WebRTC DTLS | Encrypts data in transit |
| **Data Channel** | SRTP | Secure real-time protocol |
| **Integrity** | SHA-256 | Detects tampering/corruption |
| **Access Control** | Unique Codes | Prevents unauthorized access |
| **Connection Limit** | Single Peer | Blocks multi-recipient attacks |
| **Privacy** | No Logging | Zero data retention |

---

## 🎯 Key Features Explained

### 1. **Code Generation**
- **Format**: Adjective-Noun (e.g., "Cosmic-Falcon", "Stellar-Phoenix")
- **Entropy**: 12.6 bits (6,400 combinations)
- **Random Source**: Web Crypto API (cryptographically secure)
- **Expiry**: 5 minutes automatic expiration

### 2. **File Transfer Protocol**
- **Chunk Size**: 16KB per chunk
- **Encoding**: Base64 for binary data
- **Ordering**: Index-based reassembly
- **Verification**: SHA-256 hash check

### 3. **Security Mechanisms**
- **Single Connection**: Only first peer accepted
- **Duplicate Rejection**: Chunks validated by index
- **Size Limits**: 10GB max file size
- **Chunk Limits**: 1M chunks maximum
- **Hash Mismatch**: Transfer rejected if hash fails

### 4. **User Preferences**
- **Auto-Copy Code**: Optional (default: OFF)
- **Auto-Download**: Optional (default: ON)
- **Error Notifications**: Optional (default: ON)

---

## ⚙️ Configuration

### Environment Variables
No environment variables required! HashDrop is 100% client-side.

### User Preferences
Accessible via hamburger menu (top-right):
- **Auto-copy Code**: Automatically copy transfer codes to clipboard
- **Auto-download Files**: Automatically download files when transfer completes
- **Error Notifications**: Show browser notifications for errors

### Keyboard Shortcuts
- `Cmd/Ctrl + K`: Toggle transfer history
- `Cmd/Ctrl + S`: Toggle statistics dashboard
- `Cmd/Ctrl + ?`: Show keyboard shortcuts
- `ESC`: Close all modals

---

## 🐛 Known Limitations

1. **NAT Traversal**: Some restrictive firewalls may block WebRTC connections (TURN server not configured)
2. **Browser Compatibility**: Requires modern browser with WebRTC support
3. **File Size**: Practical limit ~10GB (browser memory constraints)
4. **Connection**: Both users must be online simultaneously

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Mete Şahan Kurt**

- 🌐 Portfolio: [metesahankurt.cloud](https://metesahankurt.cloud)
- 💼 LinkedIn: [linkedin.com/in/mete-sahan-kurt](https://www.linkedin.com/in/mete-sahan-kurt/)
- 🐙 GitHub: [github.com/metesahankurt](https://github.com/metesahankurt)

---

## 🙏 Acknowledgments

- **PeerJS**: Simplified WebRTC wrapper
- **Next.js**: Amazing React framework
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Beautiful animations
- **Vercel**: Hosting and deployment

---

## 🔮 Roadmap

- [ ] End-to-end file encryption (AES-256)
- [ ] Password-protected transfers
- [ ] TURN server configuration (better NAT traversal)
- [ ] Transfer resume capability
- [ ] Mobile app (React Native)
- [ ] Batch file compression optimization
- [ ] Custom branding options

---

## 📊 Statistics

- **Code Entropy**: 12.6 bits (6,400 combinations)
- **Max File Size**: 10GB
- **Chunk Size**: 16KB
- **Code Expiry**: 5 minutes
- **Encryption**: DTLS/SRTP (AES-128/256)
- **Hash Algorithm**: SHA-256

---

<div align="center">

**Made with ❤️ by Mete Şahan Kurt**

⭐ Star this repo if you found it useful!

[Live Demo](https://hashdrop.metesahankurt.cloud) • [Report Bug](https://github.com/metesahankurt/hashdrop/issues) • [Request Feature](https://github.com/metesahankurt/hashdrop/issues)

</div>
