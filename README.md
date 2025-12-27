# HashDrop

A secure, peer-to-peer file transfer application built with Next.js and WebRTC. Share files directly between devices with lightspeed. No cloud, no limits. Powered by WebRTC.

## Features

- **Direct P2P File Transfer**: Files stream directly between devices via WebRTC
- **End-to-End Encryption**: DTLS/SRTP encryption ensures secure transmission
- **SHA-256 Verification**: File integrity verification with cryptographic hashing
- **No Cloud Storage**: Files never leave your device until you send them
- **Human-Readable Codes**: Easy-to-share transfer codes
- **No Account Required**: Completely anonymous, no signup or tracking
- **Real-time Progress**: Live progress tracking during transfer

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **P2P**: PeerJS (WebRTC wrapper)
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Testing**: Jest + React Testing Library

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in **two different browsers** (e.g., Chrome and Firefox) to test file transfer locally.

## Testing

Run unit tests:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Project Structure

```
zapshare/
├── src/
│   ├── app/                  # Next.js app directory
│   ├── components/
│   │   ├── layout/          # Layout components
│   │   ├── transfer/        # Dropzone, ConnectionManager, Status
│   │   └── ui/              # UI components
│   ├── lib/                 # Utilities (code-generator, file-hash, animations)
│   └── store/               # Zustand state management
├── __tests__/               # Jest unit tests
└── public/                  # Static assets
```

## How It Works

1. **Sender** drops a file → Gets a unique human-readable code
2. **Receiver** enters the code on their device
3. **PeerJS** helps devices find each other (signaling only)
4. **WebRTC** establishes direct encrypted connection (DTLS/SRTP)
5. **File streams** in chunks with real-time progress tracking
6. **SHA-256 verification** ensures file integrity
7. **Receiver** downloads the file securely

No cloud servers touch your files. Ever.

## Security

- **WebRTC Encryption**: DTLS/SRTP (same as Zoom, Google Meet)
- **SHA-256 Hashing**: File integrity verification (✅ implemented)
- **No Server Storage**: Files never leave your device until you click "Send"
- **Code Expiration**: Codes expire after 5 minutes
- **Chunk Ordering**: Index-based reassembly prevents corruption

## Author

**Mete Şahan Kurt**

- LinkedIn: [linkedin.com/in/mete-sahan-kurt](https://www.linkedin.com/in/mete-sahan-kurt/)
- GitHub: [github.com/metesahankurt](https://github.com/metesahankurt)

## License

MIT
