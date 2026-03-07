"use client";

import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MinimalHeader } from "@/components/layout/minimal-header";
import { SignatureBadge } from "@/components/ui/signature-badge";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import { TransferView } from "@/components/transfer/transfer-view";
import { VideoCallView } from "@/components/videocall/video-call-view";
import { ChatRoomView } from "@/components/chatroom/chat-room-view";
import { WithUsernameGate } from "@/components/ui/username-gate";
import { IncomingRequestScreen } from "@/components/ui/incoming-request-screen";
import { Video, Send, MessageSquare } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] as const },
  },
};

// Determine which mode an incoming link targets
function getIncomingMode(mode: string | null, code: string | null): 'transfer' | 'videocall' | 'chatroom' | null {
  if (mode === 'videocall' && code) return 'videocall'
  if (mode === 'chatroom' && code) return 'chatroom'
  if (code && !mode) return 'transfer'
  return null
}

function AppContent() {
  const searchParams = useSearchParams();
  const { appMode, setAppMode } = useAppStore();
  const [initialized, setInitialized] = useState(false);

  // Incoming link state
  const [pendingMode, setPendingMode] = useState<'transfer' | 'videocall' | 'chatroom' | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [pendingHasPassword, setPendingHasPassword] = useState(false);

  useEffect(() => {
    if (initialized) return;
    const code = searchParams.get("code");
    const mode = searchParams.get("mode");
    const from = searchParams.get("from");
    const pwd = searchParams.get("pwd");
    const incoming = getIncomingMode(mode, code);

    if (incoming) {
      // Show accept/decline screen instead of jumping straight in
      setPendingMode(incoming);
      setPendingCode(code);
      setPendingFrom(from);
      setPendingHasPassword(pwd === '1');
    }
    setInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAccept = () => {
    if (!pendingMode) return;
    setAppMode(pendingMode);
    setPendingMode(null);
  };

  const handleDecline = () => {
    setPendingMode(null);
    setPendingCode(null);
    setPendingFrom(null);
    setAppMode('welcome');
    // Clear URL params
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/')
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  // Show incoming request screen for external link/QR opens
  if (pendingMode && pendingCode) {
    return (
      <>
        <MinimalHeader />
        <IncomingRequestScreen
          mode={pendingMode}
          from={pendingFrom}
          code={pendingCode}
          hasPassword={pendingHasPassword}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
        <footer className="fixed bottom-6 left-6 z-40">
          <SignatureBadge />
        </footer>
      </>
    );
  }

  return (
    <>
      {appMode !== "welcome" && <MinimalHeader />}

      <AnimatePresence mode="wait" initial={false}>
        {appMode === "welcome" && (
          <motion.div key="welcome" {...pageTransition}>
            <WelcomeScreen />
          </motion.div>
        )}

        {appMode === "transfer" && (
          <motion.div key="transfer" {...pageTransition}>
            <WithUsernameGate
              icon={<Send className="w-7 h-7 text-primary" />}
              title="File"
              highlight="Transfer"
              description="Peer-to-peer file transfer. No cloud, no limits."
              hint="Your username will be visible to the other party"
              mode="transfer"
              skipEntry={!!pendingCode}
            >
              {(_username, action) => <TransferView initialAction={action} />}
            </WithUsernameGate>
          </motion.div>
        )}

        {appMode === "videocall" && (
          <motion.div key="videocall" {...pageTransition}>
            <WithUsernameGate
              icon={<Video className="w-7 h-7 text-primary" />}
              title="Video"
              highlight="Call"
              description="Encrypted peer-to-peer video call. Up to 5 participants."
              hint="Your username will be shown to other participants"
              mode="videocall"
              skipEntry={!!pendingCode}
            >
              {(_username, action) => <VideoCallView initialAction={action} />}
            </WithUsernameGate>
          </motion.div>
        )}

        {appMode === "chatroom" && (
          <motion.div key="chatroom" {...pageTransition}>
            <WithUsernameGate
              icon={<MessageSquare className="w-7 h-7 text-primary" />}
              title="Chat"
              highlight="Room"
              description="Instant encrypted messaging rooms. Up to 5 people."
              hint="You will appear in the chat room with this name"
              mode="chatroom"
              skipEntry={!!pendingCode}
              skipToJoin={!!pendingCode}
            >
              {(username, action) => (
                <ChatRoomView
                  initialUsername={username}
                  initialAction={action}
                  incomingHasPassword={pendingHasPassword}
                />
              )}
            </WithUsernameGate>
          </motion.div>
        )}
      </AnimatePresence>

      {appMode === "welcome" && (
        <footer className="fixed bottom-6 left-6 z-40 hidden md:block">
          <SignatureBadge />
        </footer>
      )}
    </>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted">Loading...</div>
        </div>
      }
    >
      <AppContent />
    </Suspense>
  );
}
