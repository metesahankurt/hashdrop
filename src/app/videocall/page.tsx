"use client";

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MinimalHeader } from "@/components/layout/minimal-header";
import { VideoCallView } from "@/components/videocall/video-call-view";
import { WithUsernameGate } from "@/components/ui/username-gate";
import { IncomingRequestScreen } from "@/components/ui/incoming-request-screen";
import { Video } from "lucide-react";
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

function VideoCallContent() {
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
    router.push('/videocall');
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
          mode="videocall"
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
    </>
  );
}

export default function VideoCallPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted">Loading...</div>
        </div>
      }
    >
      <VideoCallContent />
    </Suspense>
  );
}
