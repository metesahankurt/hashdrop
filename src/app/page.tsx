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
import { Video, Send, MessageSquare } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

function AppContent() {
  const searchParams = useSearchParams();
  const { appMode, setAppMode } = useAppStore();
  const [initialized, setInitialized] = useState(false);

  // Detect URL params and set correct mode IMMEDIATELY on first render
  useEffect(() => {
    if (initialized) return;

    const code = searchParams.get("code");
    const mode = searchParams.get("mode");

    if (mode === "videocall") {
      setAppMode("videocall");
    } else if (mode === "chatroom") {
      setAppMode("chatroom");
    } else if (code) {
      setAppMode("transfer");
    }
    setInitialized(true);
  }, [searchParams, initialized, setAppMode]);

  // Also handle subsequent URL param changes
  useEffect(() => {
    if (!initialized) return;

    const code = searchParams.get("code");
    const mode = searchParams.get("mode");

    if (mode === "videocall" && appMode === "welcome") {
      setAppMode("videocall");
    } else if (code && appMode === "welcome") {
      setAppMode("transfer");
    }
  }, [searchParams, appMode, setAppMode, initialized]);

  // Don't render until we've checked URL params (prevents Welcome screen flash)
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Header - hidden on welcome screen */}
      {appMode !== "welcome" && <MinimalHeader />}

      <AnimatePresence mode="wait">
        {appMode === "welcome" && (
          <motion.div key="welcome" {...pageTransition}>
            <WelcomeScreen />
          </motion.div>
        )}

        {appMode === "transfer" && (
          <motion.div key="transfer" {...pageTransition}>
            <WithUsernameGate
              icon={<Send className="w-7 h-7 text-primary" />}
              title="Dosya"
              highlight="Transferi"
              description="Peer-to-peer dosya transferi. Bulut yok, limit yok."
              hint="Kullanıcı adın diğer tarafta gözükür"
            >
              {() => <TransferView />}
            </WithUsernameGate>
          </motion.div>
        )}

        {appMode === "videocall" && (
          <motion.div key="videocall" {...pageTransition}>
            <WithUsernameGate
              icon={<Video className="w-7 h-7 text-primary" />}
              title="Görüntülü"
              highlight="Görüşme"
              description="Şifreli peer-to-peer video görüşmesi. 5 kişiye kadar."
              hint="Kullanıcı adın diğer katılımcılara gösterilecek"
            >
              {() => <VideoCallView />}
            </WithUsernameGate>
          </motion.div>
        )}

        {appMode === "chatroom" && (
          <motion.div key="chatroom" {...pageTransition}>
            <WithUsernameGate
              icon={<MessageSquare className="w-7 h-7 text-primary" />}
              title="Sohbet"
              highlight="Odası"
              description="Anlık şifreli mesajlaşma odaları. 5 kişiye kadar."
              hint="Sohbet odasında bu isimle görüneceksin"
            >
              {(username) => <ChatRoomView initialUsername={username} />}
            </WithUsernameGate>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Footer - Bottom Left */}
      <footer className="fixed bottom-6 left-6 z-40">
        <SignatureBadge />
      </footer>
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
