"use client";

import { Suspense } from "react";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import { InfoSection } from "@/components/ui/info-section";
import { SignatureBadge } from "@/components/ui/signature-badge";

function HomeContent() {
  return (
    <>
      <WelcomeScreen />
      <InfoSection />
      <footer className="fixed bottom-6 left-6 z-40 hidden md:block">
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
      <HomeContent />
    </Suspense>
  );
}
