# HashDrop 🚀

A **secure, unified ecosystem for peer-to-peer file sharing, video conferencing, and real-time chat** built with Next.js, React Native (Expo), WebRTC, and LiveKit. 
Sharing data directly and securely between devices at lightning speeds. **No cloud storage, zero data retention, and no tracking.**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-Expo-blue?style=flat&logo=react)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

<img width="1582" height="960" alt="HashDrop Web UI" src="https://github.com/user-attachments/assets/b9e1b76d-7ffa-4854-8d49-c4c197cd06ab" />

## 🌐 The HashDrop Ecosystem

HashDrop goes beyond a single web app; it is a full cross-platform suite consisting of a powerful **Web Application** and a fully-featured **Mobile App** (iOS/Android), designed to break down the walls between your devices seamlessly. 

Whether you are dropping a heavy 10GB video file to a colleague, jumping into a high-quality video conference, or sending a quick snippet of text, HashDrop provides a unified, frictionless experience.

---

## ✨ Core Features

### 📁 1. Secure Peer-to-Peer File Transfer
- **Direct Device-to-Device Stream**: Files are transferred directly between peers via WebRTC. Once sent, it's gone.
- **Zero Cloud Storage**: Files never touch our backend servers or any intermediary cloud. 
- **10GB Maximum Capacity**: Extremely high capacity with a chunk-based resumble transfer system.
- **SHA-256 Verification**: Cryptographic hashing ensures your file arrives exactly as it was sent without corruption.
- **Duplicate Chunk Protection**: Robust built-in DoS protection during the transfer execution.

### 📹 2. High-Capacity Video Conferencing
- **Powered by LiveKit**: Utilizing the robust LiveKit SDK for low-latency, scalable WebRTC room architecture.
- **Multi-Participant Support**: Scales effortlessly up to 50 active participants in a single conference.
- **Cross-Platform Compatibility**: Users can join the same room seamlessly from a web browser or from the native mobile app.
- **Dynamic Layout Focus**: Smooth horizontal picture-in-picture stream layout, with an interactive zoom view for screen shares or crucial details.
- **Hardware Optimized**: Fully optimized camera and microphone handling natively on iOS and Android.

### 💬 3. Real-Time Chat Rooms & Text Sharing
- **Transient Chat Rooms**: Create disposable, secure chat environments instantly. 
- **Universal Text Sharing**: Send a quick URL, a paragraph of text, or code snippets instantly across devices. 

### 📱 4. Native Mobile Application (iOS & Android)
- **Built with Expo**: 100% native feel utilizing the power of React Native.
- **Integrated QR Code Scanner**: Utilize your device's camera to join rooms, receive files, or connect instantly by scanning the Web client's QR display.
- **Haptic Integrations**: Sensorial feedback on successful file transfers or room joins.

---

## 🔒 Security & Privacy (The "Zero Trust" Approach)

HashDrop is built with absolute privacy as its foundation.

✅ **End-to-End Encryption**: WebRTC DTLS/SRTP encryption is standard (the same protocols used by Zoom and Google Meet). <br/>
✅ **No Account Required**: Completely anonymous. No emails, no usernames, no tracking, no signups. <br/>
✅ **Human-Readable, Ephemeral Codes**: Connections utilize secure adjective-noun codes (e.g., "Cosmic-Falcon"). These have 6,400 entropy combinations and **expire automatically in 5 minutes**. <br/>
✅ **Single Connection Constraint**: Only the *first* peer who types the code connects. This entirely prevents multi-recipient eavesdropping attacks. <br/>
✅ **No Metadata Storage**: Zero logs on the signaling server. <br/>
✅ **Opt-In Auto-Copy**: Clipboard interactions are privacy-first and user-initiated.

---

## 🚀 Technical Stack

### Web Platform
* **Framework**: Next.js 16 (App Router, Turbopack)
* **Language**: TypeScript 5
* **State Management**: Zustand 5
* **P2P Communication**: PeerJS 1.5.4
* **Video/Audio Streaming**: LiveKit Client (React Components)
* **Styling & Animation**: Tailwind CSS v4, Framer Motion
* **Testing**: Jest 29, React Testing Library

### Mobile Platform (iOS/Android)
* **Framework**: React Native (via Expo 54)
* **Routing**: Expo Router
* **Video/Audio**: `@livekit/react-native`
* **Camera / QR**: `expo-camera`
* **Storage**: Async Storage

---

## 📦 Getting Started & Installation

### Prerequisites
- Node.js 18+ and npm
- (Optional, for Mobile) Expo Go app on your phone, or iOS Simulator / Android Emulator.

### Setting up the Core Web App
1. **Clone the repository**:
   ```bash
   git clone https://github.com/metesahankurt/hashdrop.git
   cd hashdrop
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run the Next.js development server**:
   ```bash
   npm run dev
   ```
   *Available at [http://localhost:3000](http://localhost:3000)*

### Setting up the Mobile App
1. Navigate to the mobile workspace:
   ```bash
   cd mobile
   ```
2. **Install mobile dependencies**:
   ```bash
   npm install
   ```
3. **Run the Expo development client**:
   ```bash
   npm start
   ```
   *(You can scan the QR code via Expo Go to run on a physical device, or press `i` for iOS simulator / `a` for Android emulator).*

---

## 📁 System Architecture

```
hashdrop/
├── src/                          # NEXT.JS WEB APP
│   ├── app/                      # App router, API endpoints, LiveKit Webhooks
│   ├── components/               # Web UI (Transfer UI, Conference UI, Chat UI)
│   ├── hooks/                    # Custom React Hooks
│   ├── lib/                      # Cryptography, Hash Validation, P2P Logic, File Mgmt
│   ├── store/                    # Zustand Global States
│   └── types/                    # Shared TypeScript interfaces
│
├── mobile/                       # EXPO NATIVE APP
│   ├── app/                      # React Native Navigation Routes
│   ├── components/               # Mobile specific UI (QR Scanners, Camera Views)
│   ├── constants/                # Theme, Layout configurations
│   ├── hooks/                    # Mobile specific hooks
│   └── ios/ & android/           # Pre-build native directories
│
├── __tests__/                    # Jest Test Suites
└── public/                       # Static Assets
```

---

## 🔐 How It Works Under The Hood

### The Peer-to-Peer Lifecycle:
1. **Initiation**: Sender drops a file. HashDrop generates a cryptographically secure phrase (e.g., "Neon-Tiger") via the Web Crypto API.
2. **Signaling**: The phrase is registered on the signaling server, awaiting a match.
3. **Discovery**: Receiver inputs "Neon-Tiger" on their Web or Mobile client.
4. **Handshake**: Both peers negotiate a WebRTC connection. A direct, encrypted data tunnel (DTLS/SRTP) locks them together.
5. **Drop**: The signaling server steps away. The file is split into 16KB binary chunks, sequenced, and streamed directly across the internet to the receiver.
6. **Verification**: The receiver reassembles the chunks, computes a final SHA-256 hash, and automatically downloads the verified file.

### Video Conferencing Logic:
1. Powered by a lightweight LiveKit server implementation (`livekit-server-sdk` in Next.js APIs).
2. Users request a temporary token via API to join a dynamically created room context.
3. WebRTC handles complex topological mesh networking internally, keeping bandwidth consumption globally low while supporting dozens of cameras simultaneously.

---

## 🤝 Contributing

Contributions are more than welcome to make HashDrop the definitive open-source P2P utility. Feel free to open a PR!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-expansion`)
3. Commit your changes (`git commit -m 'Add amazing expansion'`)
4. Push to the branch (`git push origin feature/amazing-expansion`)
5. Open a Pull Request

---

## 📄 License & Terms

This project is licensed under the **MIT License** - see the `LICENSE` file for details. Respect user privacy. Always check the `Privacy Policy` within the application layout.

---

## 👨‍💻 Author

**Mete Şahan Kurt**

- 🌐 Portfolio: [metesahankurt.cloud](https://metesahankurt.cloud)
- 💼 LinkedIn: [linkedin.com/in/mete-sahan-kurt](https://www.linkedin.com/in/mete-sahan-kurt/)
- 🐙 GitHub: [github.com/metesahankurt](https://github.com/metesahankurt)

<div align="center">
<br/>

**Made with ❤️ by Mete Şahan Kurt**

⭐️ Star this repo if you found it useful!

[Live Demo](https://hashdrop.metesahankurt.cloud) • [Report Bug](https://github.com/metesahankurt/hashdrop/issues)
</div>
