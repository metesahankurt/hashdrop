import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// JSON-LD structured data for rich results
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "HashDrop",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "Web Browser",
      "description": "Secure P2P file transfer via WebRTC. Share files directly between devices with no cloud storage.",
      "author": {
        "@type": "Person",
        "name": "Mete Şahan Kurt",
        "sameAs": [
          "https://www.linkedin.com/in/mete-sahan-kurt/",
          "https://github.com/metesahankurt"
        ]
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "Direct P2P file transfer via WebRTC",
        "End-to-end DTLS/SRTP encryption",
        "SHA-256 file integrity verification",
        "No cloud storage - files never leave your device",
        "Human-readable transfer codes"
      ]
    }
  ]
};

export const metadata: Metadata = {
  metadataBase: new URL('https://hashdrop.metesahankurt.cloud'),
  title: "HashDrop | Secure P2P File Transfer",
  description: "HashDrop - Share files directly between devices with lightspeed. No cloud, no limits. Powered by WebRTC.",
  keywords: ["HashDrop", "File Transfer", "P2P", "WebRTC", "Privacy", "P2P file transfer", "secure file sharing", "webrtc", "no cloud", "peer to peer"],
  authors: [{ name: "Mete Şahan Kurt" }],
  creator: "Mete Şahan Kurt",
  publisher: "Mete Şahan Kurt",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "HashDrop | Secure P2P File Transfer",
    description: "Share files directly between devices with lightspeed. No cloud, no limits. Powered by WebRTC.",
    siteName: "HashDrop",
    url: 'https://hashdrop.metesahankurt.cloud',
    images: [
      {
        url: '/hashdrop-logo.png',
        width: 1200,
        height: 630,
        alt: 'HashDrop - Secure P2P File Transfer',
      }
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} antialiased min-h-screen relative overflow-x-hidden`}
      >
        {/* Minimal Background - Supabase Style */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          {/* Subtle dot pattern */}
          <div className="absolute inset-0 opacity-[0.015] bg-[radial-gradient(circle,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>
        <main className="relative z-10 w-full min-h-screen flex flex-col overflow-x-hidden">
          {children}
        </main>
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#EDEDED',
              backdropFilter: 'blur(12px)',
            },
          }}
        />
      </body>
    </html>
  );
}

