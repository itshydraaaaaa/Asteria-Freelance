'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageSquare, Clock, MapPin, Send, Check } from 'lucide-react'

const TOPICS = ['General Enquiry', 'Report a Problem', 'Billing & Payments', 'Account & Security', 'Partnership', 'Press & Media']

const FAQS = [
  { q: 'How do I get verified as a freelancer?',    a: 'Submit your ID and portfolio through the dashboard. Verification takes 24–48 hours and unlocks a verified badge on your profile.' },
  { q: 'What payment methods does Asteria support?', a: 'We support Stripe, PayPal, and Wise internationally, plus local options including Flouci, D17, and bank transfers for Tunisia.' },
  { q: 'Is there a commission fee?',                 a: 'Asteria charges a transparent 12% platform fee on completed escrow releases. Freelancers receive 88% net payout directly to their local or international wallet.' },
  { q: 'How does escrow work?',                      a: 'Client funds are held securely in escrow when an order is placed. Payment is released to the freelancer only after the client approves the delivery.' },
  { q: 'Can I cancel an order?',                    a: 'Orders can be mutually cancelled before delivery. Disputes after delivery are handled by our support team within 48 hours.' },
]

export default function ContactPage() {
  const [form,      setForm]      = useState({ name: '', email: '', topic: '', message: '' })
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [open,      setOpen]      = useState<number | null>(null)

  const handle = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-ast-surface pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-14">
          <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-3">Support</p>
          <h1 className="font-heading font-bold text-5xl text-black mb-3">Get in touch</h1>
          <p className="text-ast-gray text-lg">We typically respond within 2 business hours.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {[
            { Icon: Mail,        label: 'Email Us',         value: 'support@asteria.io',   sub: 'For all enquiries' },
            { Icon: MessageSquare, label: 'Live Chat',      value: 'Discord Community',    sub: 'Real-time help' },
            { Icon: Clock,       label: 'Response Time',    value: '< 2 hours',            sub: 'Business days' },
          ].map(({ Icon, label, value, sub }) => (
            <div key={label} className="bg-white rounded-2xl border border-black/8 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-ast-primary/10 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-ast-primary" />
              </div>
              <div>
                <p className="font-semibold text-black">{label}</p>
                <p className="text-ast-primary text-sm font-medium">{value}</p>
                <p className="text-ast-gray text-xs mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white rounded-3xl border border-black/8 p-8">
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-ast-muted flex items-center justify-center mx-auto mb-4">
                  <Check size={28} className="text-ast-primary" />
                </div>
                <h3 className="font-heading font-bold text-xl text-black mb-2">Message Sent!</h3>
                <p className="text-ast-gray text-sm">We&apos;ll get back to you at <span className="text-black font-medium">{form.email}</span> within 2 hours.</p>
              </motion.div>
            ) : (
              <>
                <h2 className="font-heading font-bold text-2xl text-black mb-6">Send a message</h2>
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Your Name</label>
                      <input value={form.name} onChange={handle('name')} required placeholder="Karim Benali"
                        className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Email</label>
                      <input type="email" value={form.email} onChange={handle('email')} required placeholder="you@email.com"
                        className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Topic</label>
                    <select value={form.topic} onChange={handle('topic')} required
                      className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-ast-primary bg-white">
                      <option value="">Select a topic…</option>
                      {TOPICS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Message</label>
                    <textarea value={form.message} onChange={handle('message')} required rows={5} placeholder="Describe your issue or question…"
                      className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 resize-none" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-ast-primary text-white rounded-xl py-3 font-semibold text-sm hover:bg-ast-dark transition-colors disabled:opacity-60">
                    {loading ? 'Sending…' : <><Send size={14} /> Send Message</>}
                  </button>
                </form>
              </>
            )}
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-black mb-6">Frequently asked questions</h2>
            <div className="space-y-3">
              {FAQS.map((f, i) => (
                <div key={i} className="bg-white rounded-2xl border border-black/8 overflow-hidden">
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="font-medium text-black text-sm pr-4">{f.q}</span>
                    <span className={`text-ast-primary text-lg shrink-0 transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  {open === i && (
                    <div className="px-5 pb-4 text-ast-gray text-sm leading-relaxed border-t border-black/5">
                      {f.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 bg-ast-dark rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-ast-light" />
                <span className="font-semibold text-sm">Headquartered in Tunis, Tunisia</span>
              </div>
              <p className="text-white/60 text-xs leading-relaxed">
                With team members across Dubai, Cairo, and Casablanca — we&apos;re a MENA-first company with a global mindset.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
