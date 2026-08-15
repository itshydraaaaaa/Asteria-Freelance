'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, Upload, Star, AlertTriangle, Send, FileText } from 'lucide-react'
import { MilestoneTracker } from '@/components/orders/MilestoneTracker'
import { ReviewSubmissionModal } from '@/components/orders/ReviewSubmissionModal'
import { EscrowStatusBar } from '@/components/ui/EscrowStatusBar'

interface Props {
  order: any
  userId: string
  userRole: 'BUYER' | 'SELLER'
}

export function OrderWorkspaceClient({ order, userId, userRole }: Props) {
  const [status, setStatus] = useState(order.status)
  const [deliverableUrl, setDeliverableUrl] = useState('')
  const [deliverableNotes, setDeliverableNotes] = useState('')
  const [delivering, setDelivering] = useState(false)

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false)

  // Dispute Modal State
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeDesc, setDisputeDesc] = useState('')
  const [disputing, setDisputing] = useState(false)

  const handleDeliver = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deliverableUrl.trim()) return

    try {
      setDelivering(true)
      const res = await fetch(`/api/orders/${order.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliverableUrl, notes: deliverableNotes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit deliverable')
      setStatus('PENDING')
      alert('Deliverable submitted successfully!')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDelivering(false)
    }
  }

  const handleComplete = async () => {
    try {
      const res = await fetch(`/api/orders/${order.id}/complete`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to complete order')
      setStatus('COMPLETED')
      setShowReviewModal(true)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setDisputing(true)
      const res = await fetch(`/api/orders/${order.id}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: disputeReason, description: disputeDesc }),
      })
      if (!res.ok) throw new Error('Failed to open dispute')
      setStatus('CANCELLED')
      setShowDisputeModal(false)
      alert('Dispute opened and escalated to Master Admin Dashboard!')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDisputing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sticky Escrow Status Bar */}
      <div className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 rounded-2xl overflow-hidden shadow-sm">
        <EscrowStatusBar
          status={status as any}
          amount={order.amount}
          currency="TND"
        />
      </div>

      {/* Milestone Escrow Component */}
      <MilestoneTracker
        orderId={order.id}
        totalAmount={order.amount}
        userRole={userRole}
        initialMilestones={order.milestones}
      />

      {/* Main Deliverables & Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-lg text-black">Order Service Details</h3>
            <div className="bg-ast-surface rounded-2xl p-4 border border-black/5 space-y-2">
              <p className="font-semibold text-sm text-black">{order.gig?.title}</p>
              <p className="text-xs text-ast-gray">Category: {order.gig?.category ?? 'Development'}</p>
              <p className="text-xs text-ast-gray">Expected Delivery: {order.gig?.deliveryDays ?? 5} Days</p>
            </div>

            {/* Work Delivery Submission for Seller */}
            {userRole === 'SELLER' && status !== 'COMPLETED' && (
              <form onSubmit={handleDeliver} className="border-t border-black/8 pt-4 space-y-3">
                <h4 className="font-bold text-sm text-black flex items-center gap-2">
                  <Upload size={16} className="text-ast-primary" /> Submit Final Deliverables
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-ast-dark mb-1">Deliverable URL / Archive Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="e.g. https://github.com/org/repo or Figma link"
                    value={deliverableUrl}
                    onChange={e => setDeliverableUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-xs outline-none focus:border-ast-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ast-dark mb-1">Delivery Notes & Instructions</label>
                  <textarea
                    rows={3}
                    placeholder="Provide setup instructions, revision notes, or login credentials..."
                    value={deliverableNotes}
                    onChange={e => setDeliverableNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-xs outline-none focus:border-ast-primary resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={delivering || !deliverableUrl.trim()}
                  className="w-full bg-ast-primary text-white text-xs font-semibold py-3 rounded-xl hover:bg-ast-dark transition-colors shadow-sm disabled:opacity-50"
                >
                  {delivering ? 'Submitting Deliverable...' : 'Submit Deliverable for Buyer Approval'}
                </button>
              </form>
            )}

            {/* Buyer Approval & Review Trigger */}
            {userRole === 'BUYER' && status === 'PENDING' && (
              <div className="border-t border-black/8 pt-4 space-y-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
                <h4 className="font-bold text-sm text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={18} /> Work Deliverable Submitted by Seller
                </h4>
                <p className="text-xs text-emerald-900/80">Please review the submitted files before releasing escrow funds.</p>

                <div className="flex gap-3">
                  <button
                    onClick={handleComplete}
                    className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Approve Work & Release {order.amount} TND
                  </button>
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="px-4 py-2.5 border border-red-200 text-red-600 bg-white text-xs font-semibold rounded-xl hover:bg-red-50"
                  >
                    Open Dispute
                  </button>
                </div>
              </div>
            )}

            {status === 'COMPLETED' && (
              <div className="border-t border-black/8 pt-4 space-y-3 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="font-heading font-bold text-lg text-black">Order Completed & Funds Released!</h4>
                {userRole === 'BUYER' && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="inline-flex items-center gap-2 bg-ast-primary text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-ast-dark transition-colors shadow-sm"
                  >
                    <Star size={14} /> Submit Rating & Written Review
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-black/8 p-5 space-y-3">
            <h4 className="font-semibold text-black text-sm">Escrow Protection</h4>
            <p className="text-xs text-ast-gray leading-relaxed">
              Funds are held securely in Asteria Escrow and are only released when milestones are approved or work is completed.
            </p>
            <button
              onClick={() => setShowDisputeModal(true)}
              className="w-full text-center text-xs text-red-600 font-semibold py-2 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
            >
              Report Dispute / Issue
            </button>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewSubmissionModal
        orderId={order.id}
        freelancerId={order.sellerId}
        gigId={order.gigId}
        freelancerName={order.seller?.name ?? 'Freelancer'}
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSuccess={() => alert('Thank you! Review saved.')}
      />

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 space-y-4">
            <h3 className="font-heading font-bold text-xl text-red-600 flex items-center gap-2">
              <AlertTriangle size={20} /> Escalated Dispute Request
            </h3>

            <form onSubmit={handleOpenDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ast-dark mb-1">Dispute Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scope disagreement or missed deadline"
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ast-dark mb-1">Detailed Explanation *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide evidence, chat details, or specification notes for Admin review..."
                  value={disputeDesc}
                  onChange={e => setDisputeDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ast-gray"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputing}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700"
                >
                  {disputing ? 'Submitting...' : 'Escalate to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
