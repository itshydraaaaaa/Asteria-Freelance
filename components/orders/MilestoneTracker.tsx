'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, DollarSign, Lock, Send, Layers, ShieldCheck, ArrowRight } from 'lucide-react'

interface MilestoneItem {
  id: string
  title: string
  percentage: number
  amount: number
  status: 'PENDING' | 'FUNDED' | 'SUBMITTED' | 'RELEASED'
}

interface Props {
  orderId: string
  totalAmount: number
  userRole: 'BUYER' | 'SELLER'
  initialMilestones?: MilestoneItem[]
  initialPaymentMode?: 'FULL_JOB' | 'MILESTONE'
}

const DEFAULT_MILESTONES = (amount: number): MilestoneItem[] => [
  { id: 'ms_1', title: 'Milestone 1: Design Specs & Architecture (30%)', percentage: 30, amount: Math.round(amount * 0.3), status: 'FUNDED' },
  { id: 'ms_2', title: 'Milestone 2: Core Development & Implementation (40%)', percentage: 40, amount: Math.round(amount * 0.4), status: 'PENDING' },
  { id: 'ms_3', title: 'Milestone 3: QA Review & Final Deployment (30%)', percentage: 30, amount: Math.round(amount * 0.3), status: 'PENDING' },
]

export function MilestoneTracker({
  orderId,
  totalAmount,
  userRole,
  initialMilestones,
  initialPaymentMode = 'MILESTONE',
}: Props) {
  const [paymentMode, setPaymentMode] = useState<'FULL_JOB' | 'MILESTONE'>(
    initialMilestones && initialMilestones.length === 1 ? 'FULL_JOB' : initialPaymentMode
  )

  const [milestones, setMilestones] = useState<MilestoneItem[]>(
    initialMilestones && initialMilestones.length > 0 ? initialMilestones : DEFAULT_MILESTONES(totalAmount)
  )
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const releasedAmount = milestones.filter(m => m.status === 'RELEASED').reduce((s, m) => s + m.amount, 0)
  const fundedAmount   = milestones.filter(m => m.status === 'FUNDED' || m.status === 'SUBMITTED' || m.status === 'RELEASED').reduce((s, m) => s + m.amount, 0)
  const progressPct    = Math.min(100, Math.round((releasedAmount / totalAmount) * 100))

  const handleMilestoneAction = async (milestoneId: string, action: 'FUND' | 'SUBMIT' | 'RELEASE') => {
    try {
      setLoadingId(milestoneId)
      const res = await fetch(`/api/orders/${orderId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, milestoneId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Milestone update failed')

      setMilestones(prev =>
        prev.map(m => (m.id === milestoneId ? { ...m, status: action === 'FUND' ? 'FUNDED' : action === 'SUBMIT' ? 'SUBMITTED' : 'RELEASED' } : m))
      )
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  const STATUS_BADGE: Record<string, string> = {
    PENDING:   'bg-black/8 text-ast-gray border border-black/15',
    FUNDED:    'bg-sky-50 text-sky-700 border border-sky-200',
    SUBMITTED: 'bg-amber-50 text-amber-700 border border-amber-200',
    RELEASED:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  }

  return (
    <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/8 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-ast-primary/10 border border-ast-primary/20 text-ast-primary flex items-center justify-center">
            {paymentMode === 'FULL_JOB' ? <DollarSign size={22} /> : <Layers size={22} />}
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-black">
              {paymentMode === 'FULL_JOB' ? 'Full Job Escrow Contract' : 'Multi-Milestone Escrow Tracker'}
            </h3>
            <p className="text-ast-gray text-xs">
              Total Order Value: <strong className="text-black">{totalAmount} TND</strong> · 12% Asteria Fee (88% Net Payout)
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-ast-surface p-1 rounded-2xl border border-black/5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setPaymentMode('MILESTONE')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              paymentMode === 'MILESTONE'
                ? 'bg-white text-black shadow-2xs font-bold'
                : 'text-ast-gray hover:text-black'
            }`}
          >
            Milestone Phases
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode('FULL_JOB')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              paymentMode === 'FULL_JOB'
                ? 'bg-white text-black shadow-2xs font-bold'
                : 'text-ast-gray hover:text-black'
            }`}
          >
            Full Job (100%)
          </button>
        </div>
      </div>

      {/* FULL JOB MODE RENDERING */}
      {paymentMode === 'FULL_JOB' ? (
        <div className="bg-ast-surface/40 rounded-2xl p-5 border border-black/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              <span className="font-bold text-sm text-black">Single Lump-Sum Escrow</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              {totalAmount} TND Locked
            </span>
          </div>

          <p className="text-xs text-ast-gray leading-relaxed">
            The full contract amount of <strong>{totalAmount} TND</strong> is protected in Asteria Escrow. Once the complete deliverable is submitted and approved by the buyer, <strong>{Math.round(totalAmount * 0.88 * 100) / 100} TND</strong> (88% net) is immediately disbursed to the freelancer's wallet.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
            <div className="bg-white p-3 rounded-xl border border-black/5">
              <span className="text-ast-gray text-[10px] uppercase font-bold block mb-0.5">Escrow Total</span>
              <span className="font-heading font-bold text-base text-black">{totalAmount} TND</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-black/5">
              <span className="text-ast-gray text-[10px] uppercase font-bold block mb-0.5">Platform Fee (12%)</span>
              <span className="font-heading font-bold text-base text-red-600">-{Math.round(totalAmount * 0.12 * 100) / 100} TND</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-black/5">
              <span className="text-ast-gray text-[10px] uppercase font-bold block mb-0.5">Freelancer Payout (88%)</span>
              <span className="font-heading font-bold text-base text-emerald-600">{Math.round(totalAmount * 0.88 * 100) / 100} TND</span>
            </div>
          </div>
        </div>
      ) : (
        /* MULTI-MILESTONE MODE RENDERING */
        <>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-black">
              <span>Overall Milestone Progress</span>
              <span className="font-heading font-bold text-ast-primary">{progressPct}%</span>
            </div>
            <div className="w-full h-3 bg-ast-surface rounded-full overflow-hidden border border-black/5">
              <div
                className="h-full bg-gradient-to-r from-ast-dark to-ast-primary transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-ast-gray">
              <span>Escrow Funded: <strong>{fundedAmount} TND</strong></span>
              <span>Released to Seller: <strong>{releasedAmount} TND</strong> ({Math.round(releasedAmount * 0.88 * 100) / 100} TND Net)</span>
            </div>
          </div>

          {/* Milestones List */}
          <div className="divide-y divide-black/5">
            {milestones.map((m, idx) => (
              <div key={m.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-ast-surface text-ast-dark font-bold text-xs flex items-center justify-center border border-black/10">
                      {idx + 1}
                    </span>
                    <p className="font-semibold text-sm text-black">{m.title}</p>
                  </div>
                  <p className="text-xs text-ast-gray pl-8">
                    Milestone Escrow: <strong className="text-black">{m.amount} TND</strong> ({m.percentage}%) · Net: <span className="text-emerald-600 font-semibold">{Math.round(m.amount * 0.88 * 100) / 100} TND</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 pl-8 sm:pl-0">
                  <span className={`text-[11px] font-bold rounded-full px-3 py-1 ${STATUS_BADGE[m.status]}`}>
                    {m.status}
                  </span>

                  {/* Action Buttons based on User Role & Milestone Status */}
                  {userRole === 'BUYER' && m.status === 'PENDING' && (
                    <button
                      disabled={loadingId === m.id}
                      onClick={() => handleMilestoneAction(m.id, 'FUND')}
                      className="px-3.5 py-1.5 bg-ast-dark text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors shadow-sm disabled:opacity-50"
                    >
                      Fund {m.amount} TND
                    </button>
                  )}

                  {userRole === 'SELLER' && m.status === 'FUNDED' && (
                    <button
                      disabled={loadingId === m.id}
                      onClick={() => handleMilestoneAction(m.id, 'SUBMIT')}
                      className="px-3.5 py-1.5 bg-ast-primary text-white rounded-xl text-xs font-semibold hover:bg-ast-dark transition-colors shadow-sm disabled:opacity-50"
                    >
                      Submit Milestone
                    </button>
                  )}

                  {userRole === 'BUYER' && m.status === 'SUBMITTED' && (
                    <button
                      disabled={loadingId === m.id}
                      onClick={() => handleMilestoneAction(m.id, 'RELEASE')}
                      className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      Approve & Release {m.amount} TND
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
