import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service - HashDrop',
  description: 'Terms of service for HashDrop secure P2P file transfer',
}

export default function TermsOfServicePage() {
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
        <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-3">Terms of Service</h1>
        <p className="text-base text-muted">Last updated: December 7, 2025</p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted leading-relaxed">
              By using HashDrop, you agree to these Terms of Service. If you don&apos;t agree,
              please don&apos;t use the service.
            </p>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
            <p className="text-muted leading-relaxed mb-3">
              HashDrop is a peer-to-peer file transfer application that enables you to send
              files directly between devices without server storage. We provide:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted leading-relaxed">
              <li>Signaling service to establish P2P connections</li>
              <li>Web interface for initiating transfers</li>
              <li>Code generation for secure connections</li>
              <li>File integrity verification (SHA-256 hashing)</li>
            </ul>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">3. User Responsibilities</h2>
            <p className="text-muted leading-relaxed mb-3">You agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted leading-relaxed">
              <li><strong className="text-foreground">Use HashDrop legally</strong>: Don&apos;t send illegal, harmful, or copyrighted content without permission</li>
              <li><strong className="text-foreground">Respect others</strong>: Don&apos;t use HashDrop to harass, spam, or harm others</li>
              <li><strong className="text-foreground">Keep codes private</strong>: Only share your transfer code with intended recipients</li>
              <li><strong className="text-foreground">Accept risks</strong>: While we provide SHA-256 verification, you&apos;re responsible for verifying file sources</li>
            </ul>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Prohibited Uses</h2>
            <p className="text-muted leading-relaxed mb-3">You may NOT use HashDrop to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted leading-relaxed">
              <li>Transfer illegal content (malware, pirated software, etc.)</li>
              <li>Violate intellectual property rights</li>
              <li>Distribute spam or phishing content</li>
              <li>Attempt to hack, reverse-engineer, or abuse the service</li>
              <li>Transfer files that violate export control laws</li>
            </ul>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Service Availability</h2>
            <p className="text-muted leading-relaxed">
              HashDrop is provided &quot;as is&quot; without warranties. We strive for high availability,
              but we don&apos;t guarantee uninterrupted service. We may modify or discontinue features
              at any time.
            </p>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Limitation of Liability</h2>
            <p className="text-muted leading-relaxed mb-3">
              HashDrop is a peer-to-peer service. We act solely as a passive conduit for data transfer.
              Because files are encrypted and transferred directly between devices:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted leading-relaxed">
              <li>We cannot view, access, or censor any file content</li>
              <li>We are not responsible for the content transferred by users</li>
              <li>We assume no liability for the distribution of illegal or overlapping content</li>
              <li>HashDrop is not liable for data loss, corruption, or misuse</li>
            </ul>
            <p className="mt-4 font-semibold text-foreground">
              Maximum liability: $0 (since the service is free)
            </p>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Privacy</h2>
            <p className="text-muted leading-relaxed">
              Your use of HashDrop is subject to our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              Summary: We don&apos;t store your files or personal information.
            </p>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Intellectual Property</h2>
            <p className="text-muted leading-relaxed">
              HashDrop&apos;s code, design, and branding are protected by copyright. However, the
              source code is open-source under the MIT License. You may fork, modify, and distribute
              the code according to the license terms.
            </p>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Termination</h2>
            <p className="text-muted leading-relaxed">
              We reserve the right to terminate or suspend access to HashDrop for violations
              of these terms, without notice.
            </p>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Governing Law</h2>
            <p className="text-muted leading-relaxed">
              These terms are governed by the laws of New South Wales, Australia. Any disputes will be
              resolved in the courts of New South Wales, Australia.
            </p>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Changes to Terms</h2>
            <p className="text-muted leading-relaxed">
              We may update these terms from time to time. Continued use of HashDrop after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">12. Reporting Abuse</h2>
            <p className="text-muted leading-relaxed mb-3">
              HashDrop does not host any content. However, we take abuse seriously. If you believe a user is violating
              these terms, you may report it to us.
            </p>
            <p className="text-muted leading-relaxed">
              Please note: Since we do not store files or logs, our ability to take action is limited to
              investigating technical misuse of our signaling infrastructure.
            </p>
          </section>

          <section className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-3">13. Contact</h2>
            <p className="text-muted leading-relaxed">
              Questions about these terms? Contact us at: <strong className="text-foreground">metesahankurt@yahoo.com</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
