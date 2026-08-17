'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { categories } from '@/lib/data/categories'
import { Check, Trash2, UploadCloud, Loader2, Image as ImageIcon, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Gig {
  id: string
  title: string
  description: string
  category: string
  price: number
  deliveryDays: number
  tags: string[]
  featured: boolean
  image?: string
}

export function GigEditForm({ gig }: { gig: Gig }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title:        gig.title,
    description:  gig.description,
    category:     gig.category,
    price:        String(gig.price),
    deliveryDays: String(gig.deliveryDays),
    tags:         (gig.tags ?? []).join(', '),
    image:        gig.image ?? '',
  })

  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showDel, setShowDel] = useState(false)

  const handle = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result) setForm(f => ({ ...f, image: reader.result as string }))
    }
    reader.readAsDataURL(file)

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

      if (data.url) setForm(f => ({ ...f, image: data.url }))
    } catch (err: any) {
      console.warn('Image upload fallback to local reader:', err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/gigs/${gig.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteGig = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/gigs/${gig.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.push('/dashboard/gigs')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={save} className="bg-white rounded-3xl border border-black/8 p-8 space-y-5 shadow-sm">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Cover Image Uploader */}
      <div>
        <label className="block text-xs font-semibold text-black mb-1.5">Cover Image</label>
        <div
          onClick={() => !uploadingImage && fileInputRef.current?.click()}
          className={`relative w-full aspect-video max-h-56 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${
            form.image ? 'border-ast-primary/50' : 'border-black/15 hover:border-ast-primary hover:bg-ast-surface/50'
          }`}
        >
          {form.image ? (
            <div className="relative w-full h-full">
              <img src={form.image} alt="Gig Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-2">
                <UploadCloud size={16} /> Click to change cover photo
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              {uploadingImage ? (
                <Loader2 size={24} className="text-ast-primary animate-spin mb-2 mx-auto" />
              ) : (
                <UploadCloud size={24} className="text-ast-primary mb-2 mx-auto" />
              )}
              <p className="text-xs font-bold text-black">{uploadingImage ? 'Processing...' : 'Upload cover photo'}</p>
            </div>
          )}
          <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageUpload} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-black mb-1.5">Gig Title</label>
        <input value={form.title} onChange={handle('title')} required maxLength={80}
          className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-ast-primary font-medium" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-black mb-1.5">Category</label>
        <select value={form.category} onChange={handle('category')} required
          className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-ast-primary bg-white font-medium">
          {categories.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-black mb-1.5">Description</label>
        <textarea value={form.description} onChange={handle('description')} required rows={5} maxLength={2000}
          className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-ast-primary resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-black mb-1.5">Starting Price (TND)</label>
          <input type="number" min={5} max={5000} value={form.price} onChange={handle('price')} required
            className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-ast-primary font-bold" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-black mb-1.5">Delivery (days)</label>
          <input type="number" min={1} max={90} value={form.deliveryDays} onChange={handle('deliveryDays')} required
            className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-ast-primary" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-black mb-1.5">Tags</label>
        <input value={form.tags} onChange={handle('tags')}
          placeholder="React, TypeScript, Next.js (comma-separated)"
          className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-ast-primary" />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-black/5">
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 bg-ast-primary text-white rounded-xl px-6 py-2.5 text-xs font-bold hover:bg-ast-dark transition-colors disabled:opacity-60 shadow-sm">
            {loading ? 'Saving…' : <><Check size={14} /> Save Changes</>}
          </button>
          <AnimatePresence>
            {saved && (
              <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="text-xs text-emerald-600 font-bold">✓ Changes saved</motion.span>
            )}
          </AnimatePresence>
        </div>

        <button type="button" onClick={() => setShowDel(true)}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl px-3 py-2 transition-colors">
          <Trash2 size={13} /> Delete Gig
        </button>
      </div>

      {showDel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-3">
            <h3 className="font-heading font-bold text-black text-lg">Delete this gig?</h3>
            <p className="text-ast-gray text-xs">This action cannot be undone. All active orders linked to this gig will remain in escrow.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={deleteGig} disabled={deleting}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button onClick={() => setShowDel(false)} className="flex-1 border border-black/15 text-black rounded-xl py-2.5 text-xs font-semibold hover:bg-ast-surface transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
