'use client'

import { useState } from 'react'
import {
  CheckCircle2, Clock, DollarSign, Lock, Send, Layers, ShieldCheck,
  Edit3, Plus, Trash2, Check, X, AlertCircle, RefreshCw
} from 'lucide-react'

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
  { id: 'ms_1', title: 'Milestone 1: Design Specs & Architecture', percentage: 30, amount: Math.round(amount * 0.3), status: 'FUNDED' },
  { id: 'ms_2', title: 'Milestone 2: Core Development & Implementation', percentage: 40, amount: Math.round(amount * 0.4), status: 'PENDING' },
  { id: 'ms_3', title: 'Milestone 3: QA Testing & Final Deployment', percentage: 30, amount: Math.round(amount * 0.3), status: 'PENDING' },
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
  const [isEditing, setIsEditing] = useState(false)
  const [editingList, setEditingList] = useState<MilestoneItem[]>([])
  const [savingMilestones, setSavingMilestones] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')

  const releasedAmount = milestones.filter(m => m.status === 'RELEASED').reduce((s, m) => s + m.amount, 0)
  const fundedAmount   = milestones.filter(m => m.status === 'FUNDED' || m.status === 'SUBMITTED' || m.status === 'RELEASED').reduce((s, m) => s + m.amount, 0)
  const progressPct    = Math.min(100, Math.round((releasedAmount / totalAmount) * 100))

  const startEditing = () => {
    setEditingList(JSON.parse(JSON.stringify(milestones)))
    setIsEditing(true)
  }

  const handleEditTitle = (idx: number, title: string) => {
    setEditingList(prev => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], title }
      return copy
    })
  }

  const handleEditAmount = (idx: number, amount: number) => {
    setEditingList(prev => {
      const copy = [...prev]
      const validAmount = isNaN(amount) ? 0 : amount
      copy[idx] = {
        ...copy[idx],
        amount: validAmount,
        percentage: Math.round((validAmount / totalAmount) * 100),
      }
      return copy
    })
  }

  const handleAddMilestone = () => {
    const currentSum = editingList.reduce((s, m) => s + (m.amount || 0), 0)
    const remaining = Math.max(10, totalAmount - currentSum)
    setEditingList(prev => [
      ...prev,
      {
        id: `ms_${Date.now()}`,
        title: `Milestone ${prev.length + 1}: Custom Deliverable`,
        amount: remaining,
        percentage: Math.round((remaining / totalAmount) * 100),
        status: 'PENDING',
      },
    ])
  }

  const handleRemoveMilestone = (idx: number) => {
    if (editingList.length <= 1) return
    setEditingList(prev => prev.filter((_, i) => i !== idx))
  }

  const handleAutoBalance = () => {
    const count = editingList.length
    if (count === 0) return
    const equalShare = Math.floor(totalAmount / count)
    const remainder = totalAmount - equalShare * count

    setEditingList(prev =>
      prev.map((m, i) => {
        const amt = i === prev.length - 1 ? equalShare + remainder : equalShare
        return {
          ...m,
          amount: amt,
          percentage: Math.round((amt / totalAmount) * 100),
        }
      })
    )
  }

  const saveCustomMilestones = async () => {
    const sum = editingList.reduce((s, m) => s + (m.amount || 0), 0)
    if (Math.abs(sum - totalAmount) > 1) {
      alert(`The sum of milestones (${sum} TND) must equal the total order amount (${totalAmount} TND)`)
      return
    }

    try {
      setSavingMilestones(true)
      const res = await fetch(`/api/orders/${orderId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_MILESTONES', milestones: editingList }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save milestones')

      setMilestones(editingList)
      setIsEditing(false)
      setFeedbackMsg('Milestones and amounts updated successfully!')
      setTimeout(() => setFeedbackMsg(''), 3500)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSavingMilestones(false)
    }
  }

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

  const editingSum = editingList.reduce((s, m) => s + (Number(m.amount) || 0), 0)
  const isSumValid = Math.abs(editingSum - totalAmount) <= 1

  return (
    <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm space-y-6">
      {feedbackMsg && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          {feedbackMsg}
        </div>
      )}

      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/8 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-ast-primary/10 border border-ast-primary/20 text-ast-primary flex items-center justify-center">
            {paymentMode === 'FULL_JOB' ? <DollarSign size={22} /> : <Layers size={22} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-lg text-black">
                {paymentMode === 'FULL_JOB' ? 'Full Job Escrow Contract' : 'Multi-Milestone Escrow Tracker'}
              </h3>
              {paymentMode === 'MILESTONE' && !isEditing && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="px-2.5 py-0.5 rounded-full bg-ast-surface border border-black/10 text-[11px] font-semibold text-ast-primary hover:bg-ast-primary hover:text-white transition-colors flex items-center gap-1"
                >
                  <Edit3 size={11} /> Fix Milestones
                </button>
              )}
            </div>
            <p className="text-ast-gray text-xs">
              Total Order Value: <strong className="text-black">{totalAmount} TND</strong> · 12% Asteria Fee (88% Net Freelancer Payout)
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-ast-surface p-1 rounded-2xl border border-black/5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setPaymentMode('MILESTONE'); setIsEditing(false) }}
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
            onClick={() => { setPaymentMode('FULL_JOB'); setIsEditing(false) }}
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

      {/* INLINE MILESTONE CUSTOMIZER / FIXER */}
      {isEditing && (
        <div className="bg-ast-surface/60 border border-ast-primary/30 rounded-2xl p-5 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-3">
            <div>
              <h4 className="font-bold text-sm text-black flex items-center gap-2">
                <Edit3 size={15} className="text-ast-primary" /> Customize Milestones & Amounts
              </h4>
              <p className="text-[11px] text-ast-gray">
                Set individual deliverables and specify the exact TND price for each milestone.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isSumValid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                Sum: {editingSum} / {totalAmount} TND
              </span>
              <button
                type="button"
                onClick={handleAutoBalance}
                className="px-2.5 py-1 bg-white border border-black/15 rounded-lg text-xs font-semibold text-ast-dark hover:bg-gray-50 flex items-center gap-1"
                title="Split equally across milestones"
              >
                <RefreshCw size={11} /> Auto-Balance
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {editingList.map((m, idx) => (
              <div key={m.id || idx} className="bg-white p-3.5 rounded-xl border border-black/10 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-5 h-5 rounded-full bg-ast-surface text-black font-bold text-[10px] flex items-center justify-center border border-black/10 shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={m.title}
                      onChange={e => handleEditTitle(idx, e.target.value)}
                      placeholder="Milestone Scope / Title"
                      className="w-full text-xs font-semibold text-black border-b border-black/10 pb-0.5 outline-none focus:border-ast-primary"
                    />
                  </div>
                  {editingList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(idx)}
                      className="text-ast-gray hover:text-red-500 p-1"
                      title="Remove milestone"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <label className="text-[10px] text-ast-gray block mb-0.5">Amount (TND)</label>
                    <input
                      type="number"
                      min={5}
                      max={totalAmount}
                      value={m.amount}
                      onChange={e => handleEditAmount(idx, parseFloat(e.target.value))}
                      className="w-full border border-black/15 rounded-lg px-2.5 py-1 text-xs font-bold text-black outline-none focus:border-ast-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-ast-gray block mb-0.5">Percentage</label>
                    <span className="inline-block py-1 text-xs font-semibold text-ast-dark">
                      {Math.round((m.amount / totalAmount) * 100)}% of Order
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] text-ast-gray block mb-0.5">Net Payout (88%)</label>
                    <span className="inline-block py-1 text-xs font-bold text-emerald-600">
                      {Math.round(m.amount * 0.88 * 100) / 100} TND
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddMilestone}
              className="w-full sm:w-auto px-4 py-2 border border-dashed border-ast-primary/50 text-ast-primary rounded-xl text-xs font-semibold hover:bg-ast-primary/5 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus size={13} /> Add Another Milestone
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-ast-gray hover:bg-ast-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isSumValid || savingMilestones}
                onClick={saveCustomMilestones}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-ast-primary text-white hover:bg-ast-dark transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check size={13} />
                {savingMilestones ? 'Saving...' : 'Save & Fix Milestones'}
              </button>
            </div>
          </div>
        </div>
      )}

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
