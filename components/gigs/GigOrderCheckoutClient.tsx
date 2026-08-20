'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Clock, RefreshCw, Check, ShieldCheck, DollarSign, Layers,
  Plus, Trash2, ArrowRight, Wallet, MessageSquare, AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface PackageOption {
  label: string
  price: number
  deliveryDays: number
  revisions: number
  features: string[]
}

interface Props {
  gig: any
  freelancer: any
  packages: PackageOption[]
}

export function GigOrderCheckoutClient({ gig, freelancer, packages }: Props) {
  const router = useRouter()
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(1) // Default to Standard
  const [paymentMode, setPaymentMode] = useState<'FULL_JOB' | 'MILESTONE'>('FULL_JOB')
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedPkg = packages[selectedPkgIndex]

  // Custom milestones if milestone mode is selected
  const [milestones, setMilestones] = useState([
    { title: 'Milestone 1: Design Concept & Specs', amount: Math.round(selectedPkg.price * 0.4), deliveryDays: Math.max(1, Math.round(selectedPkg.deliveryDays * 0.4)) },
    { title: 'Milestone 2: Final Implementation & Handoff', amount: Math.round(selectedPkg.price * 0.6), deliveryDays: Math.max(1, Math.round(selectedPkg.deliveryDays * 0.6)) },
  ])

  // Recalculate default milestones when package changes
  const handleSelectPackage = (index: number) => {
    setSelectedPkgIndex(index)
    const pkg = packages[index]
    setMilestones([
      { title: 'Milestone 1: Design Concept & Specs', amount: Math.round(pkg.price * 0.4), deliveryDays: Math.max(1, Math.round(pkg.deliveryDays * 0.4)) },
      { title: 'Milestone 2: Final Implementation & Handoff', amount: Math.round(pkg.price * 0.6), deliveryDays: Math.max(1, Math.round(pkg.deliveryDays * 0.6)) },
    ])
  }

  const updateMilestone = (index: number, field: string, value: any) => {
    setMilestones(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const addMilestone = () => {
    setMilestones(prev => [
      ...prev,
      {
        title: `Milestone ${prev.length + 1}: Additional Scope`,
        amount: 50,
        deliveryDays: 2,
      },
    ])
  }

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return
    setMilestones(prev => prev.filter((_, i) => i !== index))
  }

  const milestonesSum = milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0)

  const handlePlaceOrder = async () => {
    try {
      setLoading(true)
      setError('')

      if (paymentMode === 'MILESTONE' && Math.abs(milestonesSum - selectedPkg.price) > 1) {
        throw new Error(`The sum of milestones (${milestonesSum} TND) must match the package price (${selectedPkg.price} TND)`)
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: gig.id,
          packageLabel: selectedPkg.label,
          amount: selectedPkg.price,
          paymentMode,
          milestones: paymentMode === 'MILESTONE' ? milestones : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login?redirect=' + encodeURIComponent(`/gig/${gig.id}`))
          return
        }
        throw new Error(data.error || 'Failed to place order')
      }

      // Redirect directly to the live Order Workspace
      router.push(`/dashboard/orders/${data.orderId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-3xl border border-black/8 overflow-hidden sticky top-24 shadow-sm">
        {/* Package Tabs */}
        <div className="flex border-b border-black/8 bg-ast-surface/50">
          {packages.map((pkg, i) => (
            <button
              key={pkg.label}
              onClick={() => handleSelectPackage(i)}
              className={`flex-1 py-3.5 text-xs font-semibold transition-all border-b-2 ${
                selectedPkgIndex === i
                  ? 'bg-white text-ast-primary border-ast-primary font-bold shadow-2xs'
                  : 'border-transparent text-ast-gray hover:text-black'
              }`}
            >
              {pkg.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-baseline justify-between">
            <span className="font-heading font-bold text-3xl text-black">{selectedPkg.price} TND</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
              Escrow Protected
            </span>
          </div>

          <p className="text-xs text-ast-gray leading-relaxed">
            {selectedPkg.label === 'Basic'
              ? 'Core foundation deliverables with standard specs and commercial licensing.'
              : selectedPkg.label === 'Standard'
              ? 'Complete production package with full source files, revisions and priority support.'
              : 'Enterprise VIP tier with express turnaround, unlimited concepts and dedicated support.'}
          </p>

          <div className="flex items-center gap-4 text-xs text-ast-gray py-2 border-y border-black/5">
            <span className="flex items-center gap-1.5 font-medium text-black">
              <Clock size={14} className="text-ast-primary" /> {selectedPkg.deliveryDays} Days Delivery
            </span>
            <span className="flex items-center gap-1.5 font-medium text-black">
              <RefreshCw size={14} className="text-ast-primary" /> {selectedPkg.revisions} Revisions
            </span>
          </div>

          <ul className="space-y-2.5">
            {selectedPkg.features.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-xs text-ast-gray">
                <Check size={14} className="text-ast-primary shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowCheckoutModal(true)}
              className="w-full bg-ast-primary text-white rounded-2xl py-3.5 font-semibold text-sm hover:bg-ast-dark transition-all shadow-sm flex items-center justify-center gap-2 group"
            >
              <span>Order Now ({selectedPkg.price} TND)</span>
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            <Link
              href={`/dashboard/messages?user=${freelancer.id}`}
              className="w-full border border-black/15 text-black rounded-2xl py-3 text-xs font-semibold hover:bg-ast-surface transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare size={14} />
              <span>Contact Freelancer</span>
            </Link>
          </div>

          <div className="pt-3 border-t border-black/5 flex items-center justify-center gap-2 text-[11px] text-ast-gray">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Funds held in escrow until you approve the work</span>
          </div>
        </div>
      </div>

      {/* CHECKOUT & ESCROW ORDER MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-black/10 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/8 pb-3">
              <div>
                <h3 className="font-heading font-bold text-xl text-black">Confirm Escrow Order</h3>
                <p className="text-xs text-ast-gray">{gig.title} · {selectedPkg.label} Tier</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="text-ast-gray hover:text-black text-xl p-1"
              >
                ✕
              </button>
            </div>

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
                      Top Up Wallet via Stripe or Bank RIB →
                    </Link>
                  )}
                  {(error.includes('KYC') || error.includes('verification')) && (
                    <Link
                      href="/dashboard/verification"
                      className="inline-block px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors shadow-xs"
                    >
                      Complete Identity Verification (KYC) →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Payment Escrow Structure Choice */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-black">Choose Payment Structure:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode('FULL_JOB')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    paymentMode === 'FULL_JOB'
                      ? 'border-ast-primary bg-ast-primary/5 ring-2 ring-ast-primary/20'
                      : 'border-black/10 bg-white hover:border-black/20'
                  }`}
                >
                  <span className="font-semibold text-xs text-black block mb-0.5">🚀 Full Job (100%)</span>
                  <p className="text-[11px] text-ast-gray">Fund full {selectedPkg.price} TND into escrow, released upon final review.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('MILESTONE')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    paymentMode === 'MILESTONE'
                      ? 'border-ast-primary bg-ast-primary/5 ring-2 ring-ast-primary/20'
                      : 'border-black/10 bg-white hover:border-black/20'
                  }`}
                >
                  <span className="font-semibold text-xs text-black block mb-0.5">📑 Milestone Phases</span>
                  <p className="text-[11px] text-ast-gray">Break down into smaller phases funded and released sequentially.</p>
                </button>
              </div>
            </div>

            {/* Milestone Builder (if Milestone mode selected) */}
            {paymentMode === 'MILESTONE' && (
              <div className="bg-ast-surface/50 rounded-2xl p-4 border border-black/8 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-black flex items-center gap-1">
                    <Layers size={14} className="text-ast-primary" /> Milestone Breakdown
                  </span>
                  <span className={`text-xs font-bold ${Math.abs(milestonesSum - selectedPkg.price) <= 1 ? 'text-emerald-600' : 'text-red-500'}`}>
                    Sum: {milestonesSum} / {selectedPkg.price} TND
                  </span>
                </div>

                <div className="space-y-2.5">
                  {milestones.map((m, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-black/10 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={m.title}
                          onChange={e => updateMilestone(idx, 'title', e.target.value)}
                          placeholder="Milestone title"
                          className="w-full text-xs font-semibold text-black border-b border-black/10 pb-0.5 outline-none focus:border-ast-primary"
                        />
                        {milestones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMilestone(idx)}
                            className="text-ast-gray hover:text-red-500 p-1"
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
                            min={10}
                            value={m.amount}
                            onChange={e => updateMilestone(idx, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full border border-black/10 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-ast-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-ast-gray block">Days</label>
                          <input
                            type="number"
                            min={1}
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
                  className="w-full py-1.5 border border-dashed border-ast-primary/40 rounded-xl text-xs font-semibold text-ast-primary hover:bg-ast-primary/5 flex items-center justify-center gap-1"
                >
                  <Plus size={13} /> Add Milestone Phase
                </button>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="bg-ast-surface rounded-2xl p-4 border border-black/5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-ast-gray">
                <span>Selected Package:</span>
                <span className="font-semibold text-black">{selectedPkg.label} ({selectedPkg.deliveryDays} Days)</span>
              </div>
              <div className="flex items-center justify-between text-ast-gray">
                <span>Order Total:</span>
                <span className="font-bold text-base text-black">{selectedPkg.price} TND</span>
              </div>
              <div className="flex items-center justify-between text-ast-gray">
                <span>Escrow Protection:</span>
                <span className="font-semibold text-emerald-600">Included (Free)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-ast-gray hover:bg-ast-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handlePlaceOrder}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-ast-primary text-white hover:bg-ast-dark transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Funding Escrow...' : `Confirm & Place Order (${selectedPkg.price} TND)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
