'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Send, Search, DollarSign, Paperclip, CheckCircle2, Clock, X,
  FileText, MessageSquare, Layers, Plus, Trash2, ShieldCheck,
  User, ArrowRight, RefreshCw, Check
} from 'lucide-react'
import Link from 'next/link'

interface MessageRecord {
  id: string
  senderId: string
  receiverId: string
  content: string
  msgType: 'TEXT' | 'CUSTOM_OFFER' | 'FILE'
  offerData?: any
  isRead: boolean
  createdAt: string
}

interface PartnerProfile {
  id: string
  name: string
  email: string
  role: string
  avatar: string
  image?: string
  lastMessage: string
  lastTime: string
  unread: number
}

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryUser = searchParams.get('user') || searchParams.get('new')

  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [partners, setPartners] = useState<PartnerProfile[]>([])
  const [activePartnerId, setActivePartnerId] = useState<string>(queryUser || '')
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Custom Offer Modal State
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerTitle, setOfferTitle] = useState('')
  const [offerPrice, setOfferPrice] = useState('350')
  const [offerDelivery, setOfferDelivery] = useState('4')
  const [offerPaymentMode, setOfferPaymentMode] = useState<'FULL_JOB' | 'MILESTONE'>('FULL_JOB')
  const [offerMilestones, setOfferMilestones] = useState([
    { title: 'Milestone 1: Design Specs & Architecture', amount: 150, deliveryDays: 2 },
    { title: 'Milestone 2: Final Implementation & Handoff', amount: 200, deliveryDays: 2 },
  ])
  const [offerSubmitting, setOfferSubmitting] = useState(false)
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 1. Fetch conversations & active partner messages
  const fetchMessages = async (showLoadingState = false) => {
    try {
      if (showLoadingState) setLoading(true)
      const url = activePartnerId
        ? `/api/messages?partnerId=${encodeURIComponent(activePartnerId)}`
        : '/api/messages'
      const res = await fetch(url)
      const data = await res.json()

      if (res.ok) {
        setCurrentUserId(data.currentUserId || '')
        setPartners(data.partners || [])
        setMessages(data.messages || [])

        // If no active partner is selected yet and partners exist, pick the first one
        if (!activePartnerId && data.partners && data.partners.length > 0) {
          setActivePartnerId(data.partners[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to load chat messages:', err)
    } finally {
      if (showLoadingState) setLoading(false)
    }
  }

  useEffect(() => {
    if (queryUser) {
      setActivePartnerId(queryUser)
    }
  }, [queryUser])

  useEffect(() => {
    fetchMessages(true)
    const interval = setInterval(() => fetchMessages(false), 4000)
    return () => clearInterval(interval)
  }, [activePartnerId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 2. Send Text Message
  const handleSendMessage = async () => {
    if (!input.trim() || !activePartnerId) return

    const tempContent = input.trim()
    setInput('')

    try {
      setSending(true)
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: activePartnerId,
          content: tempContent,
          msgType: 'TEXT',
        }),
      })

      if (res.ok) {
        await fetchMessages(false)
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  // 3. Send Custom Offer
  const handleSendCustomOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offerTitle || !offerPrice || !activePartnerId) return

    const numericPrice = parseFloat(offerPrice) || 0
    const milestonesSum = offerMilestones.reduce((s, m) => s + (Number(m.amount) || 0), 0)

    if (offerPaymentMode === 'MILESTONE' && Math.abs(milestonesSum - numericPrice) > 1) {
      alert(`The sum of milestones (${milestonesSum} TND) must equal the total offer price (${numericPrice} TND)`)
      return
    }

    try {
      setOfferSubmitting(true)
      const offerData = {
        id: `off_${Date.now()}`,
        title: offerTitle,
        price: numericPrice,
        deliveryDays: parseInt(offerDelivery, 10),
        paymentMode: offerPaymentMode,
        milestones: offerPaymentMode === 'MILESTONE' ? offerMilestones : undefined,
        status: 'PENDING',
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: activePartnerId,
          content: `Custom Offer: ${offerTitle} (${numericPrice} TND)`,
          msgType: 'CUSTOM_OFFER',
          offerData,
        }),
      })

      if (res.ok) {
        setShowOfferModal(false)
        setOfferTitle('')
        await fetchMessages(false)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send custom offer')
    } finally {
      setOfferSubmitting(false)
    }
  }

  // 4. Accept Custom Offer & Fund Escrow
  const handleAcceptOffer = async (offerData: any, sellerId: string, messageId: string) => {
    try {
      setAcceptingOfferId(offerData.id || messageId)
      const res = await fetch('/api/messages/offer/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerData,
          sellerId,
          messageId,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to accept offer')
        return
      }

      // Redirect buyer directly to the created active order workspace
      router.push(`/dashboard/orders/${data.orderId}`)
    } catch (err: any) {
      alert(err.message || 'Failed to accept offer')
    } finally {
      setAcceptingOfferId(null)
    }
  }

  const activePartner = partners.find(p => p.id === activePartnerId) || (
    activePartnerId
      ? {
          id: activePartnerId,
          name: `Freelancer (${activePartnerId.slice(0, 8)})`,
          email: '',
          role: 'FREELANCER',
          avatar: 'F',
          lastMessage: 'Starting conversation',
          lastTime: 'Now',
          unread: 0,
        }
      : null
  )

  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.role.toLowerCase().includes(search.toLowerCase())
  )

  const numericOfferPrice = parseFloat(offerPrice) || 0
  const offerMilestonesSum = offerMilestones.reduce((s, m) => s + (Number(m.amount) || 0), 0)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col sm:flex-row bg-white rounded-3xl border border-black/8 overflow-hidden shadow-sm">
      {/* ── SIDEBAR: CONTACT LIST ────────────────────────────────────────── */}
      <div className="w-full sm:w-80 lg:w-96 border-r border-black/8 flex flex-col bg-ast-surface/30">
        <div className="p-4 border-b border-black/8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-lg text-black flex items-center gap-2">
              <MessageSquare size={18} className="text-ast-primary" /> Messages
            </h2>
            <span className="text-xs bg-ast-primary/10 text-ast-primary font-bold px-2 py-0.5 rounded-full">
              {partners.length} Chats
            </span>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-black/10 text-xs outline-none focus:border-ast-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-black/5">
          {filteredPartners.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePartnerId(p.id)}
              className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                activePartnerId === p.id
                  ? 'bg-white border-l-4 border-l-ast-primary shadow-2xs'
                  : 'hover:bg-ast-surface/60'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-ast-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                {p.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-semibold text-xs text-black truncate">{p.name}</p>
                  <span className="text-[10px] text-ast-gray">{p.lastTime}</span>
                </div>
                <span className="inline-block text-[10px] font-semibold text-ast-primary bg-ast-muted px-2 py-0.2 rounded-full mb-1">
                  {p.role}
                </span>
                <p className="text-xs text-ast-gray truncate">{p.lastMessage}</p>
              </div>
              {p.unread > 0 && (
                <span className="w-4 h-4 rounded-full bg-ast-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {p.unread}
                </span>
              )}
            </button>
          ))}

          {filteredPartners.length === 0 && (
            <div className="p-8 text-center text-ast-gray text-xs">
              No conversation threads found.
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CHAT WINDOW ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white">
        {activePartner ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-black/8 flex items-center justify-between bg-white shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-ast-dark text-white flex items-center justify-center font-bold text-sm">
                  {activePartner.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-black">{activePartner.name}</h3>
                  <p className="text-[11px] text-ast-gray flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Online · {activePartner.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-ast-primary text-white text-xs font-semibold hover:bg-ast-dark transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <DollarSign size={13} /> Create Custom Offer
                </button>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-ast-surface/20">
              {messages.map(msg => {
                const isMe = msg.senderId === currentUserId
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {msg.msgType === 'CUSTOM_OFFER' && msg.offerData ? (
                      /* CUSTOM OFFER CARD */
                      <div className="max-w-md w-full bg-white rounded-3xl p-5 border border-ast-primary/30 shadow-md space-y-4 my-2">
                        <div className="flex items-center justify-between border-b border-black/8 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-ast-primary/10 text-ast-primary flex items-center justify-center">
                              <DollarSign size={16} />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-ast-primary uppercase tracking-wider block">Custom Escrow Offer</span>
                              <h4 className="font-bold text-sm text-black">{msg.offerData.title}</h4>
                            </div>
                          </div>
                          <span className="font-heading font-bold text-xl text-emerald-700">
                            {msg.offerData.price} TND
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-ast-gray">
                          <span className="flex items-center gap-1">
                            <Clock size={13} /> {msg.offerData.deliveryDays} Days Delivery
                          </span>
                          <span className="flex items-center gap-1">
                            <ShieldCheck size={13} className="text-emerald-600" /> Escrow Protected
                          </span>
                        </div>

                        {/* Milestone List in Offer */}
                        {msg.offerData.milestones && msg.offerData.milestones.length > 0 && (
                          <div className="bg-ast-surface/50 p-3 rounded-2xl border border-black/5 space-y-2 text-xs">
                            <p className="font-bold text-[11px] text-black flex items-center gap-1">
                              <Layers size={13} className="text-ast-primary" /> Milestone Breakdown:
                            </p>
                            {msg.offerData.milestones.map((m: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl border border-black/5">
                                <span className="font-medium text-black">{idx + 1}. {m.title}</span>
                                <span className="font-bold text-emerald-700">{m.amount} TND</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Action: Buyer can Accept and Fund */}
                        {!isMe ? (
                          <button
                            type="button"
                            disabled={acceptingOfferId === msg.offerData.id}
                            onClick={() => handleAcceptOffer(msg.offerData, msg.senderId, msg.id)}
                            className="w-full bg-emerald-600 text-white rounded-2xl py-3 text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm flex items-center justify-center gap-2"
                          >
                            <Check size={14} />
                            {acceptingOfferId === msg.offerData.id
                              ? 'Funding Escrow...'
                              : `Accept & Fund Escrow (${msg.offerData.price} TND)`}
                          </button>
                        ) : (
                          <div className="text-center py-2 bg-ast-surface rounded-xl text-xs font-semibold text-ast-gray">
                            Sent to Client · Awaiting Acceptance
                          </div>
                        )}
                      </div>
                    ) : (
                      /* STANDARD TEXT MESSAGE BUBBLE */
                      <div
                        className={`max-w-sm sm:max-w-md px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                          isMe
                            ? 'bg-ast-dark text-white rounded-br-xs'
                            : 'bg-white text-black border border-black/8 rounded-bl-xs'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <span
                          className={`block text-[9px] mt-1 text-right ${
                            isMe ? 'text-white/60' : 'text-ast-gray'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-black/8 bg-white flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => alert('File attachment ready: Attach PDFs, Figma links, or code repositories.')}
                className="p-2.5 rounded-xl border border-black/15 text-ast-gray hover:text-black hover:bg-ast-surface transition-colors shrink-0"
                title="Attach Document"
              >
                <Paperclip size={17} />
              </button>

              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-ast-surface rounded-xl text-xs outline-none text-black placeholder:text-ast-gray border border-black/5 focus:border-ast-primary"
              />

              <button
                type="button"
                disabled={!input.trim() || sending}
                onClick={handleSendMessage}
                className="px-5 py-3 rounded-xl bg-ast-primary text-white text-xs font-semibold hover:bg-ast-dark transition-colors shrink-0 shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send size={13} />
                <span>Send</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-ast-gray">
            <MessageSquare size={40} className="text-ast-primary/30 mb-3" />
            <h3 className="font-semibold text-black text-sm mb-1">Select a Conversation</h3>
            <p className="text-xs max-w-xs">
              Choose a contact from the sidebar or click "Contact Freelancer" on any profile to begin chatting.
            </p>
          </div>
        )}
      </div>

      {/* ── CREATE CUSTOM OFFER MODAL ────────────────────────────────────── */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/8 pb-3">
              <div>
                <h3 className="font-heading font-bold text-xl text-black flex items-center gap-2">
                  <DollarSign size={20} className="text-ast-primary" /> Create Custom Offer
                </h3>
                <p className="text-xs text-ast-gray">Send custom terms and milestone schedule to client</p>
              </div>
              <button onClick={() => setShowOfferModal(false)} className="text-ast-gray hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendCustomOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ast-dark mb-1">Offer Scope Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full-Stack Next.js 14 Setup + Payment Rails"
                  value={offerTitle}
                  onChange={e => setOfferTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-xs outline-none focus:border-ast-primary font-medium"
                />
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ast-dark">Payment Structure</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setOfferPaymentMode('FULL_JOB')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      offerPaymentMode === 'FULL_JOB'
                        ? 'border-ast-primary bg-ast-primary/5 ring-1 ring-ast-primary font-bold text-black'
                        : 'border-black/10 text-ast-gray hover:text-black bg-white'
                    }`}
                  >
                    <span>🚀 Full Job (100%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOfferPaymentMode('MILESTONE')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      offerPaymentMode === 'MILESTONE'
                        ? 'border-ast-primary bg-ast-primary/5 ring-1 ring-ast-primary font-bold text-black'
                        : 'border-black/10 text-ast-gray hover:text-black bg-white'
                    }`}
                  >
                    <span>📑 Milestone Phases</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ast-dark mb-1">Total Price (TND) *</label>
                  <input
                    type="number"
                    min={10}
                    required
                    value={offerPrice}
                    onChange={e => setOfferPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-xs outline-none focus:border-ast-primary font-bold text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ast-dark mb-1">Delivery Timeline</label>
                  <select
                    value={offerDelivery}
                    onChange={e => setOfferDelivery(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-xs bg-white outline-none"
                  >
                    <option value="1">1 Day (Express)</option>
                    <option value="3">3 Days</option>
                    <option value="5">5 Days</option>
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                  </select>
                </div>
              </div>

              {/* Milestone Builder (if Milestone mode) */}
              {offerPaymentMode === 'MILESTONE' && (
                <div className="bg-ast-surface/60 rounded-2xl p-3.5 border border-black/10 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black flex items-center gap-1">
                      <Layers size={13} className="text-ast-primary" /> Milestones & Amounts
                    </span>
                    <span className={`font-bold text-[11px] ${Math.abs(offerMilestonesSum - numericOfferPrice) <= 1 ? 'text-emerald-600' : 'text-red-500'}`}>
                      Sum: {offerMilestonesSum} / {numericOfferPrice} TND
                    </span>
                  </div>

                  <div className="space-y-2">
                    {offerMilestones.map((m, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-black/10 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={m.title}
                            onChange={e => {
                              const copy = [...offerMilestones]
                              copy[idx].title = e.target.value
                              setOfferMilestones(copy)
                            }}
                            placeholder="Milestone description"
                            className="w-full text-xs font-semibold text-black border-b border-black/10 pb-0.5 outline-none"
                          />
                          {offerMilestones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setOfferMilestones(prev => prev.filter((_, i) => i !== idx))}
                              className="text-ast-gray hover:text-red-500 p-0.5"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-ast-gray block">Amount (TND)</label>
                            <input
                              type="number"
                              value={m.amount}
                              onChange={e => {
                                const copy = [...offerMilestones]
                                copy[idx].amount = parseFloat(e.target.value) || 0
                                setOfferMilestones(copy)
                              }}
                              className="w-full border border-black/10 rounded-lg px-2 py-1 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-ast-gray block">Days</label>
                            <input
                              type="number"
                              value={m.deliveryDays}
                              onChange={e => {
                                const copy = [...offerMilestones]
                                copy[idx].deliveryDays = parseInt(e.target.value) || 1
                                setOfferMilestones(copy)
                              }}
                              className="w-full border border-black/10 rounded-lg px-2 py-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setOfferMilestones(prev => [...prev, { title: `Milestone ${prev.length + 1}: Next Phase`, amount: 50, deliveryDays: 2 }])}
                    className="w-full py-1.5 border border-dashed border-ast-primary/40 rounded-xl text-xs font-semibold text-ast-primary hover:bg-ast-primary/5 flex items-center justify-center gap-1"
                  >
                    <Plus size={12} /> Add Milestone
                  </button>
                </div>
              )}

              {/* Commission Breakdown */}
              <div className="bg-ast-surface rounded-xl p-3 border border-black/5 text-xs space-y-1">
                <div className="flex justify-between text-ast-gray">
                  <span>Client Pays:</span>
                  <span className="font-semibold text-black">{numericOfferPrice} TND</span>
                </div>
                <div className="flex justify-between text-ast-gray">
                  <span>Asteria Fee (12%):</span>
                  <span className="font-semibold text-red-600">-{Math.round(numericOfferPrice * 0.12 * 100) / 100} TND</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-black/8 font-bold">
                  <span className="text-emerald-700">Net Freelancer Payout (88%):</span>
                  <span className="text-emerald-700">{Math.round(numericOfferPrice * 0.88 * 100) / 100} TND</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ast-gray hover:bg-ast-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={offerSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-ast-primary text-white hover:bg-ast-dark shadow-sm disabled:opacity-50"
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

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-ast-gray">Loading messages...</div>}>
      <MessagesContent />
    </Suspense>
  )
}
