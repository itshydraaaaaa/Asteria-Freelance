'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Check, Sparkles, Layers, DollarSign, Plus, Trash2, ShieldCheck } from 'lucide-react'
import { AIAssistantModal } from '@/components/ai/AIAssistantModal'

interface Props {
  jobId: string
  budget: number
  deliveryDays: number
}

interface MilestoneInput {
  title: string
  amount: number
  deliveryDays: number
}

export function ProposalForm({ jobId, budget, deliveryDays }: Props) {
  const router = useRouter()
  const [paymentMode, setPaymentMode] = useState<'FULL_JOB' | 'MILESTONE'>('FULL_JOB')
  const [form, setForm] = useState({
    coverLetter: '',
    price:       String(budget),
    deliveryDays: String(deliveryDays),
  })

  // Dynamic Milestones
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: 'Milestone 1: Wireframes & Initial Architecture', amount: Math.round(budget * 0.3), deliveryDays: Math.max(1, Math.round(deliveryDays * 0.3)) },
    { title: 'Milestone 2: Core Development & Implementation', amount: Math.round(budget * 0.4), deliveryDays: Math.max(1, Math.round(deliveryDays * 0.4)) },
    { title: 'Milestone 3: QA Review, Handoff & Final Delivery', amount: Math.round(budget * 0.3), deliveryDays: Math.max(1, Math.round(deliveryDays * 0.3)) },
  ])

  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error,     setError]     = useState('')
  const [showAiModal, setShowAiModal] = useState(false)

  const handle = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const numericPrice = parseFloat(form.price) || 0
  const platformFee = Math.round(numericPrice * 0.12 * 100) / 100
  const netEarnings = Math.round(numericPrice * 0.88 * 100) / 100

  const milestonesTotal = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0)
  const milestonesDiff = Math.abs(numericPrice - milestonesTotal)

  const addMilestone = () => {
    setMilestones(prev => [
      ...prev,
      {
        title: `Milestone ${prev.length + 1}: Additional Deliverables`,
        amount: 50,
        deliveryDays: 3,
      },
    ])
  }

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return
    setMilestones(prev => prev.filter((_, i) => i !== index))
  }

  const updateMilestone = (index: number, field: keyof MilestoneInput, value: any) => {
    setMilestones(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (paymentMode === 'MILESTONE' && milestonesDiff > 1) {
      setError(`The sum of your milestones (${milestonesTotal} TND) must match your total proposal price (${numericPrice} TND).`)
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}/proposals`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...form,
          paymentMode,
          milestones: paymentMode === 'MILESTONE' ? milestones : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit')
      setSubmitted(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-6 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 p-6">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <Check size={22} />
        </div>
        <p className="font-semibold text-black text-sm">Proposal Submitted Successfully!</p>
        <p className="text-xs text-ast-gray mt-1">
          The client will review your terms ({paymentMode === 'MILESTONE' ? `${milestones.length} Milestones` : 'Full Job Escrow'}).
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center justify-between border-b border-black/8 pb-3">
        <h3 className="font-semibold text-black text-sm">Submit a Proposal</h3>
        <span className="text-[11px] font-bold text-ast-primary bg-ast-muted px-2.5 py-0.5 rounded-full">
          12% Asteria Fee
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5">
          {error}
        </div>
      )}

      {/* Payment Mode Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-black">How do you want to get paid?</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMode('FULL_JOB')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              paymentMode === 'FULL_JOB'
                ? 'border-ast-primary bg-ast-primary/5 ring-2 ring-ast-primary/20'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className={paymentMode === 'FULL_JOB' ? 'text-ast-primary' : 'text-ast-gray'} />
              <span className="font-semibold text-xs text-black">By Project / Full Job</span>
            </div>
            <p className="text-[11px] text-ast-gray leading-tight">
              Single escrow payment released at 100% project completion.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMode('MILESTONE')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              paymentMode === 'MILESTONE'
                ? 'border-ast-primary bg-ast-primary/5 ring-2 ring-ast-primary/20'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Layers size={16} className={paymentMode === 'MILESTONE' ? 'text-ast-primary' : 'text-ast-gray'} />
              <span className="font-semibold text-xs text-black">By Milestone</span>
            </div>
            <p className="text-[11px] text-ast-gray leading-tight">
              Divide project into smaller escrow phases funded sequentially.
            </p>
          </button>
        </div>
      </div>

      {/* Price & Delivery Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-black mb-1.5">Total Bid (TND)</label>
          <input
            type="number"
            min={10}
            max={budget * 2}
            value={form.price}
            onChange={handle('price')}
            required
            className="w-full border border-black/15 rounded-xl px-3 py-2 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 font-semibold text-black"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-black mb-1.5">Delivery Timeline</label>
          <input
            type="number"
            min={1}
            max={90}
            value={form.deliveryDays}
            onChange={handle('deliveryDays')}
            required
            className="w-full border border-black/15 rounded-xl px-3 py-2 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20"
          />
        </div>
      </div>

      {/* Dynamic Milestones Section */}
      {paymentMode === 'MILESTONE' && (
        <div className="bg-ast-surface/50 border border-black/8 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-black flex items-center gap-1.5">
              <Layers size={14} className="text-ast-primary" /> Milestone Breakdown
            </span>
            <span className={`text-[11px] font-bold ${milestonesDiff <= 1 ? 'text-emerald-600' : 'text-red-500'}`}>
              Total: {milestonesTotal} / {numericPrice} TND
            </span>
          </div>

          <div className="space-y-2.5">
            {milestones.map((m, idx) => (
              <div key={idx} className="bg-white p-3 rounded-xl border border-black/8 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    required
                    value={m.title}
                    onChange={e => updateMilestone(idx, 'title', e.target.value)}
                    placeholder={`Milestone ${idx + 1} Description`}
                    className="w-full text-xs font-medium text-black border-b border-black/10 pb-1 outline-none focus:border-ast-primary"
                  />
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(idx)}
                      className="text-ast-gray hover:text-red-500 p-1 transition-colors"
                      title="Remove Milestone"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-ast-gray block">Amount (TND)</label>
                    <input
                      type="number"
                      min={5}
                      required
                      value={m.amount}
                      onChange={e => updateMilestone(idx, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full border border-black/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-ast-primary font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-ast-gray block">Days</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={m.deliveryDays}
                      onChange={e => updateMilestone(idx, 'deliveryDays', parseInt(e.target.value) || 1)}
                      className="w-full border border-black/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-ast-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addMilestone}
            className="w-full py-2 border border-dashed border-ast-primary/40 rounded-xl text-xs font-semibold text-ast-primary hover:bg-ast-primary/5 flex items-center justify-center gap-1 transition-colors"
          >
            <Plus size={13} /> Add Another Milestone
          </button>
        </div>
      )}

      {/* Financial Breakdown (12% Commission) */}
      <div className="bg-ast-surface rounded-2xl p-3.5 border border-black/5 space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-ast-gray">
          <span>Client Proposed Bid:</span>
          <span className="font-semibold text-black">{numericPrice} TND</span>
        </div>
        <div className="flex items-center justify-between text-ast-gray">
          <span>Asteria Service Fee (12%):</span>
          <span className="font-semibold text-red-600">-{platformFee} TND</span>
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t border-black/8 font-bold">
          <span className="text-black flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-600" /> You'll Receive (88% Net):
          </span>
          <span className="text-emerald-600 text-sm">{netEarnings} TND</span>
        </div>
      </div>

      {/* Cover Letter */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-black">Cover Letter</label>
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="text-[11px] text-ast-primary font-semibold flex items-center gap-1 bg-ast-muted px-2.5 py-0.5 rounded-full hover:bg-ast-primary hover:text-white transition-colors"
          >
            <Sparkles size={11} /> AI Cover Letter
          </button>
        </div>
        <textarea
          value={form.coverLetter}
          onChange={handle('coverLetter')}
          required
          rows={4}
          placeholder="Introduce yourself, explain your approach, and highlight why you're the best fit for this project…"
          className="w-full border border-black/15 rounded-xl px-3 py-2 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 resize-none"
        />
      </div>

      <AIAssistantModal
        mode="PROPOSAL_LETTER"
        titleContext="Freelance Proposal"
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onInsertText={text => setForm(f => ({ ...f, coverLetter: text }))}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-ast-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-ast-dark transition-colors disabled:opacity-60 shadow-sm"
      >
        {loading ? 'Submitting…' : <><Send size={14} /> Submit Proposal ({paymentMode === 'MILESTONE' ? 'Milestone' : 'Full Job'})</>}
      </button>
    </form>
  )
}
