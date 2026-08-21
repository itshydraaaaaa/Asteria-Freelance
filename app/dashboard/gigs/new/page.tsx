'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { categories } from '@/lib/data/categories'
import { Check, ChevronRight, Image as ImageIcon, Loader2, Sparkles, X, UploadCloud, RefreshCw, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AIAssistantModal } from '@/components/ai/AIAssistantModal'

const STEPS = ['Basic Info & Cover', 'Details & Pricing', 'Tags & Publish']

interface Form {
  title: string
  description: string
  category: string
  price: string
  deliveryDays: string
  tags: string
  image: string
}

const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
]

const EMPTY: Form = {
  title: '',
  description: '',
  category: '',
  price: '99',
  deliveryDays: '7',
  tags: '',
  image: DEFAULT_COVERS[0],
}

export default function NewGigPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(0)
  const [dir,  setDir]  = useState(1)
  const [form, setForm] = useState<Form>(EMPTY)

  const [loading, setLoading] = useState(false)
  const [verifLoading, setVerifLoading] = useState(true)
  const [verifiedStatus, setVerifiedStatus] = useState<string>('APPROVED')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
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

  const handle = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  // Direct Gig Image Upload Handler with Instant Local Preview & API Sync
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. Instant local FileReader preview
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result) {
        setForm(f => ({ ...f, image: reader.result as string }))
      }
    }
    reader.readAsDataURL(file)

    // 2. Upload to server
    setUploadingImage(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'gigs')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')

      if (data.url) {
        setForm(f => ({ ...f, image: data.url }))
      }
    } catch (err: any) {
      console.warn('Upload fallback to local reader result:', err.message)
      // Keep local preview if server upload encounters minor error
    } finally {
      setUploadingImage(false)
    }
  }

  const next = () => { setDir(1);  setStep(s => s + 1) }
  const prev = () => { setDir(-1); setStep(s => s - 1) }

  const publish = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          deliveryDays: Number(form.deliveryDays),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create gig')

      setSuccess(true)
      router.refresh()
      setTimeout(() => router.push('/dashboard/gigs'), 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const variants = {
    enter:  (d: number) => ({ x: d * 60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d * -60, opacity: 0 }),
  }

  if (verifLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-ast-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (verifiedStatus !== 'APPROVED') {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="bg-white rounded-3xl border border-black/8 p-8 md:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="font-heading font-bold text-2xl text-black">Identity Verification Required</h2>
            <p className="text-ast-gray text-xs mt-2 leading-relaxed max-w-md mx-auto">
              To guarantee client protection and safe escrow payouts, freelancers must have their KYC identity verified before publishing services. You can watch and explore open jobs and marketplace gigs freely.
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

  if (success) {
    return (
      <div className="flex items-center justify-center py-24">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-16 h-16 rounded-full bg-ast-muted flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-ast-primary" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-black mb-2">Gig Published Successfully!</h2>
          <p className="text-ast-gray text-sm">Redirecting to your gigs management dashboard…</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-black mb-1">Create a New Gig</h1>
        <p className="text-ast-gray text-xs">List your freelance service with escrow milestones in Tunisian Dinar (TND).</p>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < step  ? 'bg-ast-light text-ast-dark' :
              i === step ? 'bg-ast-primary text-white ring-4 ring-ast-primary/25' :
                           'border border-black/20 text-ast-gray'
            }`}>
              {i < step ? <Check size={13} /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? 'font-medium text-black' : 'text-ast-gray'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="w-6 h-0.5 bg-black/10 mx-1" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-black/8 overflow-hidden shadow-sm">
        {error && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 text-xs px-8 py-3">{error}</div>
        )}

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="p-8 space-y-5"
          >
            {step === 0 && (
              <>
                <h2 className="font-heading font-bold text-xl text-black">{STEPS[0]}</h2>

                {/* Gig Cover Image Uploader */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-black">
                      Gig Cover Photo <span className="text-ast-primary">*</span>
                    </label>
                    {form.image && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, image: '' }))}
                        className="text-[11px] text-red-500 hover:underline flex items-center gap-1"
                      >
                        <X size={12} /> Remove
                      </button>
                    )}
                  </div>

                  <div
                    onClick={() => !uploadingImage && fileInputRef.current?.click()}
                    className={`relative w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${
                      form.image ? 'border-ast-primary/50' : 'border-black/15 hover:border-ast-primary hover:bg-ast-surface/50'
                    }`}
                  >
                    {form.image ? (
                      <div className="relative w-full h-full">
                        <img src={form.image} alt="Gig Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-2">
                          <UploadCloud size={16} /> Click to change image
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        {uploadingImage ? (
                          <Loader2 size={28} className="text-ast-primary animate-spin mb-2 mx-auto" />
                        ) : (
                          <UploadCloud size={28} className="text-ast-primary mb-2 mx-auto" />
                        )}
                        <p className="text-xs font-bold text-black">{uploadingImage ? 'Processing image...' : 'Upload gig cover image'}</p>
                        <p className="text-[11px] text-ast-gray mt-1">PNG, JPG, WebP up to 10MB (16:9 ratio recommended)</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageUpload} />
                  </div>

                  {/* Preset Covers Selector */}
                  <div className="mt-3">
                    <p className="text-[11px] text-ast-gray mb-1.5">Or choose a preset cover:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {DEFAULT_COVERS.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, image: c }))}
                          className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                            form.image === c ? 'border-ast-primary ring-2 ring-ast-primary/20' : 'border-black/10 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={c} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-ast-muted/60 p-4 rounded-2xl border border-ast-primary/20">
                  <div>
                    <p className="font-bold text-xs text-ast-dark flex items-center gap-1.5">
                      <Sparkles size={14} className="text-ast-primary" /> AI Freelancer Gig Generator
                    </p>
                    <p className="text-[11px] text-ast-gray">Generate service titles, scopes & pricing suggestions with AI</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiModal(true)}
                    className="bg-ast-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-ast-dark transition-colors shadow-sm"
                  >
                    AI Draft Gig
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">Gig Title <span className="text-red-500">*</span></label>
                  <input
                    value={form.title} onChange={handle('title')} required maxLength={80}
                    placeholder="e.g. I will build a production-ready Next.js SaaS app with payments"
                    className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-ast-primary font-medium"
                  />
                  <p className="text-[10px] text-ast-gray mt-1">{form.title.length}/80 characters</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">Category <span className="text-red-500">*</span></label>
                  <select
                    value={form.category} onChange={handle('category')} required
                    className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-ast-primary bg-white font-medium"
                  >
                    <option value="">Select a category</option>
                    {categories.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">Description <span className="text-red-500">*</span></label>
                  <textarea
                    value={form.description} onChange={handle('description')} required rows={5} maxLength={2000}
                    placeholder="Describe what you offer, what's included, your process, and what clients can expect…"
                    className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-ast-primary resize-none"
                  />
                  <p className="text-[10px] text-ast-gray mt-1">{form.description.length}/2000</p>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="font-heading font-bold text-xl text-black">{STEPS[1]}</h2>
                <div>
                  <label className="block text-xs font-semibold text-black mb-2">
                    Starting Price: <span className="text-ast-primary font-bold">{form.price} TND</span> (88% Net Payout: {Math.round(parseFloat(form.price || '0') * 0.88 * 100) / 100} TND)
                  </label>
                  <input
                    type="range" min={15} max={5000} step={5} value={form.price} onChange={handle('price')}
                    className="w-full accent-ast-primary h-2 rounded-full"
                  />
                  <div className="flex justify-between text-[11px] text-ast-gray mt-1"><span>15 TND</span><span>5,000 TND</span></div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">Exact Price (TND)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray text-xs font-bold">TND</span>
                    <input
                      type="number" min={15} max={5000} value={form.price} onChange={handle('price')}
                      className="w-full pl-12 pr-4 border border-black/15 rounded-xl py-2.5 text-xs outline-none focus:border-ast-primary font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-2">
                    Delivery Timeline: <span className="text-ast-primary font-bold">{form.deliveryDays} day{Number(form.deliveryDays) !== 1 ? 's' : ''}</span>
                  </label>
                  <input
                    type="range" min={1} max={30} step={1} value={form.deliveryDays} onChange={handle('deliveryDays')}
                    className="w-full accent-ast-primary h-2 rounded-full"
                  />
                  <div className="flex justify-between text-[11px] text-ast-gray mt-1"><span>1 day</span><span>30 days</span></div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-heading font-bold text-xl text-black">{STEPS[2]}</h2>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">Skills & Tags</label>
                  <input
                    value={form.tags} onChange={handle('tags')}
                    placeholder="React, TypeScript, Next.js (comma-separated)"
                    className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-ast-primary"
                  />
                  <p className="text-[11px] text-ast-gray mt-1">Add tags to help clients find your service.</p>
                </div>

                <div className="bg-ast-surface rounded-2xl p-5 space-y-3">
                  <h3 className="font-semibold text-black text-sm">Review your gig summary</h3>
                  {[
                    ['Title',    form.title || '—'],
                    ['Category', form.category || '—'],
                    ['Price',    `${form.price} TND`],
                    ['Delivery', `${form.deliveryDays} day(s)`],
                    ['Tags',     form.tags || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs border-b border-black/5 pb-2 last:border-0 last:pb-0">
                      <span className="text-ast-gray">{k}</span>
                      <span className="font-medium text-black text-right max-w-xs truncate">{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center px-8 pb-8">
          <button onClick={prev} disabled={step === 0}
            className="text-xs font-semibold text-ast-gray hover:text-black disabled:opacity-30 transition-colors px-3 py-2">
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              disabled={
                (step === 0 && (!form.title || !form.category || !form.description)) ||
                (step === 1 && !form.price)
              }
              className="flex items-center gap-2 bg-ast-primary text-white rounded-xl px-6 py-2.5 text-xs font-bold hover:bg-ast-dark transition-colors disabled:opacity-50 shadow-sm"
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={publish}
              disabled={loading}
              className="flex items-center gap-2 bg-ast-primary text-white rounded-xl px-6 py-2.5 text-xs font-bold hover:bg-ast-dark transition-colors disabled:opacity-60 shadow-sm"
            >
              {loading ? 'Publishing…' : <><Check size={14} /> Publish Gig</>}
            </button>
          )}
        </div>
      </div>

      <AIAssistantModal
        mode="GIG_GENERATOR"
        titleContext={form.title}
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onInsertText={(text, extra) => {
          setForm(f => ({
            ...f,
            description: text,
            price: extra?.price ? String(extra.price) : f.price
          }))
        }}
      />
    </div>
  )
}