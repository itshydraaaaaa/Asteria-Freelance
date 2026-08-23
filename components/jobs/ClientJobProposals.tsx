'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Check, X, MessageSquare, Star, Clock, ShieldCheck,
  Wallet, AlertCircle, ArrowRight, UserCheck, CheckCircle2
} from 'lucide-react'

interface Proposal {
  id: string
  jobId: string
  freelancerId: string
  coverLetter: string
  price: number
  deliveryDays: number
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string | Date
  freelancer?: {
    id: string
    name: string
    image?: string
    role?: string
    rating?: number
    reviewCount?: number
    bio?: string
    skills?: string[]
  }
}

interface Props {
  job: any
  initialProposals: Proposal[]
  isJobOwner: boolean
}

export function ClientJobProposals({ job, initialProposals, isJobOwner }: Props) {
  const router = useRouter()
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [selectedProposalForHire, setSelectedProposalForHire] = useState<Proposal | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  // Fetch client wallet balance
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user?.walletBalance !== undefined) {
          setWalletBalance(Number(data.user.walletBalance))
        }
      })
      .catch(() => {})
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  const handleDecision = async (proposalId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      setLoadingId(proposalId)
      setError('')

      const res = await fetch(`/api/jobs/${job.id}/proposals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, action }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update proposal')
      }

      if (action === 'ACCEPT') {
        showToast('🎉 Proposal accepted! Escrow funded.')
        setSelectedProposalForHire(null)
        // Route client directly to the created live Order Workspace
        if (data.orderId) {
          router.push(`/dashboard/orders/${data.orderId}`)
          return
        }
      } else {
        showToast('Proposal declined.')
        setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'REJECTED' } : p))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  const acceptedProposal = proposals.find(p => p.status === 'ACCEPTED')

  return (
    <div className="bg-white rounded-3xl border border-black/8 p-6 md:p-8 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-xl text-black">
              Freelancer Applications & Proposals
            </h2>
            <span className="bg-ast-muted text-ast-primary font-bold text-xs px-2.5 py-0.5 rounded-full">
              {proposals.length}
            </span>
          </div>
          <p className="text-xs text-ast-gray mt-1">
            Review applicant proposals, compare pricing and portfolios, and hire your preferred freelancer into funded escrow.
          </p>
        </div>

        {walletBalance !== null && (
          <div className="bg-ast-surface rounded-2xl px-4 py-2 border border-black/8 flex items-center gap-3 shrink-0">
            <Wallet size={16} className="text-ast-primary" />
            <div>
              <span className="text-[10px] text-ast-gray block uppercase font-medium">Your Wallet Balance</span>
              <span className="text-xs font-bold text-black">{walletBalance.toFixed(2)} TND</span>
            </div>
            <Link
              href="/dashboard/wallet"
              className="text-[11px] font-bold text-ast-primary hover:underline ml-1"
            >
              + Top Up
            </Link>
          </div>
        )}
      </div>

      {/* Global Status Banner if Already Hired */}
      {acceptedProposal && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">
                Freelancer Hired: {acceptedProposal.freelancer?.name || 'Freelancer'}
              </p>
              <p className="text-[11px] text-emerald-700">
                Contract is currently active in escrow for {acceptedProposal.price} TND.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/orders"
            className="bg-emerald-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-800 transition-colors shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>View Active Order Workspace</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <p className="font-semibold">{error}</p>
            {error.includes('wallet balance') && (
              <Link
                href="/dashboard/wallet"
                className="inline-block font-bold text-red-800 underline hover:no-underline"
              >
                Top Up Wallet Now →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-ast-dark text-white text-xs font-semibold px-4 py-3 rounded-2xl flex items-center justify-between shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="text-white/60 hover:text-white">✕</button>
        </div>
      )}

      {/* Empty State */}
      {proposals.length === 0 ? (
        <div className="text-center py-12 bg-ast-surface/50 rounded-2xl border border-black/5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-black/8 flex items-center justify-center text-ast-gray mx-auto">
            <UserCheck size={24} />
          </div>
          <p className="text-sm font-semibold text-black">No applications submitted yet</p>
          <p className="text-xs text-ast-gray max-w-sm mx-auto">
            Freelancers across Tunisia will be notified about your project. When they submit a proposal, their bids and cover letters will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => {
            const fl = p.freelancer || { name: 'Freelancer', id: p.freelancerId, rating: 5.0, reviewCount: 0 }
            const flInitials = (fl.name || 'F').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            const isAccepted = p.status === 'ACCEPTED'
            const isRejected = p.status === 'REJECTED'
            const isPending = p.status === 'PENDING'

            return (
              <div
                key={p.id}
                className={`rounded-2xl border transition-all p-5 space-y-4 ${
                  isAccepted
                    ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                    : isRejected
                    ? 'border-black/5 bg-gray-50/50 opacity-60'
                    : 'border-black/10 bg-white hover:border-ast-primary/40 shadow-xs'
                }`}
              >
                {/* Applicant Profile Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {fl.image ? (
                      <img
                        src={fl.image}
                        alt={fl.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-black/10 shadow-2xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-ast-primary text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                        {flInitials}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/freelancers/${p.freelancerId}`}
                          className="font-bold text-sm text-black hover:text-ast-primary transition-colors"
                        >
                          {fl.name}
                        </Link>
                        <span className="text-[10px] font-bold text-ast-primary bg-ast-muted px-2 py-0.5 rounded-full">
                          ✓ Verified
                        </span>
                        {isAccepted && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            ★ Hired & Active
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[10px] font-bold text-gray-600 bg-gray-200 px-2.5 py-0.5 rounded-full">
                            Declined
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-ast-gray mt-1">
                        <div className="flex items-center gap-1 text-black font-semibold">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          <span>{fl.rating ? Number(fl.rating).toFixed(1) : '5.0'}</span>
                        </div>
                        {fl.reviewCount !== undefined && <span>· {fl.reviewCount} reviews</span>}
                        <span>· Submitted {new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Proposal Bid & Delivery Badge */}
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="text-left sm:text-right">
                      <span className="font-heading font-bold text-lg text-ast-primary block">
                        {p.price} TND
                      </span>
                      <span className="text-[11px] text-ast-gray flex items-center sm:justify-end gap-1">
                        <Clock size={12} /> {p.deliveryDays} day{p.deliveryDays !== 1 ? 's' : ''} delivery
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cover Letter */}
                <div className="bg-ast-surface/60 rounded-xl p-4 border border-black/5 text-xs text-black leading-relaxed whitespace-pre-line">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ast-gray mb-1.5">
                    Proposal Cover Letter
                  </p>
                  {p.coverLetter}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-black/5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/messages?user=${p.freelancerId}`}
                      className="px-3.5 py-2 bg-ast-surface border border-black/10 rounded-xl text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare size={13} />
                      <span>Chat / Interview</span>
                    </Link>

                    <Link
                      href={`/freelancers/${p.freelancerId}`}
                      className="text-xs text-ast-gray hover:text-black font-medium px-2 py-1"
                    >
                      View Portfolio →
                    </Link>
                  </div>

                  {isJobOwner && isPending && !acceptedProposal && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={loadingId === p.id}
                        onClick={() => handleDecision(p.id, 'REJECT')}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <X size={13} />
                        <span>Decline</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedProposalForHire(p)}
                        className="px-5 py-2 bg-ast-primary text-white rounded-xl text-xs font-bold hover:bg-ast-dark transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>Accept & Hire ({p.price} TND)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CONFIRMATION & ESCROW FUNDING MODAL */}
      {selectedProposalForHire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 space-y-5">
            <div className="flex items-center justify-between border-b border-black/8 pb-3">
              <div>
                <h3 className="font-heading font-bold text-lg text-black">Accept Proposal & Hire</h3>
                <p className="text-xs text-ast-gray">{job.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProposalForHire(null)}
                className="text-ast-gray hover:text-black text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Price & Balance Details */}
            <div className="bg-ast-surface rounded-2xl p-4 border border-black/8 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-ast-gray">
                <span>Selected Freelancer:</span>
                <span className="font-bold text-black">{selectedProposalForHire.freelancer?.name || 'Applicant'}</span>
              </div>
              <div className="flex items-center justify-between text-ast-gray">
                <span>Contract Delivery Time:</span>
                <span className="font-semibold text-black">{selectedProposalForHire.deliveryDays} Days</span>
              </div>
              <div className="flex items-center justify-between text-ast-gray">
                <span>Agreed Escrow Amount:</span>
                <span className="font-bold text-base text-ast-primary">{selectedProposalForHire.price} TND</span>
              </div>
              <div className="flex items-center justify-between text-ast-gray pt-1 border-t border-black/5">
                <span>Your Available Wallet Balance:</span>
                <span className={`font-bold ${walletBalance !== null && walletBalance < selectedProposalForHire.price ? 'text-red-600' : 'text-emerald-700'}`}>
                  {walletBalance !== null ? `${walletBalance.toFixed(2)} TND` : '...'}
                </span>
              </div>
            </div>

            {walletBalance !== null && walletBalance < selectedProposalForHire.price ? (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl p-3.5 flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Insufficient Wallet Balance</p>
                  <p className="text-[11px] text-red-600 leading-relaxed">
                    You have {walletBalance.toFixed(2)} TND in your account. You need {(selectedProposalForHire.price - walletBalance).toFixed(2)} TND more to fund escrow and hire this freelancer.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl p-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span className="text-[11px]">
                  Funds will be safely held in escrow and only released when you approve the delivered work.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedProposalForHire(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-ast-gray hover:bg-ast-surface"
              >
                Cancel
              </button>

              {walletBalance !== null && walletBalance < selectedProposalForHire.price ? (
                <Link
                  href="/dashboard/wallet"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Wallet size={14} /> Top Up Wallet ({(selectedProposalForHire.price - walletBalance).toFixed(0)} TND Needed)
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={loadingId === selectedProposalForHire.id}
                  onClick={() => handleDecision(selectedProposalForHire.id, 'ACCEPT')}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-ast-primary text-white hover:bg-ast-dark transition-all shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingId === selectedProposalForHire.id ? 'Funding Escrow...' : `Confirm & Hire (${selectedProposalForHire.price} TND)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}