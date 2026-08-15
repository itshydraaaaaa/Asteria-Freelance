'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Check, Sparkles } from 'lucide-react'
import { AIAssistantModal } from '@/components/ai/AIAssistantModal'

interface Props {
  jobId: string
  budget: number
  deliveryDays: number
}

export function ProposalForm({ jobId, budget, deliveryDays }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    coverLetter: '',
    price:       String(budget),
    deliveryDays: String(deliveryDays),
  })
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error,     setError]     = useState('')
  const [showAiModal, setShowAiModal] = useState(false)

  const handle = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/jobs/${jobId}/proposals`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
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
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-ast-muted flex items-center justify-center mx-auto mb-3">
          <Check size={22} className="text-ast-primary" />
        </div>
        <p className="font-semibold text-black text-sm">Proposal Submitted!</p>
        <p className="text-xs text-ast-gray mt-1">The client will review your proposal.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="font-semibold text-black text-sm mb-3">Submit a Proposal</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-black mb-1.5">Your Price ($)</label>
          <input
            type="number" min={1} max={budget * 2} value={form.price} onChange={handle('price')} required
            className="w-full border border-black/15 rounded-xl px-3 py-2 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-black mb-1.5">Delivery (days)</label>
          <input
            type="number" min={1} max={90} value={form.deliveryDays} onChange={handle('deliveryDays')} required
            className="w-full border border-black/15 rounded-xl px-3 py-2 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20"
          />
        </div>
      </div>

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
          value={form.coverLetter} onChange={handle('coverLetter')} required rows={4}
          placeholder="Introduce yourself and explain why you're the best fit for this project…"
          className="w-full border border-black/15 rounded-xl px-3 py-2 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 resize-none"
        />
      </div>

      <AIAssistantModal
        mode="PROPOSAL_LETTER"
        titleContext="Freelance Proposal"
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onInsertText={(text) => setForm(f => ({ ...f, coverLetter: text }))}
      />

      <button
        type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-ast-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-ast-dark transition-colors disabled:opacity-60"
      >
        {loading ? 'Submitting…' : <><Send size={13} /> Submit Proposal</>}
      </button>
    </form>
  )
}
