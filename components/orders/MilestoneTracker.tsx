'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, DollarSign, Lock, Send, Layers } from 'lucide-react'

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
}

const DEFAULT_MILESTONES = (amount: number): MilestoneItem[] => [
  { id: 'ms_1', title: 'Milestone 1: Design Specs & Wireframes (30%)', percentage: 30, amount: amount * 0.3, status: 'FUNDED' },
  { id: 'ms_2', title: 'Milestone 2: Code Implementation & API Integration (40%)', percentage: 40, amount: amount * 0.4, status: 'PENDING' },
  { id: 'ms_3', title: 'Milestone 3: QA Testing & Production Launch (30%)', percentage: 30, amount: amount * 0.3, status: 'PENDING' },
]

export function MilestoneTracker({ orderId, totalAmount, userRole, initialMilestones }: Props) {
  const [milestones, setMilestones] = useState<MilestoneItem[]>(
    initialMilestones && initialMilestones.length > 0 ? initialMilestones : DEFAULT_MILESTONES(totalAmount)
  )
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const releasedAmount = milestones.filter(m => m.status === 'RELEASED').reduce((s, m) => s + m.amount, 0)
  const fundedAmount   = milestones.filter(m => m.status === 'FUNDED' || m.status === 'SUBMITTED' || m.status === 'RELEASED').reduce((s, m) => s + m.amount, 0)
  const progressPct    = Math.round((releasedAmount / totalAmount) * 100)

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
    <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-black/8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-ast-primary/10 border border-ast-primary/20 text-ast-primary flex items-center justify-center">
            <Layers size={20} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-black">Multi-Milestone Escrow Tracker</h3>
            <p className="text-ast-gray text-xs">Total Order Value: <strong>${totalAmount}</strong></p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-heading font-bold text-2xl text-ast-primary">{progressPct}%</span>
          <p className="text-[10px] text-ast-gray uppercase font-semibold">Completed</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 bg-ast-surface rounded-full overflow-hidden border border-black/5">
          <div
            className="h-full bg-gradient-to-r from-ast-dark to-ast-primary transition-all duration-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-ast-gray">
          <span>Escrow Funded: <strong>${fundedAmount}</strong></span>
          <span>Released to Seller: <strong>${releasedAmount}</strong></span>
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
                Milestone Amount: <strong className="text-black">${m.amount}</strong> ({m.percentage}%)
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
                  Fund ${m.amount}
                </button>
              )}

              {userRole === 'SELLER' && m.status === 'FUNDED' && (
                <button
                  disabled={loadingId === m.id}
                  onClick={() => handleMilestoneAction(m.id, 'SUBMIT')}
                  className="px-3.5 py-1.5 bg-ast-primary text-white rounded-xl text-xs font-semibold hover:bg-ast-dark transition-colors shadow-sm disabled:opacity-50"
                >
                  Submit Work
                </button>
              )}

              {userRole === 'BUYER' && m.status === 'SUBMITTED' && (
                <button
                  disabled={loadingId === m.id}
                  onClick={() => handleMilestoneAction(m.id, 'RELEASE')}
                  className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  Approve & Release ${m.amount}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
