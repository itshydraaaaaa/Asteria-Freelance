import Link from 'next/link'
import { FileCheck, ShieldCheck, Scale, AlertCircle, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | Asteria Freelance',
  description: 'Terms of Service and Marketplace Rules for clients and freelancers using the Asteria platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-ast-dark pt-32 pb-20 px-6 lg:px-12 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-6">
            <Scale size={14} className="text-ast-light" />
            <span className="font-mono text-ast-light text-[11px] tracking-[0.2em] uppercase font-semibold">
              Marketplace Agreement
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-4xl lg:text-6xl text-white tracking-tight leading-tight mb-6">
            Terms of Service
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-2xl mx-auto font-body">
            Please read these terms and marketplace rules carefully before offering services or hiring talent on Asteria.
          </p>
          <p className="font-mono text-xs text-ast-light/60 mt-6 uppercase tracking-widest">
            Last Updated: August 2026 • Version 2.0
          </p>
        </div>
      </section>

      {/* Main Terms Sections */}
      <section className="py-20 px-6 lg:px-12 max-w-5xl mx-auto font-body">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-ast-surface border border-black/5">
            <ShieldCheck className="text-ast-primary mb-3" size={24} />
            <h3 className="font-heading font-semibold text-black text-lg mb-1">Escrow Protected</h3>
            <p className="text-ast-gray text-sm leading-relaxed">
              Client funds are held in secure escrow and only released upon deliverable or milestone approval.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-ast-surface border border-black/5">
            <FileCheck className="text-ast-primary mb-3" size={24} />
            <h3 className="font-heading font-semibold text-black text-lg mb-1">Mandatory KYC</h3>
            <p className="text-ast-gray text-sm leading-relaxed">
              Identity verification is required before posting gigs, submitting bids, or publishing client jobs.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-ast-surface border border-black/5">
            <Scale className="text-ast-primary mb-3" size={24} />
            <h3 className="font-heading font-semibold text-black text-lg mb-1">Fair Arbitration</h3>
            <p className="text-ast-gray text-sm leading-relaxed">
              Transparent dispute resolution with maker-checker administrative arbitration for contested orders.
            </p>
          </div>
        </div>

        <div className="space-y-12 text-black/80 leading-relaxed">
          {/* 1. Acceptance of Terms */}
          <div>
            <h2 className="font-heading font-bold text-2xl text-black mb-4 flex items-center gap-2">
              <span className="text-ast-primary font-mono text-lg">01.</span> Acceptance of Terms
            </h2>
            <p className="mb-4">
              These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;Client&rdquo;, or &ldquo;Freelancer&rdquo;) and Asteria Freelance. By registering an account, browsing gigs, submitting proposals, or funding escrow contracts, you acknowledge that you have read, understood, and agreed to be bound by these Terms.
            </p>
            <p>
              If you do not agree to these Terms, you must immediately cease all access and use of the platform.
            </p>
          </div>

          {/* 2. Account Registration & KYC Gating */}
          <div>
            <h2 className="font-heading font-bold text-2xl text-black mb-4 flex items-center gap-2">
              <span className="text-ast-primary font-mono text-lg">02.</span> Account Registration & Mandatory KYC Verification
            </h2>
            <p className="mb-4">
              Users may register as either a <strong>Client</strong> or a <strong>Freelancer</strong>. You agree to provide accurate, current, and complete information during registration.
            </p>
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="shrink-0 text-amber-600 mt-0.5" size={18} />
                <div>
                  <strong>KYC Security Policy:</strong> All users may freely browse and explore the marketplace. However, publishing freelance gigs, bidding on jobs, or posting client project briefs is strictly restricted until government identity verification (KYC) is reviewed and approved by platform administrators.
                </div>
              </div>
            </div>
          </div>

          {/* 3. Escrow Contracts & Milestone Releases */}
          <div>
            <h2 className="font-heading font-bold text-2xl text-black mb-4 flex items-center gap-2">
              <span className="text-ast-primary font-mono text-lg">03.</span> Escrow Protection, Milestones & Payments
            </h2>
            <p className="mb-4">
              Asteria uses a secure two-phase escrow mechanism to protect both buyers and sellers:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Order Initiation:</strong> When a client accepts a proposal or orders a gig, contract funds are locked into escrow. The freelancer begins work once escrow funding is confirmed.</li>
              <li><strong>Milestone Payments:</strong> Projects may be broken into structured milestones. Each milestone is funded and approved sequentially upon deliverable verification.</li>
              <li><strong>Deliverable Signoff:</strong> Upon completion, the freelancer submits the deliverables. The client has a review period to request revisions or release payment.</li>
              <li><strong>Auto-Release:</strong> If a client does not respond or request revisions within 7 business days following delivery submission, escrow funds may automatically release to the freelancer.</li>
            </ul>
          </div>

          {/* 4. Platform Fees & Currency */}
          <div>
            <h2 className="font-heading font-bold text-2xl text-black mb-4 flex items-center gap-2">
              <span className="text-ast-primary font-mono text-lg">04.</span> Currency & Platform Fee Schedule
            </h2>
            <p className="mb-4">
              Asteria primarily processes transactions in <strong>Tunisian Dinar (TND)</strong> and supported international currencies.
            </p>
            <p className="mb-4">
              A standard platform service commission of <strong>12%</strong> is deducted from completed orders to maintain escrow infrastructure, secure messaging, identity verification, and dispute arbitration services. Freelancers receive the net amount credited directly to their withdrawable wallet balance.
            </p>
          </div>

          {/* 5. Dispute Resolution & Arbitration */}
          <div>
            <h2 className="font-heading font-bold text-2xl text-black mb-4 flex items-center gap-2">
              <span className="text-ast-primary font-mono text-lg">05.</span> Dispute Resolution & Administrative Arbitration
            </h2>
            <p className="mb-4">
              In the event of a disagreement regarding project deliverables, either party may initiate a dispute through the order interface.
            </p>
            <p className="mb-4">
              During a dispute, escrow funds remain locked. Platform administrators review submitted work samples, initial project briefs, and platform message logs to render a binding decision (full release, partial settlement, or client refund).
            </p>
          </div>

          {/* 6. Intellectual Property */}
          <div>
            <h2 className="font-heading font-bold text-2xl text-black mb-4 flex items-center gap-2">
              <span className="text-ast-primary font-mono text-lg">06.</span> Intellectual Property & Ownership
            </h2>
            <p className="mb-4">
              Upon full release of payment from escrow, all intellectual property rights, source code, design files, and deliverables created under the project transfer to the client, unless explicitly agreed otherwise in a written custom offer.
            </p>
          </div>

          {/* 7. Prohibited Activities */}
          <div>
            <h2 className="font-heading font-bold text-2xl text-black mb-4 flex items-center gap-2">
              <span className="text-ast-primary font-mono text-lg">07.</span> Prohibited Activities
            </h2>
            <p className="mb-4">Users agree never to:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Circumvent Asteria escrow by soliciting off-platform direct payments.</li>
              <li>Submit fraudulent identity documents or impersonate another individual.</li>
              <li>Upload malicious code, malware, or distribute unauthorized copyrighted material.</li>
              <li>Engage in harassment, abusive behavior, or artificial review inflation.</li>
            </ul>
            <p>
              Violations may result in immediate account suspension, forfeiture of active balances involved in fraudulent transactions, and restriction from the platform.
            </p>
          </div>

          {/* 8. Contact & Legal Notice */}
          <div className="pt-6 border-t border-black/10">
            <h2 className="font-heading font-bold text-2xl text-black mb-4 flex items-center gap-2">
              <span className="text-ast-primary font-mono text-lg">08.</span> Inquiries & Legal Notices
            </h2>
            <p className="mb-4">
              For legal notices, escrow arbitration inquiries, or questions concerning these Terms, contact:
            </p>
            <div className="p-6 rounded-2xl bg-ast-surface border border-black/5">
              <p className="font-semibold text-black">Asteria Freelance Legal & Compliance</p>
              <p className="text-ast-gray text-sm mt-1">Email: <a href="mailto:legal@asteria.com" className="text-ast-primary underline">legal@asteria.com</a></p>
              <p className="text-ast-gray text-sm">Tunis, Tunisia • MENA Region</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 p-8 rounded-3xl bg-ast-dark text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-heading font-bold text-2xl mb-1">Looking for our Privacy Policy?</h3>
            <p className="text-white/70 text-sm">Read how we protect your personal and financial data.</p>
          </div>
          <Link
            href="/privacy"
            className="inline-flex items-center gap-2 bg-ast-light text-ast-dark px-6 py-3 rounded-full font-semibold text-sm hover:bg-white transition-all shrink-0"
          >
            Privacy Policy <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
