"use client";

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MinimalHeader } from "@/components/layout/minimal-header";
import { TransferViewNew } from "@/components/transfer/transfer-view-new";
import { WithUsernameGate } from "@/components/ui/username-gate";
import { IncomingRequestScreen } from "@/components/ui/incoming-request-screen";
import { Send } from "lucide-react";
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

function TransferContent() {
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

    setTimeout(() => {
      if (code) {
        setPendingCode(code);
        setPendingFrom(from);
        setShowIncoming(true);
      }
      setInitialized(true);
    }, 0)
  }, [initialized, searchParams]);

  const handleAccept = () => {
    setShowIncoming(false);
    if (pendingCode) {
      router.replace(`/transfer?action=join&code=${pendingCode}`);
    } else {
      router.push('/transfer');
    }
  };

  const handleDecline = () => {
    setPendingCode(null);
    setPendingFrom(null);
    setShowIncoming(false);
    router.replace('/transfer');
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
          mode="transfer"
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
          icon={<Send className="w-7 h-7 text-primary" />}
          title="File"
          highlight="Transfer"
          description="Peer-to-peer file transfer. No cloud, no limits."
          hint="Your username will be visible to the other party"
          mode="transfer"
          skipEntry={!!pendingCode}
        >
          {(_username, action) => <TransferViewNew initialAction={action} />}
        </WithUsernameGate>
      </motion.div>
    </>
  );
}

export default function TransferPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted">Loading...</div>
        </div>
      }
    >
      <TransferContent />
    </Suspense>
  );
}
