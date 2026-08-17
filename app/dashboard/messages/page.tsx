'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Search, DollarSign, Paperclip, CheckCircle2, Clock, X, FileText, Layers, Plus, Trash2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

const MOCK_CONVERSATIONS = [
  {
    id: 'c1', name: 'Sara Al-Mansouri', role: 'UI/UX Designer', avatar: 'S',
    last: 'Custom Offer: Complete Redesign Package', time: '2m ago', unread: 1,
  },
  {
    id: 'c2', name: 'Karim Benali', role: 'Full-stack Dev', avatar: 'K',
    last: 'I can start next Monday, does that work?', time: '1h ago', unread: 0,
  },
  {
    id: 'c3', name: 'Lina Hadad', role: 'Data Scientist', avatar: 'L',
    last: 'The model accuracy is now at 94.2%', time: '3h ago', unread: 0,
  },
]

interface MessageItem {
  from: 'me' | 'them'
  text: string
  time: string
  isOffer?: boolean
  offerDetails?: {
    id: string
    title: string
    price: number
    deliveryDays: number
    paymentMode?: 'FULL_JOB' | 'MILESTONE'
    milestones?: Array<{ title: string; amount: number; deliveryDays: number }>
    status: 'PENDING' | 'ACCEPTED'
  }
}

const MOCK_MESSAGES: Record<string, MessageItem[]> = {
  c1: [
    { from: 'them', text: 'Hi! I have analyzed your SaaS dashboard scope.', time: '10:00' },
    { from: 'me',   text: 'Awesome! Can you send a custom offer for 5 design screens?', time: '10:05' },
    {
      from: 'them',
      text: 'Here is the custom offer for 5 high-fidelity screens + Figma source files.',
      time: '10:15',
      isOffer: true,
      offerDetails: {
        id: 'off_101',
        title: '5 SaaS Dashboard Screens (Figma + Dark/Light Theme)',
        price: 350,
        deliveryDays: 4,
        status: 'PENDING',
      }
    },
  ],
  c2: [
    { from: 'me',   text: 'Hi Karim, saw your profile — very impressive portfolio!', time: '09:00' },
    { from: 'them', text: 'Thank you! I specialise in Next.js and Prisma projects.', time: '09:15' },
    { from: 'them', text: 'I can start next Monday, does that work?', time: '09:40' },
  ],
  c3: [
    { from: 'them', text: 'Just ran the latest training cycle on the updated dataset.', time: '14:00' },
    { from: 'them', text: 'The model accuracy is now at 94.2%', time: '14:08' },
  ],
}

export default function MessagesPage() {
  const [activeId, setActiveId] = useState('c1')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [search, setSearch] = useState('')
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerPaymentMode, setOfferPaymentMode] = useState<'FULL_JOB' | 'MILESTONE'>('FULL_JOB')
  const [offerTitle, setOfferTitle] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [offerDelivery, setOfferDelivery] = useState('3')
  const [offerMilestones, setOfferMilestones] = useState<Array<{ title: string; amount: number; deliveryDays: number }>>([
    { title: 'Milestone 1: Wireframes & Architecture', amount: 150, deliveryDays: 2 },
    { title: 'Milestone 2: Final Implementation & Handoff', amount: 200, deliveryDays: 2 },
  ])
  const [offerSubmitting, setOfferSubmitting] = useState(false)

  const active = MOCK_CONVERSATIONS.find(c => c.id === activeId)!
  const filtered = MOCK_CONVERSATIONS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const send = () => {
    if (!input.trim()) return
    setMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), { from: 'me', text: input.trim(), time: 'now' }],
    }))
    setInput('')
  }

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offerTitle || !offerPrice) return

    const numericPrice = parseFloat(offerPrice) || 0
    const milestoneSum = offerMilestones.reduce((s, m) => s + (Number(m.amount) || 0), 0)
    if (offerPaymentMode === 'MILESTONE' && Math.abs(milestoneSum - numericPrice) > 1) {
      alert(`The sum of milestones (${milestoneSum} TND) must match the total offer price (${numericPrice} TND)`)
      return
    }

    try {
      setOfferSubmitting(true)
      const res = await fetch('/api/messages/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: activeId,
          title: offerTitle,
          price: offerPrice,
          deliveryDays: offerDelivery,
          paymentMode: offerPaymentMode,
          milestones: offerPaymentMode === 'MILESTONE' ? offerMilestones : undefined,
        }),
      })

      const data = await res.json()

      const newMsg: MessageItem = {
        from: 'me',
        text: `Custom Offer: ${offerTitle}`,
        time: 'Just now',
        isOffer: true,
        offerDetails: {
          id: data.offer?.id ?? `off_${Date.now()}`,
          title: offerTitle,
          price: numericPrice,
          deliveryDays: parseInt(offerDelivery, 10),
          paymentMode: offerPaymentMode,
          milestones: offerPaymentMode === 'MILESTONE' ? offerMilestones : undefined,
          status: 'PENDING',
        }
      }

      setMessages(prev => ({
        ...prev,
        [activeId]: [...(prev[activeId] ?? []), newMsg]
      }))

      setShowOfferModal(false)
      setOfferTitle('')
      setOfferPrice('')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setOfferSubmitting(false)
    }
  }

  const handleAcceptOffer = (msgIndex: number) => {
    setMessages(prev => {
      const currentList = [...(prev[activeId] ?? [])]
      if (currentList[msgIndex]?.offerDetails) {
        currentList[msgIndex] = {
          ...currentList[msgIndex],
          offerDetails: {
            ...currentList[msgIndex].offerDetails!,
            status: 'ACCEPTED',
          }
        }
      }
      return {
        ...prev,
        [activeId]: currentList
      }
    })
    alert('Offer accepted! Escrow funded and Order Workspace created.')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-black">Direct Messages & Offers</h1>
          <p className="text-ast-gray text-xs">Chat with clients and propose custom milestone offers</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-black/8 overflow-hidden shadow-sm flex flex-col md:flex-row h-[650px]">
        {/* Sidebar */}
        <div className="w-full md:w-80 border-r border-black/8 flex flex-col bg-white">
          <div className="p-4 border-b border-black/8">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-ast-surface rounded-xl pl-9 pr-4 py-2 text-xs outline-none text-black placeholder:text-ast-gray border border-black/5 focus:border-ast-primary"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-black/5">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-ast-surface/70 transition-colors ${activeId === c.id ? 'bg-ast-surface/90 border-l-4 border-l-ast-primary' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-black truncate">{c.name}</p>
                    <span className="text-[10px] text-ast-gray shrink-0 ml-1">{c.time}</span>
                  </div>
                  <p className="text-xs text-ast-gray truncate mt-0.5">{c.last}</p>
                </div>
                {c.unread > 0 && (
                  <span className="w-5 h-5 bg-ast-primary rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Conversation Window */}
        <div className="flex-1 flex flex-col bg-ast-surface/20">
          <div className="px-6 py-4 border-b border-black/8 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-sm">
                {active.avatar}
              </div>
              <div>
                <p className="font-bold text-sm text-black">{active.name}</p>
                <p className="text-xs text-ast-gray">{active.role}</p>
              </div>
            </div>
            <button
              onClick={() => setShowOfferModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-ast-primary/30 text-ast-primary text-xs font-semibold hover:bg-ast-muted transition-colors"
            >
              <DollarSign size={13} /> Create Custom Offer
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {(messages[activeId] ?? []).map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                  m.from === 'me'
                    ? 'bg-ast-primary text-white rounded-br-sm shadow-sm'
                    : 'bg-white text-black border border-black/8 rounded-bl-sm shadow-sm'
                }`}>
                  <p className="leading-relaxed">{m.text}</p>

                  {/* Render Custom Offer Card inside message */}
                  {m.isOffer && m.offerDetails && (
                    <div className={`mt-3 p-4 rounded-xl border ${
                      m.from === 'me' ? 'bg-ast-dark/50 border-white/20 text-white' : 'bg-ast-surface border-ast-primary/20 text-black'
                    }`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-ast-light text-ast-dark px-2 py-0.5 rounded">
                          {m.offerDetails.paymentMode === 'MILESTONE' ? 'Milestone Offer' : 'Custom Offer'}
                        </span>
                        <span className="font-heading font-bold text-lg">{m.offerDetails.price} TND</span>
                      </div>
                      <h4 className="font-bold text-sm mb-1">{m.offerDetails.title}</h4>
                      <p className="text-xs opacity-75 mb-2 flex items-center gap-1">
                        <Clock size={12} /> Delivery: {m.offerDetails.deliveryDays} days · 12% Platform Fee
                      </p>

                      {/* Milestone List in Chat Card if present */}
                      {m.offerDetails.milestones && m.offerDetails.milestones.length > 0 && (
                        <div className="my-2.5 space-y-1.5 border-t border-black/10 pt-2 text-xs">
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">Milestone Breakdown:</p>
                          {m.offerDetails.milestones.map((ms, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] bg-black/5 px-2.5 py-1 rounded-lg">
                              <span>{idx + 1}. {ms.title}</span>
                              <strong className="font-bold">{ms.amount} TND</strong>
                            </div>
                          ))}
                        </div>
                      )}

                      {m.offerDetails.status === 'PENDING' ? (
                        m.from === 'them' ? (
                          <button
                            onClick={() => handleAcceptOffer(i)}
                            className="w-full bg-ast-primary text-white font-semibold py-2 rounded-xl text-xs hover:bg-ast-dark transition-colors flex items-center justify-center gap-1.5 shadow-sm mt-2"
                          >
                            <CheckCircle2 size={14} /> Accept & Fund Escrow ({m.offerDetails.price} TND)
                          </button>
                        ) : (
                          <span className="block text-center text-xs opacity-70 italic py-1 mt-1">Pending buyer approval</span>
                        )
                      ) : (
                        <div className="bg-emerald-500/20 text-emerald-300 p-2 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1 mt-2">
                          <CheckCircle2 size={14} /> Offer Funded & Escrow Locked!
                        </div>
                      )}
                    </div>
                  )}

                  <p className={`text-[10px] mt-1.5 text-right ${m.from === 'me' ? 'text-white/70' : 'text-ast-gray'}`}>{m.time}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-4 bg-white border-t border-black/8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => alert('Attachment upload ready')}
              className="p-2.5 rounded-xl border border-black/15 text-ast-gray hover:text-black hover:bg-ast-surface transition-colors shrink-0"
            >
              <Paperclip size={18} />
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Type your message..."
              className="flex-1 bg-ast-surface rounded-xl px-4 py-3 text-sm outline-none text-black placeholder:text-ast-gray border border-black/5"
            />
            <button
              onClick={send}
              className="w-11 h-11 rounded-xl bg-ast-primary flex items-center justify-center text-white hover:bg-ast-dark transition-colors shrink-0 shadow-sm"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE CUSTOM OFFER MODAL WITH MILESTONES */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-black/10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/8 pb-3">
              <h3 className="font-heading font-bold text-xl text-black flex items-center gap-2">
                <DollarSign size={20} className="text-ast-primary" /> Propose Custom Offer
              </h3>
              <button onClick={() => setShowOfferModal(false)} className="text-ast-gray hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ast-dark mb-1.5">Offer Scope Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5 Next.js Pages + Stripe Integration"
                  value={offerTitle}
                  onChange={e => setOfferTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-ast-primary"
                />
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ast-dark">Payment Structure</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOfferPaymentMode('FULL_JOB')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                      offerPaymentMode === 'FULL_JOB'
                        ? 'border-ast-primary bg-ast-primary/5 ring-1 ring-ast-primary'
                        : 'border-black/10 bg-white'
                    }`}
                  >
                    🚀 Full Job Escrow (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferPaymentMode('MILESTONE')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                      offerPaymentMode === 'MILESTONE'
                        ? 'border-ast-primary bg-ast-primary/5 ring-1 ring-ast-primary'
                        : 'border-black/10 bg-white'
                    }`}
                  >
                    📑 Milestone Phases
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ast-dark mb-1.5">Total Price (TND) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 350"
                    value={offerPrice}
                    onChange={e => setOfferPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-ast-primary font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ast-dark mb-1.5">Delivery Timeline *</label>
                  <select
                    value={offerDelivery}
                    onChange={e => setOfferDelivery(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm bg-white"
                  >
                    <option value="1">1 Day (Express)</option>
                    <option value="3">3 Days</option>
                    <option value="5">5 Days</option>
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                  </select>
                </div>
              </div>

              {/* Milestone Fixer in Offer Modal */}
              {offerPaymentMode === 'MILESTONE' && (
                <div className="bg-ast-surface/50 border border-black/10 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-black">
                    <span className="flex items-center gap-1.5">
                      <Layers size={14} className="text-ast-primary" /> Fix Milestones & Pricing
                    </span>
                    <span className="text-[11px] text-ast-primary">
                      Sum: {offerMilestones.reduce((s, m) => s + (Number(m.amount) || 0), 0)} / {offerPrice || 0} TND
                    </span>
                  </div>

                  <div className="space-y-2">
                    {offerMilestones.map((ms, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-black/8 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            required
                            value={ms.title}
                            onChange={e => {
                              const copy = [...offerMilestones]
                              copy[idx].title = e.target.value
                              setOfferMilestones(copy)
                            }}
                            placeholder={`Milestone ${idx + 1} Deliverable`}
                            className="w-full text-xs font-medium border-b border-black/10 pb-0.5 outline-none focus:border-ast-primary"
                          />
                          {offerMilestones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setOfferMilestones(offerMilestones.filter((_, i) => i !== idx))}
                              className="text-ast-gray hover:text-red-500 p-0.5"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <label className="text-[10px] text-ast-gray block">Amount (TND)</label>
                            <input
                              type="number"
                              min={5}
                              required
                              value={ms.amount}
                              onChange={e => {
                                const copy = [...offerMilestones]
                                copy[idx].amount = parseFloat(e.target.value) || 0
                                setOfferMilestones(copy)
                              }}
                              className="w-full border border-black/10 rounded-lg px-2 py-0.5 text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-ast-gray block">Days</label>
                            <input
                              type="number"
                              min={1}
                              required
                              value={ms.deliveryDays}
                              onChange={e => {
                                const copy = [...offerMilestones]
                                copy[idx].deliveryDays = parseInt(e.target.value) || 1
                                setOfferMilestones(copy)
                              }}
                              className="w-full border border-black/10 rounded-lg px-2 py-0.5 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setOfferMilestones(prev => [...prev, { title: `Milestone ${prev.length + 1}`, amount: 50, deliveryDays: 2 }])}
                    className="w-full py-1.5 border border-dashed border-ast-primary/40 rounded-xl text-xs font-semibold text-ast-primary hover:bg-ast-primary/5 flex items-center justify-center gap-1"
                  >
                    <Plus size={12} /> Add Milestone
                  </button>
                </div>
              )}

              {/* Commission Summary */}
              <div className="bg-ast-surface rounded-xl p-3 text-xs space-y-1 border border-black/5">
                <div className="flex justify-between text-ast-gray">
                  <span>Asteria Platform Fee (12%):</span>
                  <span className="font-semibold text-red-600">-{Math.round((parseFloat(offerPrice) || 0) * 0.12 * 100) / 100} TND</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600 pt-1 border-t border-black/5">
                  <span>Net Payout to You (88%):</span>
                  <span>{Math.round((parseFloat(offerPrice) || 0) * 0.88 * 100) / 100} TND</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-ast-gray hover:bg-ast-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={offerSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-ast-primary text-white hover:bg-ast-dark shadow-sm disabled:opacity-50"
                >
                  {offerSubmitting ? 'Sending...' : 'Send Custom Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
