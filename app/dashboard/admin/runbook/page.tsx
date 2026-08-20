import { Shield, AlertTriangle, RefreshCw, Lock, LifeBuoy, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function AdminRunbookPage() {
  return (
    <div className="min-h-screen bg-ast-surface pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-ast-gray mb-2">
              <Link href="/dashboard/admin" className="hover:text-ast-primary">Admin Control Center</Link>
              <span>/</span>
              <span className="text-black font-semibold">Operations Runbook</span>
            </div>
            <h1 className="font-heading font-bold text-3xl text-black">Incident & Outage Runbooks</h1>
            <p className="text-ast-gray text-sm mt-1">Standard Operating Procedures (SOP) for payment gateways, KYC provider outages, and dispute freezes.</p>
          </div>
          <Link
            href="/dashboard/admin"
            className="px-4 py-2 bg-ast-primary text-white text-xs font-bold rounded-2xl hover:bg-ast-dark transition-colors"
          >
            ← Back to Admin Console
          </Link>
        </div>

        {/* Runbook 1: Payment Gateway Outage */}
        <div className="bg-white rounded-3xl border border-black/8 p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-black">Runbook #1: Payment Gateway (Stripe / Flouci) Down</h2>
              <p className="text-xs text-ast-gray">Trigger: Gateway returns 500s or webhook delivery failures exceed 5%</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-ast-gray leading-relaxed">
            <p><strong className="text-black">1. Check Webhook Logs:</strong> Inspect <code className="bg-ast-surface px-2 py-0.5 rounded text-ast-primary">/api/admin/logs</code> for repeated <code className="bg-ast-surface px-2 py-0.5 rounded">STRIPE_WEBHOOK_FAILED</code> or <code className="bg-ast-surface px-2 py-0.5 rounded">FLOUCI_ERROR</code> signatures.</p>
            <p><strong className="text-black">2. Enable Fallback Wallet Checkout:</strong> Asteria automatically routes orders through internal Wallet Escrow balances if external gateways fail.</p>
            <p><strong className="text-black">3. Manual Escrow Crediting:</strong> If a client's card was charged but the webhook timed out, use the <em>Balance Adjustment Modal</em> in the Admin User list to credit the verified TND amount with note <code className="bg-ast-surface px-2 py-0.5 rounded">Manual bank wire / gateway recovery</code>.</p>
          </div>
        </div>

        {/* Runbook 2: Automated KYC Provider Outage */}
        <div className="bg-white rounded-3xl border border-black/8 p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-black">Runbook #2: Automated KYC Provider Outage</h2>
              <p className="text-xs text-ast-gray">Trigger: Automated ID verification webhooks timing out or failing</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-ast-gray leading-relaxed">
            <p><strong className="text-black">1. Switch to Manual Review Queue:</strong> Navigate to the <em>Verifications</em> tab in Admin Center.</p>
            <p><strong className="text-black">2. Document Inspection:</strong> Click on the ID Front, ID Back, and Selfie document attachments to inspect high-resolution images.</p>
            <p><strong className="text-black">3. Direct Action:</strong> Click <em>Approve</em> or <em>Reject (with specific reason)</em>. The user will instantly receive their transactional email notification.</p>
          </div>
        </div>

        {/* Runbook 3: Emergency Escrow Freeze & Dispute Hold */}
        <div className="bg-white rounded-3xl border border-black/8 p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center font-bold">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-black">Runbook #3: Emergency Dispute Freeze & Fund Recovery</h2>
              <p className="text-xs text-ast-gray">Trigger: Fraud report, scam gig, or off-platform solicitation dispute</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-ast-gray leading-relaxed">
            <p><strong className="text-black">1. Freeze Contract Escrow:</strong> Open the <em>Disputes & Reports</em> tab and click <em>Inspect Dossier</em>.</p>
            <p><strong className="text-black">2. Review Chat Logs & Deliverables:</strong> Review unedited communication transcripts and file submission history.</p>
            <p><strong className="text-black">3. Execute Resolution:</strong> Choose <em>Full Buyer Refund</em>, <em>Full Seller Release</em>, or <em>Custom Split</em>. The ledger automatically executes the wallet transactions with an immutable audit entry.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
