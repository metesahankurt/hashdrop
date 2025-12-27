import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy - HashDrop',
  description: 'Privacy policy for HashDrop secure P2P file transfer',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to HashDrop
        </Link>
        <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-3">Privacy Policy</h1>
        <p className="text-base text-muted">Last updated: December 7, 2025</p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">Our Commitment to Privacy</h2>
            <p className="text-muted leading-relaxed">
              At HashDrop, privacy isn&apos;t just a feature—it&apos;s our foundation. We built this application
              with a simple principle: <strong className="text-foreground">your files are yours, and only yours</strong>.
            </p>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">What We DON&apos;T Collect</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted leading-relaxed">
              <li><strong className="text-foreground">Your Files</strong>: Files never touch our servers. They stream directly between devices using WebRTC.</li>
              <li><strong className="text-foreground">Personal Information</strong>: No name, email, or account required.</li>
              <li><strong className="text-foreground">Transfer History</strong>: We don&apos;t log what files you send or receive.</li>
              <li><strong className="text-foreground">IP Addresses</strong>: The PeerJS signaling server sees IPs temporarily to establish connections, but we don&apos;t store them.</li>
              <li><strong className="text-foreground">Tracking Cookies</strong>: No advertising or analytics cookies.</li>
            </ul>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">What We DO Collect</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted leading-relaxed">
              <li><strong className="text-foreground">Anonymous Usage Statistics</strong>: Basic metrics like page views (via privacy-friendly analytics) to improve the service.</li>
              <li><strong className="text-foreground">Temporary Connection Data</strong>: The PeerJS signaling server temporarily holds connection metadata to help devices find each other. This data is deleted immediately after connection is established.</li>
            </ul>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">How HashDrop Works</h2>
            <p className="text-muted leading-relaxed mb-4">
              To understand our privacy guarantees, it&apos;s important to understand how HashDrop works:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4 text-muted leading-relaxed">
              <li>You drop a file → A random code is generated (&quot;Pulsar-Moon&quot;)</li>
              <li>Your friend enters that code</li>
              <li>A signaling server (PeerJS) helps you find each other on the internet</li>
              <li>You connect <strong className="text-foreground">directly</strong> via WebRTC (peer-to-peer)</li>
              <li>The file streams <strong className="text-foreground">encrypted</strong> from you → them</li>
              <li>No server ever sees the file content</li>
            </ol>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">Third-Party Services</h2>
            <p className="text-muted leading-relaxed mb-3"><strong className="text-foreground">PeerJS Cloud Signaling</strong>:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted leading-relaxed">
              <li>Used to establish peer-to-peer connections</li>
              <li>Temporarily sees connection metadata (not file content)</li>
              <li>Open-source and publicly auditable</li>
            </ul>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">Data Retention</h2>
            <p className="text-muted leading-relaxed">
              <strong className="text-foreground">Zero retention</strong>. Files are never stored. Connection metadata is deleted
              immediately after your transfer completes.
            </p>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">Your Rights</h2>
            <p className="text-muted leading-relaxed mb-3">Since we don&apos;t collect personal data, there&apos;s nothing to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted leading-relaxed">
              <li>Request access to</li>
              <li>Request deletion of</li>
              <li>Request correction of</li>
            </ul>
            <p className="mt-4 text-muted leading-relaxed">
              However, if you have any privacy concerns, contact us at: <strong className="text-foreground">metesahankurt@yahoo.com</strong>
            </p>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">Changes to This Policy</h2>
            <p className="text-muted leading-relaxed">
              We may update this privacy policy from time to time. We&apos;ll notify users of significant
              changes via the application.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
