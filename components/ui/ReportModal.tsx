'use client'

import { useState } from 'react'
import { Flag, X, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Props {
  targetType: 'GIG' | 'JOB' | 'USER'
  targetId: string
  targetTitle: string
  isOpen: boolean
  onClose: () => void
}

export function ReportModal({ targetType, targetId, targetTitle, isOpen, onClose }: Props) {
  const [reason, setReason] = useState('Inappropriate Content')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!description.trim()) {
      setErrorMsg('Please describe the issue in detail.')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          targetTitle,
          reason,
          description,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit report.')

      setSuccessMsg('Report submitted successfully. Our team will review this item.')
      setTimeout(() => {
        setSuccessMsg('')
        onClose()
      }, 1800)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-black/10 relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-ast-gray hover:text-black p-1 rounded-full hover:bg-ast-surface transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
            <Flag size={20} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-black">Report {targetType}</h3>
            <p className="text-ast-gray text-xs truncate max-w-xs">{targetTitle}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle size={14} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 size={14} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ast-dark mb-1.5">Reason for Report</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm bg-white focus:outline-none focus:border-ast-primary"
            >
              <option value="Inappropriate Content">Inappropriate / Offensive Content</option>
              <option value="Spam or Scam">Spam, Scam, or Phishing</option>
              <option value="Misleading Pricing">Misleading Pricing or Scope</option>
              <option value="Copyright Violation">Copyright or Intellectual Property Theft</option>
              <option value="Unresponsive / Fraud">Unresponsive User / Fraudulent Activity</option>
              <option value="Other">Other Violation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ast-dark mb-1.5">Description & Evidence</label>
            <textarea
              rows={4}
              required
              placeholder="Provide specific details about why this item breaks terms of service..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-ast-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-ast-gray hover:bg-ast-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
