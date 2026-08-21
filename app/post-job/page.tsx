'use client'

import { useState, useEffect }     from 'react'
import { useRouter }          from 'next/navigation'
import Link                   from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft, Upload, Briefcase, Sparkles, ShieldAlert, ShieldCheck, ArrowRight } from 'lucide-react'
import { categories } from '@/lib/data/categories'
import { AIAssistantModal } from '@/components/ai/AIAssistantModal'

const STEPS = ['Describe', 'Budget & Timeline', 'Skills', 'Review & Post']

interface FormData {
  title:            string
  description:      string
  category:         string
  budget:           number
  deliveryDays:     number
  skills:           string
  paymentStructure: 'FULL_JOB' | 'MILESTONE'
}

const INITIAL: FormData = {
  title:            '',
  description:      '',
  category:         '',
  budget:           500,
  deliveryDays:     7,
  skills:           '',
  paymentStructure: 'FULL_JOB',
}

export default function PostJobPage() {
  const router  = useRouter()
  const [step,      setStep]      = useState(0)
  const [dir,       setDir]       = useState(1)
  const [form,      setForm]      = useState<FormData>(INITIAL)
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [verifLoading, setVerifLoading] = useState(true)
  const [verifiedStatus, setVerifiedStatus] = useState<string>('APPROVED')
  const [error,     setError]     = useState('')
  const [showAiModal, setShowAiModal] = useState(false)

  useEffect(() => {
    fetch('/api/user/verification')
      .then(res => res.json())
      .then(data => {
        if (data.verification?.status) {
          setVerifiedStatus(data.verification.status)
        } else {
          setVerifiedStatus('UNSUBMITTED')
        }
      })
      .catch(() => setVerifiedStatus('APPROVED'))
      .finally(() => setVerifLoading(false))
  }, [])

  const next = () => { setDir(1);  setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  const prev = () => { setDir(-1); setStep(s => Math.max(s - 1, 0)) }
  const handle = (field: keyof FormData) => (e: any) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/jobs', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to post job')
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const variants = {
    enter:  (d: number) => ({ x: d * 80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d * -80, opacity: 0 }),
  }

  if (verifLoading) {
    return (
      <div className="min-h-screen bg-ast-surface pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-ast-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (verifiedStatus !== 'APPROVED') {
    return (
      <div className="min-h-screen bg-ast-surface pt-24 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 text-center max-w-lg shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="font-heading font-bold text-2xl text-black">Identity Verification Required</h2>
            <p className="text-ast-gray text-xs mt-2 leading-relaxed max-w-md mx-auto">
              To secure escrow deposits and prevent fraudulent project postings, clients must verify their identity before publishing job briefs. You can watch and explore freelancer gigs freely.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard/verification"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-ast-primary text-white text-xs font-semibold px-6 py-3 rounded-full hover:bg-ast-dark transition-colors shadow-sm"
            >
              <ShieldCheck size={16} /> Complete KYC Verification
            </Link>
            <Link
              href="/explore"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-black/15 text-black text-xs font-semibold px-6 py-3 rounded-full hover:bg-ast-surface transition-colors"
            >
              Explore Gigs <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-ast-surface pt-24 flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-12 text-center max-w-md shadow-xl">
          <div className="w-16 h-16 rounded-full bg-ast-muted flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-ast-primary" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-black mb-3">Job Posted!</h2>
          <p className="text-ast-gray mb-8">Your project is live. Freelancers will start sending proposals shortly.</p>
          <div className="flex flex-col gap-3">
            <a href="/jobs" className="bg-ast-primary text-white rounded-full px-8 py-3 font-medium hover:bg-ast-dark transition-colors text-sm">
              View Job Board
            </a>
            <a href="/dashboard" className="border border-black/15 text-black rounded-full px-8 py-3 font-medium hover:bg-ast-surface transition-colors text-sm">
              Go to Dashboard
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ast-surface pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-ast-primary flex items-center justify-center">
            <Briefcase size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-3xl text-black">Post a Job</h1>
            <p className="text-ast-gray text-sm">Connect with elite MENA freelancers</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => i < step ? (setDir(-1), setStep(i)) : undefined}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step  ? 'bg-ast-light text-ast-dark cursor-pointer' :
                  i === step ? 'bg-ast-primary text-white ring-4 ring-ast-primary/30' :
                               'border border-black/20 text-ast-gray'
                }`}
              >
                {i < step ? <Check size={13} /> : i + 1}
              </button>
              <span className={`text-xs hidden sm:block ${i === step ? 'font-medium text-black' : 'text-ast-gray'}`}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 w-6 bg-black/10 relative mx-1">
                  <motion.div className="absolute inset-y-0 left-0 bg-ast-primary" animate={{ width: i < step ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-black/8 overflow-hidden">
          {error && (
            <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm px-8 py-3">{error}</div>
          )}

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="p-8"
            >
              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="font-heading font-bold text-xl text-black">{STEPS[0]}</h2>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Project Title <span className="text-red-500">*</span></label>
                    <input value={form.title} onChange={handle('title')} required
                      placeholder="e.g. Build a React dashboard for our analytics platform"
                      className="w-full border border-black/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-black">Description <span className="text-red-500">*</span></label>
                      <button
                        type="button"
                        onClick={() => setShowAiModal(true)}
                        className="text-xs text-ast-primary font-semibold flex items-center gap-1 bg-ast-muted px-3 py-1 rounded-full hover:bg-ast-primary hover:text-white transition-colors"
                      >
                        <Sparkles size={13} /> AI Draft Description
                      </button>
                    </div>
                    <textarea value={form.description} onChange={handle('description')} required rows={5}
                      placeholder="Describe your project in detail — what you need, scope, goals, references, tech stack preferences…"
                      className="w-full border border-black/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Category <span className="text-red-500">*</span></label>
                    <select value={form.category} onChange={handle('category')} required
                      className="w-full border border-black/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-ast-primary bg-white">
                      <option value="">Select a category</option>
                      {categories.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="font-heading font-bold text-xl text-black">{STEPS[1]}</h2>

                  {/* Payment Structure */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-black">Payment Escrow Structure</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, paymentStructure: 'FULL_JOB' }))}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          form.paymentStructure === 'FULL_JOB'
                            ? 'border-ast-primary bg-ast-primary/5 ring-2 ring-ast-primary/20'
                            : 'border-black/10 bg-white hover:border-black/20'
                        }`}
                      >
                        <span className="font-semibold text-xs text-black block mb-0.5">Fixed Price (Full Job)</span>
                        <p className="text-[11px] text-ast-gray">Pay 100% in escrow, released upon full completion.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, paymentStructure: 'MILESTONE' }))}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          form.paymentStructure === 'MILESTONE'
                            ? 'border-ast-primary bg-ast-primary/5 ring-2 ring-ast-primary/20'
                            : 'border-black/10 bg-white hover:border-black/20'
                        }`}
                      >
                        <span className="font-semibold text-xs text-black block mb-0.5">Milestone Payments</span>
                        <p className="text-[11px] text-ast-gray">Divide project into funded progressive phases.</p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-3">
                      Project Budget: <span className="text-ast-primary font-bold">{form.budget.toLocaleString()} TND</span>
                    </label>
                    <input type="range" min={25} max={10000} step={25} value={form.budget}
                      onChange={e => setForm(f => ({ ...f, budget: parseInt(e.target.value, 10) }))}
                      className="w-full accent-ast-primary h-2 rounded-full" />
                    <div className="flex justify-between text-xs text-ast-gray mt-1"><span>25 TND</span><span>10,000 TND</span></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Exact Budget (TND)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray text-sm">TND</span>
                      <input type="number" min={25} max={50000} value={form.budget}
                        onChange={e => setForm(f => ({ ...f, budget: parseInt(e.target.value, 10) }))}
                        className="w-full pl-12 pr-4 border border-black/15 rounded-xl py-3 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 font-semibold" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-3">
                      Delivery Timeline: <span className="text-ast-primary font-bold">{form.deliveryDays} day{form.deliveryDays !== 1 ? 's' : ''}</span>
                    </label>
                    <input type="range" min={1} max={90} step={1} value={form.deliveryDays}
                      onChange={e => setForm(f => ({ ...f, deliveryDays: parseInt(e.target.value, 10) }))}
                      className="w-full accent-ast-primary h-2 rounded-full" />
                    <div className="flex justify-between text-xs text-ast-gray mt-1"><span>1 day</span><span>90 days</span></div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="font-heading font-bold text-xl text-black">{STEPS[2]}</h2>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Required Skills</label>
                    <input value={form.skills} onChange={handle('skills')}
                      placeholder="React, TypeScript, Next.js, PostgreSQL (comma-separated)"
                      className="w-full border border-black/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20" />
                    <p className="text-xs text-ast-gray mt-1.5">List the key skills you need. This helps match you with the right freelancers.</p>
                  </div>
                  {form.skills && (
                    <div className="flex flex-wrap gap-2">
                      {form.skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                        <span key={s} className="text-xs bg-ast-surface text-ast-primary rounded-full px-3 py-1 border border-ast-primary/20 font-medium">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="font-heading font-bold text-xl text-black">{STEPS[3]}</h2>
                  {[
                    ['Title',      form.title || '—'],
                    ['Category',   form.category || '—'],
                    ['Budget',     `$${form.budget.toLocaleString()}`],
                    ['Delivery',   `${form.deliveryDays} day(s)`],
                    ['Skills',     form.skills || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-black/5 pb-3">
                      <span className="text-ast-gray text-sm">{k}</span>
                      <span className="font-medium text-black text-sm text-right max-w-xs">{v}</span>
                    </div>
                  ))}
                  {form.description && (
                    <div className="bg-ast-surface rounded-xl p-4">
                      <p className="text-xs text-ast-gray uppercase tracking-wider mb-2">Description</p>
                      <p className="text-sm text-ast-gray leading-relaxed line-clamp-4">{form.description}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center px-8 pb-8">
            <button onClick={prev} disabled={step === 0}
              className="flex items-center gap-2 text-sm text-ast-gray hover:text-black disabled:opacity-30 transition-colors">
              <ChevronLeft size={16} /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                disabled={step === 0 && (!form.title || !form.category || !form.description)}
                className="flex items-center gap-2 bg-ast-primary text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-ast-dark transition-colors disabled:opacity-50"
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 bg-ast-primary text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-ast-dark transition-colors disabled:opacity-60">
                {loading ? 'Posting…' : <><Check size={15} /> Post Job</>}
              </button>
            )}
          </div>
        </div>
      </div>

      <AIAssistantModal
        mode="JOB_DESCRIPTION"
        titleContext={form.title}
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onInsertText={(text) => setForm(f => ({ ...f, description: text }))}
      />
    </div>
  )
}
