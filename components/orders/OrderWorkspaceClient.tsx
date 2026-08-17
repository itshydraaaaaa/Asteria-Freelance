'use client'

import { useState, useEffect, useRef } from 'react'
import {
  CheckCircle2, Clock, Upload, Star, AlertTriangle, Send,
  FileText, MessageSquare, ShieldCheck, User, ArrowRight, Check
} from 'lucide-react'
import { MilestoneTracker } from '@/components/orders/MilestoneTracker'
import { ReviewSubmissionModal } from '@/components/orders/ReviewSubmissionModal'
import { EscrowStatusBar } from '@/components/ui/EscrowStatusBar'
import Link from 'next/link'

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

  // Inline Quick Chat State
  const partnerId = userRole === 'BUYER' ? order.sellerId : order.buyerId
  const partnerName = userRole === 'BUYER'
    ? (order.seller?.name ?? 'Freelancer')
    : (order.buyer?.name ?? 'Client')
  const partnerRole = userRole === 'BUYER' ? 'FREELANCER' : 'CLIENT'

  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  const fetchOrderChat = async () => {
    if (!partnerId) return
    try {
      const res = await fetch(`/api/messages?partnerId=${encodeURIComponent(partnerId)}`)
      const data = await res.json()
      if (res.ok && data.messages) {
        setChatMessages(data.messages)
      }
    } catch {}
  }

  useEffect(() => {
    fetchOrderChat()
    const interval = setInterval(fetchOrderChat, 4000)
    return () => clearInterval(interval)
  }, [partnerId])

  const handleSendOrderMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!chatInput.trim() || !partnerId) return

    const msg = chatInput.trim()
    setChatInput('')

    try {
      setSendingMsg(true)
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: partnerId,
          content: `[Order #${order.id.slice(0, 8)}] ${msg}`,
          msgType: 'TEXT',
        }),
      })
      if (res.ok) {
        await fetchOrderChat()
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    } catch {} finally {
      setSendingMsg(false)
    }
  }

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

      {/* Milestone Escrow Tracker & Customizer */}
      <MilestoneTracker
        orderId={order.id}
        totalAmount={order.amount}
        userRole={userRole}
        initialMilestones={order.milestones}
      />

      {/* Main Grid: Details, Deliverables, Actions & Live Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details Card */}
          <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-black">Order Service Details</h3>
              <span className="text-xs font-bold px-3 py-1 bg-ast-surface rounded-full text-black border border-black/10">
                Status: {status}
              </span>
            </div>

            <div className="bg-ast-surface/60 rounded-2xl p-4 border border-black/5 space-y-2">
              <p className="font-semibold text-sm text-black">{order.gig?.title ?? 'Custom Project Escrow Contract'}</p>
              <div className="flex flex-wrap gap-4 text-xs text-ast-gray pt-1">
                <span>Category: <strong className="text-black">{order.gig?.category ?? 'Digital Services'}</strong></span>
                <span>Expected Delivery: <strong className="text-black">{order.gig?.deliveryDays ?? 5} Days</strong></span>
                <span>Order Total: <strong className="text-emerald-700 font-bold">{order.amount} TND</strong></span>
              </div>
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

          {/* INLINE LIVE MESSENGER WITH SELLER / CLIENT */}
          <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-black/8 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-ast-primary text-white flex items-center justify-center font-bold text-xs">
                  {partnerName[0] ?? 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-black">Order Discussion & Communication</h4>
                  <p className="text-[11px] text-ast-gray">Direct messaging with <strong>{partnerName}</strong></p>
                </div>
              </div>

              <Link
                href={`/dashboard/messages?user=${partnerId}`}
                className="px-3.5 py-1.5 rounded-xl bg-ast-surface border border-black/10 text-xs font-semibold text-ast-primary hover:bg-ast-primary hover:text-white transition-colors flex items-center gap-1"
              >
                <span>Full Chat View</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Chat Thread */}
            <div className="h-56 overflow-y-auto space-y-2.5 bg-ast-surface/30 p-3.5 rounded-2xl border border-black/5 text-xs">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-ast-gray text-xs">
                  No messages yet. Send a message to coordinate project details!
                </div>
              ) : (
                chatMessages.map((m: any) => {
                  const isMe = m.senderId === userId
                  return (
                    <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3 py-2 rounded-2xl max-w-xs ${isMe ? 'bg-ast-dark text-white rounded-br-xs' : 'bg-white text-black border border-black/8 rounded-bl-xs shadow-2xs'}`}>
                        <p>{m.content}</p>
                      </div>
                      <span className="text-[9px] text-ast-gray mt-0.5 px-1">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendOrderMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder={`Message ${partnerName}...`}
                className="flex-1 px-4 py-2.5 bg-ast-surface rounded-xl text-xs outline-none focus:border-ast-primary border border-black/5"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || sendingMsg}
                className="px-4 py-2.5 bg-ast-primary text-white text-xs font-semibold rounded-xl hover:bg-ast-dark transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                <Send size={13} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar: Partner Profile & Order Status Actions */}
        <div className="space-y-5">
          {/* Contact Partner Card */}
          <div className="bg-white rounded-3xl border border-black/8 p-6 space-y-4 shadow-sm">
            <h4 className="font-semibold text-black text-sm">
              {userRole === 'BUYER' ? 'Seller Contact Information' : 'Buyer Information'}
            </h4>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-ast-primary text-white font-bold text-base flex items-center justify-center shrink-0">
                {partnerName[0] ?? 'U'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-black truncate">{partnerName}</p>
                <span className="inline-block text-[10px] font-semibold text-ast-primary bg-ast-muted px-2 py-0.5 rounded-full">
                  {partnerRole}
                </span>
              </div>
            </div>

            <Link
              href={`/dashboard/messages?user=${partnerId}`}
              className="w-full bg-ast-primary text-white rounded-2xl py-3 text-xs font-bold hover:bg-ast-dark transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <MessageSquare size={14} />
              <span>{userRole === 'BUYER' ? 'Contact Seller in Messages' : 'Contact Client in Messages'}</span>
            </Link>
          </div>

          {/* Escrow Protection Card */}
          <div className="bg-white rounded-3xl border border-black/8 p-6 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              <h4 className="font-semibold text-black text-sm">Escrow Protection</h4>
            </div>
            <p className="text-xs text-ast-gray leading-relaxed">
              Funds are held securely in Asteria Escrow. <strong>{order.amount} TND</strong> will only be released when you approve the deliverables.
            </p>
            <button
              onClick={() => setShowDisputeModal(true)}
              className="w-full text-center text-xs text-red-600 font-semibold py-2.5 rounded-xl border border-red-200 hover:bg-red-50 transition-colors mt-2"
            >
              Report Dispute / Escalate to Admin
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
