"use client";

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MinimalHeader } from "@/components/layout/minimal-header";
import { ChatRoomView } from "@/components/chatroom/chat-room-view";
import { WithUsernameGate } from "@/components/ui/username-gate";
import { IncomingRequestScreen } from "@/components/ui/incoming-request-screen";
import { MessageSquare } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

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

function ChatRoomContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [showIncoming, setShowIncoming] = useState(false);

  useEffect(() => {
    if (initialized) return;
    const code = searchParams.get("code");
    const from = searchParams.get("from");

    if (code) {
      setPendingCode(code);
      setPendingFrom(from);
      setShowIncoming(true);
    }
    setInitialized(true);
  }, [initialized, searchParams]);

  const handleAccept = () => {
    setShowIncoming(false);
  };

  const handleDecline = () => {
    setPendingCode(null);
    setPendingFrom(null);
    setShowIncoming(false);
    router.push('/chatroom');
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  if (showIncoming && pendingCode) {
    return (
      <>
        <MinimalHeader />
        <IncomingRequestScreen
          mode="chatroom"
          from={pendingFrom}
          code={pendingCode}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      </>
    );
  }

  return (
    <>
      <MinimalHeader />
      <motion.div {...pageTransition}>
        <WithUsernameGate
          icon={<MessageSquare className="w-7 h-7 text-primary" />}
          title="Chat"
          highlight="Room"
          description="Instant encrypted messaging rooms. Up to 5 people."
          hint="You will appear in the chat room with this name"
          mode="chatroom"
          skipEntry={!!pendingCode}
        >
          {(username, action) => <ChatRoomView initialUsername={username} initialAction={action} />}
        </WithUsernameGate>
      </motion.div>
    </>
  );
}

export default function ChatRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted">Loading...</div>
        </div>
      }
    >
      <ChatRoomContent />
    </Suspense>
  );
}
