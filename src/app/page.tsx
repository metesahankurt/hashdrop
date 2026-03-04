"use client";

import { Suspense, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MinimalHeader } from "@/components/layout/minimal-header";
import { SignatureBadge } from "@/components/ui/signature-badge";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import { TransferView } from "@/components/transfer/transfer-view";
import { VideoCallView } from "@/components/videocall/video-call-view";
import { useAppStore } from "@/store/use-app-store";
import { useSearchParams } from "next/navigation";

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

function AppContent() {
  const searchParams = useSearchParams();
  const { appMode, setAppMode } = useAppStore();

  // Auto-navigate based on URL params
  useEffect(() => {
    const code = searchParams.get("code");
    const mode = searchParams.get("mode");

    if (mode === "videocall" && appMode === "welcome") {
      setAppMode("videocall");
    } else if (code && appMode === "welcome") {
      // Transfer code in URL -> go to transfer mode (default when no mode specified)
      setAppMode("transfer");
    }
  }, [searchParams, appMode, setAppMode]);

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
            <TransferView />
          </motion.div>
        )}

        {appMode === "videocall" && (
          <motion.div key="videocall" {...pageTransition}>
            <VideoCallView />
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
