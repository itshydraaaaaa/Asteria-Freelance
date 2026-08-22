import Link from 'next/link'
import { Shield, Lock, Eye, FileText, CheckCircle2, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | Asteria Freelance',
  description: 'Learn how Asteria Freelance protects your personal data, identity documents, and financial transactions.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-ast-dark pt-32 pb-20 px-6 lg:px-12 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-6">
            <Shield size={14} className="text-ast-light" />
            <span className="font-mono text-ast-light text-[11px] tracking-[0.2em] uppercase font-semibold">
              Security & Compliance
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-4xl lg:text-6xl text-white tracking-tight leading-tight mb-6">
            Privacy Policy
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-2xl mx-auto font-body">
            Your privacy, identity security, and financial integrity are fundamental to the Asteria platform. Learn how we handle and protect your information.
          </p>
          <p className="font-mono text-xs text-ast-light/60 mt-6 uppercase tracking-widest">
            Last Updated: August 2026 • Version 2.0
          </p>
        </div>
      </section>

      {/* Main Content Sections */}
      <section className="py-20 px-6 lg:px-12 max-w-5xl mx-auto font-body">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-ast-surface border border-black/5">
            <Lock className="text-ast-primary mb-3" size={24} />
            <h3 className="font-heading font-semibold text-black text-lg mb-1">Encrypted Storage</h3>
            <p className="text-ast-gray text-sm leading-relaxed">
              All KYC identity documents and sensitive credentials are encrypted at rest using industry-standard protocols.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-ast-surface border border-black/5">
            <Eye className="text-ast-primary mb-3" size={24} />
            <h3 className="font-heading font-semibold text-black text-lg mb-1">Zero Data Selling</h3>
            <p className="text-ast-gray text-sm leading-relaxed">
              We never sell or monetize your personal information, communications, or freelance portfolio assets to third parties.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-ast-surface border border-black/5">
            <FileText className="text-ast-primary mb-3" size={24} />
            <h3 className="font-heading font-semibold text-black text-lg mb-1">Escrow Safeguards</h3>
            <p className="text-ast-gray text-sm leading-relaxed">
              Transactional data and wallet balances in Tunisian Dinar (TND) are protected with immutable ledger auditing.
            </p>
          </div>
        </div>

        <div className="space-y-12 text-black/80 leading-relaxed">
          {/* 1. Introduction */}
          <div>
            <h2 className="font-heading font-bold text-2xl text-black mb-4 flex items-center gap-2">
              <span className="text-ast-primary font-mono text-lg">01.</span> Introduction & Scope
            </h2>
            <p className="mb-4">
              Asteria Freelance (&ldquo;Asteria&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates an intelligent microjob and escrow marketplace serving Tunisia, the MENA region, and international clients. This Privacy Policy outlines our policies regarding the collection, use, disclosure, and protection of your personal information when you access our web application, APIs, and related services.
            </p>
            <p>
              By creating an account or using Asteria, you agree to the collection and use of information in accordance with this policy and applicable data protection regulations.
            </p>
          </div>

          {/* 2. Information We Collect */}
          <div>
            <h2 className="font-heading font-bold text-2xl text-black mb-4 flex items-center gap-2">
              <span className="text-ast-primary font-mono text-lg">02.</span> Information We Collect
            </h2>
            <ul className="space-y-3 list-none pl-0">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-ast-primary shrink-0 mt-1" />
                <div>
                  <strong className="text-black">Account Information:</strong> Name, email address, profile avatar, role (Client or Freelancer), professional biography, skills, and portfolio samples.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-ast-primary shrink-0 mt-1" />
                <div>
                  <strong className="text-black">Identity Verification (KYC) Data:</strong> Government-issued National Identity Card (CIN), Passport, full legal name, date of birth, country of residency, and facial verification selfie photos.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-ast-primary shrink-0 mt-1" />
                <div>
                  <strong className="text-black">Financial & Transaction Data:</strong> Escrow contract records, milestone statuses, payout requests, bank details (RIB) for Tunisian Dinar withdrawals, and transaction reference IDs. Asteria does not store raw credit card numbers.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-ast-primary shrink-0 mt-1" />
                <div>
                  <strong className="text-black">Platform Communication & Activity:</strong> Chat messages exchanged between clients and freelancers, job proposals, custom offers, project deliverables, and audit log events.
                </div>
              </li>
            </ul>
          </div>

          {/* 3. KYC Handling */}
          <div>
            <h2 className="font-heading font-bold text-2xl text-black mb-4 flex items-center gap-2">
              <span className="text-ast-primary font-mono text-lg">03.</span> KYC Document Handling & Privacy
            </h2>
            <p className="mb-4">
              To ensure marketplace trust and comply with anti-fraud and financial integrity requirements, all freelancers and clients must complete identity verification (KYC) before publishing gigs or posting job briefs.
            </p>
            <p className="mb-4">
              Identity documents uploaded to Asteria are stored in restricted access storage. Document files are accessible only to authorized platform administrators for identity auditing purposes. Documents are never made public or displayed to other platform users.
            </p>
          </div>

          {/* 4. Financial & Escrow Data */}
          <div>
            <h2 className="font-heading font-bold text-2xl text-black mb-4 flex items-center gap-2">
              <span className="text-ast-primary font-mono text-lg">04.</span> Escrow Protection & Financial Ledger
            </h2>
            <p className="mb-4">
              Financial operations on Asteria are logged in a double-entry ledger system. Escrow transactions lock client funds until milestones or final project deliverables are approved.
            </p>
            <p>
              Wallet balances, withdrawals, and platform commission calculations (12% standard platform fee) are recorded with full audit trails to ensure transparent dispute resolution and accurate reconciliation.
            </p>
          </div>

          {/* 5. User Rights & Data Deletion */}
          <div>
            <h2 className="font-heading font-bold text-2xl text-black mb-4 flex items-center gap-2">
              <span className="text-ast-primary font-mono text-lg">05.</span> Your Rights & Account Deletion
            </h2>
            <p className="mb-4">
              Under our privacy commitments, you hold the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Request an export of all personal data and transaction records linked to your account.</li>
              <li>Update or correct your profile information, skills, and notification preferences via your Settings dashboard.</li>
              <li>Request full account deletion and anonymization, provided you have no active escrow contracts or unresolved financial disputes.</li>
            </ul>
          </div>

          {/* 6. Contact */}
          <div className="pt-6 border-t border-black/10">
            <h2 className="font-heading font-bold text-2xl text-black mb-4 flex items-center gap-2">
              <span className="text-ast-primary font-mono text-lg">06.</span> Contact Our Security Team
            </h2>
            <p className="mb-4">
              If you have any questions regarding this Privacy Policy, your identity data, or wish to exercise your data rights, please contact our support team at:
            </p>
            <div className="p-6 rounded-2xl bg-ast-surface border border-black/5">
              <p className="font-semibold text-black">Asteria Freelance Privacy & Compliance</p>
              <p className="text-ast-gray text-sm mt-1">Email: <a href="mailto:privacy@asteria.com" className="text-ast-primary underline">privacy@asteria.com</a></p>
              <p className="text-ast-gray text-sm">Location: Tunis, Tunisia (MENA Region)</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 p-8 rounded-3xl bg-ast-dark text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-heading font-bold text-2xl mb-1">Have questions about our terms?</h3>
            <p className="text-white/70 text-sm">Review our marketplace terms and escrow agreement.</p>
          </div>
          <Link
            href="/terms"
            className="inline-flex items-center gap-2 bg-ast-light text-ast-dark px-6 py-3 rounded-full font-semibold text-sm hover:bg-white transition-all shrink-0"
          >
            Terms of Service <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
