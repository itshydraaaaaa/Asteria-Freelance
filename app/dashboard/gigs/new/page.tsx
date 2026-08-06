'use client'
import { useState, useRef }    from 'react'
import { useRouter }   from 'next/navigation'
import { categories }  from '@/lib/data/categories'
import { Check, ChevronRight, Image as ImageIcon, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = ['Basic Info', 'Details & Pricing', 'Tags & Publish']

interface Form {
  title: string
  description: string
  category: string
  price: string
  deliveryDays: string
  tags: string
  image: string // 👉 Added image to the form state
}

const EMPTY: Form = { title: '', description: '', category: '', price: '99', deliveryDays: '7', tags: '', image: '' }

export default function NewGigPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [step, setStep] = useState(0)
  const [dir,  setDir]  = useState(1)
  const [form, setForm] = useState<Form>(EMPTY)
  
  const [loading, setLoading]   = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error,   setError]     = useState('')
  const [success, setSuccess]   = useState(false)

  const handle = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  // 👉 Direct Gig Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'gigs') // 👉 Uploading to the gigs bucket

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')

      setForm(f => ({ ...f, image: data.url }))
    } catch (err: any) {
      setError(err.message)
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:        form.title,
          description:  form.description,
          category:     form.category,
          price:        parseFloat(form.price),
          deliveryDays: parseInt(form.deliveryDays, 10),
          tags:         form.tags,
          image:        form.image, // 👉 Send the image to the database!
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create gig')
      setSuccess(true)
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

  if (success) {
    return (
      <div className="flex items-center justify-center py-24">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-16 h-16 rounded-full bg-ast-muted flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-ast-primary" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-black mb-2">Gig Published!</h2>
          <p className="text-ast-gray text-sm">Redirecting to your gigs…</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-black mb-1">Create a New Gig</h1>
        <p className="text-ast-gray text-sm">List a service and start receiving orders from clients.</p>
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
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="p-8 space-y-5"
          >
            {step === 0 && (
              <>
                <h2 className="font-heading font-bold text-xl text-black">{STEPS[0]}</h2>
                
                {/* 👉 Gig Image Uploader */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Cover Image <span className="text-red-500">*</span></label>
                  <div 
                    onClick={() => !uploadingImage && fileInputRef.current?.click()}
                    className={`relative w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${form.image ? 'border-ast-primary/50' : 'border-black/15 hover:border-ast-primary hover:bg-ast-surface'}`}
                  >
                    {form.image ? (
                      <img src={form.image} alt="Gig Cover" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        {uploadingImage ? (
                          <Loader2 size={24} className="text-ast-primary animate-spin mb-2" />
                        ) : (
                          <ImageIcon size={24} className="text-ast-gray mb-2" />
                        )}
                        <p className="text-sm font-medium text-black">{uploadingImage ? 'Uploading...' : 'Click to upload'}</p>
                        <p className="text-xs text-ast-gray mt-1">16:9 ratio recommended</p>
                      </>
                    )}
                    <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageUpload} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Gig Title <span className="text-red-500">*</span></label>
                  <input
                    value={form.title} onChange={handle('title')} required maxLength={80}
                    placeholder="e.g. I will build a production-ready Next.js SaaS app"
                    className="w-full border border-black/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20"
                  />
                  <p className="text-xs text-ast-gray mt-1">{form.title.length}/80 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Category <span className="text-red-500">*</span></label>
                  <select
                    value={form.category} onChange={handle('category')} required
                    className="w-full border border-black/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-ast-primary bg-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Description <span className="text-red-500">*</span></label>
                  <textarea
                    value={form.description} onChange={handle('description')} required rows={5} maxLength={2000}
                    placeholder="Describe what you offer, what's included, your process, and what clients can expect…"
                    className="w-full border border-black/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 resize-none"
                  />
                  <p className="text-xs text-ast-gray mt-1">{form.description.length}/2000</p>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="font-heading font-bold text-xl text-black">{STEPS[1]}</h2>
                <div>
                  <label className="block text-sm font-medium text-black mb-3">
                    Starting Price: <span className="text-ast-primary font-bold">${form.price}</span>
                  </label>
                  <input
                    type="range" min={5} max={5000} step={5} value={form.price} onChange={handle('price')}
                    className="w-full accent-ast-primary h-2 rounded-full"
                  />
                  <div className="flex justify-between text-xs text-ast-gray mt-1"><span>$5</span><span>$5,000</span></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Starting Price (exact)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray text-sm">$</span>
                    <input
                      type="number" min={5} max={5000} value={form.price} onChange={handle('price')}
                      className="w-full pl-8 pr-4 border border-black/15 rounded-xl py-3 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-3">
                    Delivery Time: <span className="text-ast-primary font-bold">{form.deliveryDays} day{Number(form.deliveryDays) !== 1 ? 's' : ''}</span>
                  </label>
                  <input
                    type="range" min={1} max={30} step={1} value={form.deliveryDays} onChange={handle('deliveryDays')}
                    className="w-full accent-ast-primary h-2 rounded-full"
                  />
                  <div className="flex justify-between text-xs text-ast-gray mt-1"><span>1 day</span><span>30 days</span></div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-heading font-bold text-xl text-black">{STEPS[2]}</h2>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Tags</label>
                  <input
                    value={form.tags} onChange={handle('tags')}
                    placeholder="React, TypeScript, Next.js (comma-separated)"
                    className="w-full border border-black/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20"
                  />
                  <p className="text-xs text-ast-gray mt-1">Add up to 5 tags to help clients find your gig.</p>
                </div>

                <div className="bg-ast-surface rounded-2xl p-5 space-y-3">
                  <h3 className="font-semibold text-black text-sm">Review your gig</h3>
                  {[
                    ['Title',    form.title || '—'],
                    ['Category', form.category || '—'],
                    ['Price',    `$${form.price}`],
                    ['Delivery', `${form.deliveryDays} day(s)`],
                    ['Tags',     form.tags || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm border-b border-black/5 pb-2 last:border-0 last:pb-0">
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
            className="text-sm text-ast-gray hover:text-black disabled:opacity-30 transition-colors px-3 py-2">
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              disabled={
                (step === 0 && (!form.title || !form.category || !form.description || !form.image)) ||
                (step === 1 && !form.price)
              }
              className="flex items-center gap-2 bg-ast-primary text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-ast-dark transition-colors disabled:opacity-50"
            >
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={publish}
              disabled={loading}
              className="flex items-center gap-2 bg-ast-primary text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-ast-dark transition-colors disabled:opacity-60"
            >
              {loading ? 'Publishing…' : <><Check size={14} /> Publish Gig</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}